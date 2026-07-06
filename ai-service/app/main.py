import logging

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.routes import forecast, anomaly, nlquery

# LOGGING

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
)
logger = logging.getLogger(__name__)

# APP

app = FastAPI(
    title="Vizura AI Service",
    description=(
        "AI microservice for the Vizura business operations platform. "
        "Provides ensemble revenue forecasting, anomaly detection, and "
        "natural language query-to-SQL capabilities."
    ),
    version="0.1.0",
)

# CORS - allows the react frontend and express backend to call this service
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ROUTERS

app.include_router(forecast.router, prefix="/forecast", tags=["Forecast"])
app.include_router(anomaly.router, prefix="/anomaly", tags=["Anomaly"])
app.include_router(nlquery.router, prefix="/nlquery", tags=["NL Query"])


# ROOT/HEALTH

@app.get("/")
def root():
    return {
        "service": "Vizura AI Service",
        "version": "0.1.0",
        "docs": "/docs",
        "endpoints": {
            "forecast": "/forecast/predict",
            "forecast_health": "/forecast/health",
            "anomaly": "/anomaly/detect",
            "anomaly_health": "/anomaly/health",
            "nlquery": "/nlquery/query",
            "nlquery_health": "/nlquery/health",
            "nlquery_examples": "/nlquery/examples",
        },
    }


@app.get("/health")
def full_health_check():
    """Aggregate health of all AI service modules."""
    from app.models.nlq_engine import get_nlq_engine
    from app.models.forecast_ensemble import get_forecast_ensemble
    from app.models.anomaly_detector import get_anomaly_detector

    health = {"status": "ok", "modules": {}}

    # NLQ
    try:
        nq = get_nlq_engine()
        health["modules"]["nlquery"] = {
            "ok": True,
            "mode": "t5" if nq.model else "fallback",
        }
    except Exception as e:
        health["modules"]["nlquery"] = {"ok": False, "error": str(e)}

    # Forecast
    try:
        fc = get_forecast_ensemble()
        health["modules"]["forecast"] = {
            "ok": True,
            "fitted": fc._fitted,
        }
    except Exception as e:
        health["modules"]["forecast"] = {"ok": False, "error": str(e)}

    # Anomaly
    try:
        ad = get_anomaly_detector()
        health["modules"]["anomaly"] = {
            "ok": True,
            "fitted": ad._fitted,
        }
    except Exception as e:
        health["modules"]["anomaly"] = {"ok": False, "error": str(e)}

    return health
