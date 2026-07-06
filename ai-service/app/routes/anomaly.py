"""
Anomaly Route — Sales Data Outlier Detection.

POST /anomaly/detect  — scan sales data and flag anomalies
POST /anomaly/fit     — train the detector on baseline data
GET  /anomaly/health  — check if the detector is fitted
"""

import logging
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field
from typing import Optional, List
import pandas as pd

from app.models.anomaly_detector import (
    AnomalyDetector,
    AnomalyReport,
    Anomaly,
    get_anomaly_detector,
)

logger = logging.getLogger(__name__)

router = APIRouter()

# SCHEMAS

class AnomalyDataPoint(BaseModel):
    """A single date and its revenue value."""
    date: str = Field(..., examples=["2026-01-15"])
    revenue: float = Field(..., gt=0, examples=[1250.50])


class AnomalyDetectRequest(BaseModel):
    """Request body for anomaly detection."""
    data: List[AnomalyDataPoint] = Field(..., min_length=10, max_length=5000)
    recent_only_days: int = Field(0, ge=0)
    business_id: Optional[str] = None


class AnomalyFitRequest(BaseModel):
    """Request body for training the anomaly detector."""
    data: List[AnomalyDataPoint] = Field(..., min_length=10, max_length=5000)
    contamination: float = Field(0.05, ge=0.01, le=0.3)


class AnomalyItem(BaseModel):
    """A flagged anomaly with severity, method, and explanation."""
    date: str
    value: float
    expected_value: Optional[float]
    deviation_pct: float
    severity: str  # "critical" or "warning"
    method: str     # "isolation_forest", "zscore", or "both"
    explanation: str


class AnomalyDetectResponse(BaseModel):
    """Detection response with summary and list of anomalies."""
    total_points: int
    anomalies_found: int
    anomaly_rate: float
    summary: str
    anomalies: List[AnomalyItem]
    business_id: Optional[str] = None


class HealthResponse(BaseModel):
    status: str
    detector_fitted: bool


# HELPERS

def _df_from_points(data: List[AnomalyDataPoint]) -> pd.DataFrame:
    """Convert a list of datapoints into a pandas DataFrame."""
    return pd.DataFrame([d.model_dump() for d in data])


def _anomaly_to_item(a: Anomaly) -> AnomalyItem:
    """Convert an Anomaly model object into an AnomalyItem response."""
    return AnomalyItem(
        date=a.date,
        value=a.value,
        expected_value=a.expected_value,
        deviation_pct=a.deviation_pct,
        severity=a.severity,
        method=a.method,
        explanation=a.explanation,
    )


# ROUTES

@router.post("/detect", response_model=AnomalyDetectResponse)
async def detect_anomalies(request: AnomalyDetectRequest):
    """Scan sales data for anomalies using Isolation Forest and Z-score."""
    try:
        df = _df_from_points(request.data)

        detector = get_anomaly_detector()
        detector.fit(df)  # re-fit on incoming data
        report: AnomalyReport = detector.detect(
            df,
            include_recent_only=request.recent_only_days,
        )

        return AnomalyDetectResponse(
            total_points=report.total_points,
            anomalies_found=report.anomalies_found,
            anomaly_rate=report.anomaly_rate,
            summary=report.summary,
            anomalies=[_anomaly_to_item(a) for a in report.anomalies],
            business_id=request.business_id,
        )

    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.exception("Anomaly detection failed")
        raise HTTPException(
            status_code=500,
            detail=f"Anomaly detection failed: {str(e)}",
        )


@router.post("/fit")
async def fit_detector(request: AnomalyFitRequest):
    """Fit the anomaly detector on historical baseline data."""
    try:
        df = _df_from_points(request.data)

        detector = AnomalyDetector(contamination=request.contamination)
        detector.fit(df)

        # runs detection to report current state
        report = detector.detect(df)

        return {
            "status": "fitted",
            "contamination": detector.contamination,
            "zscore_threshold": detector.zscore_threshold,
            "zscore_warning": detector.zscore_warning,
            "baseline_summary": report.summary,
            "baseline_anomalies_found": report.anomalies_found,
            "baseline_total_points": report.total_points,
        }

    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.exception("Anomaly detector fit failed")
        raise HTTPException(status_code=500, detail=f"Fit failed: {str(e)}")


@router.get("/health", response_model=HealthResponse)
async def health_check():
    """Check if the anomaly detector is fitted and operational."""
    detector = get_anomaly_detector()
    return HealthResponse(
        status="ok" if detector._fitted else "not_fitted",
        detector_fitted=detector._fitted,
    )