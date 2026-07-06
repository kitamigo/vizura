"""
Forecast Route — 30-Day Revenue Prediction.

POST /forecast/predict  — give it sales data, get back a 30-day ensemble forecast
POST /forecast/train    — train the model & optionally push to Hugging Face
GET  /forecast/health   — quick check if the model's loaded
"""

import logging
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field
from typing import Optional, List
import pandas as pd

from app.models.forecast_ensemble import ForecastEnsemble, ForecastResult, MODEL_REPO, get_forecast_ensemble

logger = logging.getLogger(__name__)

router = APIRouter()

# SCHEMAS

class DataPoint(BaseModel):
    """A single date and its revenue value."""
    date: str = Field(..., examples=["2026-01-15"])
    revenue: float = Field(..., gt=0, examples=[1250.50])


class ForecastRequest(BaseModel):
    """Request body for generating a forecast."""
    data: List[DataPoint] = Field(..., min_length=30, max_length=5000)
    days: int = Field(30, ge=7, le=90)
    business_id: Optional[str] = None


class TrainRequest(BaseModel):
    """Request body for training the ensemble model."""
    data: List[DataPoint] = Field(..., min_length=30, max_length=5000)
    push_to_hub: bool = False
    hf_token: Optional[str] = None


class ForecastResponse(BaseModel):
    """Forecast response with predictions from both models and the ensemble blend."""
    dates: List[str]
    ensemble_forecast: List[float]
    xgboost_forecast: List[float]
    prophet_forecast: List[float]
    lower_bound: List[float]
    upper_bound: List[float]
    xgb_weight: float
    prophet_weight: float
    rmse_xgb: Optional[float] = None
    rmse_prophet: Optional[float] = None
    metadata: dict
    business_id: Optional[str] = None


class HealthResponse(BaseModel):
    status: str
    model_loaded: bool
    model_repo: str


# HELPERS

def _df_from_datapoints(data: List[DataPoint]) -> pd.DataFrame:
    """Convert a list of DataPoints into a pandas DataFrame."""
    return pd.DataFrame([d.model_dump() for d in data])


# ROUTES

@router.post("/predict", response_model=ForecastResponse)
async def forecast_predict(request: ForecastRequest):
    """Generate a 30-day ensemble forecast with confidence intervals."""
    try:
        df = _df_from_datapoints(request.data)

        # minimum 30 days required for a meaningful forecast
        if len(df) < 30:
            raise HTTPException(
                status_code=400,
                detail="At least 30 days of historical data is required.",
            )

        # train ensemble and generate prediction
        ensemble = ForecastEnsemble()
        ensemble.fit(df, tune_weights=True)
        result: ForecastResult = ensemble.predict(days=request.days)

        return ForecastResponse(
            dates=result.dates,
            ensemble_forecast=result.ensemble_forecast,
            xgboost_forecast=result.xgboost_forecast,
            prophet_forecast=result.prophet_forecast,
            lower_bound=result.lower_bound,
            upper_bound=result.upper_bound,
            xgb_weight=result.xgb_weight,
            prophet_weight=result.prophet_weight,
            rmse_xgb=result.rmse_xgb,
            rmse_prophet=result.rmse_prophet,
            metadata=result.metadata,
            business_id=request.business_id,
        )

    except HTTPException:
        raise
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.exception("Forecast prediction failed")
        raise HTTPException(status_code=500, detail=f"Forecast failed: {str(e)}")


@router.post("/train")
async def forecast_train(request: TrainRequest):
    """Train the ensemble model and optionally push to Hugging Face. """
    try:
        df = _df_from_datapoints(request.data)

        ensemble = ForecastEnsemble()
        ensemble.fit(df, tune_weights=True)
        result: ForecastResult = ensemble.predict(30)

        response = {
            "status": "trained",
            "xgb_weight": ensemble.xgb_weight,
            "prophet_weight": ensemble.prophet_weight,
            "rmse_xgb": ensemble._rmse_xgb,
            "rmse_prophet": ensemble._rmse_prophet,
            "sample_forecast": {
                "dates": result.dates[:7],
                "ensemble_forecast": result.ensemble_forecast[:7],
            },
            "pushed_to_hub": False,
        }

        if request.push_to_hub:
            try:
                ensemble.push_to_hub(token=request.hf_token)
                response["pushed_to_hub"] = True
                response["hub_repo"] = MODEL_REPO
            except Exception as e:
                logger.error(f"Couldn't push to HF Hub: {e}")
                response["hub_error"] = str(e)

        return response

    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.exception("Model training failed")
        raise HTTPException(status_code=500, detail=f"Training failed: {str(e)}")


@router.get("/health", response_model=HealthResponse)
async def health_check():
    """Check if the forecast model is loaded and operational."""
    try:
        ensemble = get_forecast_ensemble()
        loaded = ensemble._fitted
    except Exception:
        loaded = False

    return HealthResponse(
        status="ok" if loaded else "degraded",
        model_loaded=loaded,
        model_repo=MODEL_REPO,
    )