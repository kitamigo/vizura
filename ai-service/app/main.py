from fastapi import FastAPI
from app.routes import forecast, anomaly, nlquery

app = FastAPI(title="Vizura AI Service")

app.include_router(forecast.router, prefix="/forecast", tags=["Forecast"])
app.include_router(anomaly.router, prefix="/anomaly", tags=["Anomaly"])
app.include_router(nlquery.router, prefix="/nlquery", tags=["NL Query"])

@app.get("/")
def root():
    return {"message": "Vizuras AI service is running"}