"""
NLQ Route — Natural Language Query endpoint.

POST /nlquery/query   — ask a question, get back SQL + an answer
GET  /nlquery/health  — check if the NLQ engine is operational
GET  /nlquery/examples — list of questions the system understands
"""

import logging
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field
from typing import Optional, List

from app.models.nlq_engine import get_nlq_engine

logger = logging.getLogger(__name__)

router = APIRouter()

# SCHEMAS

class NLQueryRequest(BaseModel):
    """Request body with a plain-English question about sales data."""
    question: str = Field(
        ...,
        min_length=3,
        max_length=500,
        examples=["What was my best performing month this year?"],
    )
    business_id: Optional[str] = None
    table_name: str = "sales"


class NLQueryResponse(BaseModel):
    """Response with generated SQL, natural language answer, and optional row data."""
    question: str
    sql: str
    answer: str
    data: Optional[List[dict]] = None
    mode: str  # "t5" or "rule_based"
    business_id: Optional[str] = None


class HealthResponse(BaseModel):
    status: str
    mode: str  # "t5_loaded" or "fallback_rule_based"
    model_repo: str


# ROUTES

@router.post("/query", response_model=NLQueryResponse)
async def natural_language_query(request: NLQueryRequest):
    """Convert a natural language question into SQL and a readable answer.

    Uses the T5 model (kitamigo/vizura-t5-nlq) when available,
    falling back to a rule-based engine for common sales questions.
    """
    try:
        engine = get_nlq_engine(table_name=request.table_name)
        result = engine.generate_query(request.question)

        return NLQueryResponse(
            question=result["question"],
            sql=result["sql"],
            answer=result["answer"],
            data=result.get("data"),
            mode=result["mode"],
            business_id=request.business_id,
        )
    except Exception as e:
        logger.exception("NLQ query failed")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to process query: {str(e)}",
        )


@router.get("/health", response_model=HealthResponse)
async def health_check():
    """Check if the T5 model is loaded or if fallback mode is active."""
    engine = get_nlq_engine()
    mode = "t5_loaded" if engine.model is not None else "fallback_rule_based"

    return HealthResponse(
        status="ok",
        mode=mode,
        model_repo=engine.model_repo,
    )


@router.get("/examples")
async def query_examples():
    """Return a list of example revenue and forecast questions the system understands."""
    return {
        "examples": [
            {
                "question": "What was my best performing month this year?",
                "description": "Finds the month with the highest total revenue in the current year.",
            },
            {
                "question": "What was the worst performing month this year?",
                "description": "Finds the month with the lowest total revenue in the current year.",
            },
            {
                "question": "What is the total revenue for last week?",
                "description": "Sums revenue from the past 7 days.",
            },
            {
                "question": "What is the total revenue for this month?",
                "description": "Sums revenue from the past 30 days.",
            },
            {
                "question": "What is the average daily revenue?",
                "description": "Calculates the mean revenue per day across all records.",
            },
            {
                "question": "Show me the revenue trend by month",
                "description": "Groups revenue by month and returns the full trend.",
            },
            {
                "question": "What was our highest revenue day?",
                "description": "Returns the single day with the highest revenue.",
            },
            {
                "question": "Compare revenue between March and April",
                "description": "Returns monthly breakdown for comparison purposes.",
            },
            {
                "question": "Show me anomalies in revenue",
                "description": "Finds data points that deviate significantly from the average.",
            },
            {
                "question": "What is our total revenue to date?",
                "description": "Returns the sum of all revenue ever recorded.",
            },
            {
                "question": "What is our revenue growth trend?",
                "description": "Shows monthly revenue over time to identify growth patterns.",
            },
            {
                "question": "What is the forecast for next month?",
                "description": "Returns recent monthly revenue as context for forecasting.",
            },
            {
                "question": "What was the revenue in January?",
                "description": "Sums revenue for a specific month.",
            },
            {
                "question": "What is the best day of the week for revenue?",
                "description": "Shows average revenue grouped by day of the week.",
            },
            {
                "question": "What is our revenue by year?",
                "description": "Groups total revenue by year.",
            },
        ]
    }
