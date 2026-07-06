import logging
import os
from dataclasses import dataclass, field
from pathlib import Path
from typing import Optional

import joblib
import numpy as np
import pandas as pd
from huggingface_hub import hf_hub_download, upload_file, create_repo, HfApi
from sklearn.metrics import mean_squared_error

logger = logging.getLogger(__name__)

# CONFIG
MODEL_REPO = "kitamigo/vizura-forecast-ensemble"
FORECAST_HORIZON = 30  # days
MIN_TRAINING_DAYS = 30  # minimum data required
LOCAL_MODEL_DIR = Path("models_cache")
LOCAL_MODEL_DIR.mkdir(exist_ok=True)


# DATA CLASSES
@dataclass
class ForecastResult:
    dates: list[str] = field(default_factory=list)
    xgboost_forecast: list[float] = field(default_factory=list)
    prophet_forecast: list[float] = field(default_factory=list)
    ensemble_forecast: list[float] = field(default_factory=list)
    lower_bound: list[float] = field(default_factory=list)
    upper_bound: list[float] = field(default_factory=list)
    xgb_weight: float = 0.5
    prophet_weight: float = 0.5
    rmse_xgb: float | None = None
    rmse_prophet: float | None = None
    metadata: dict = field(default_factory=dict)


# FEATURE ENGINEERING
def _create_lag_features(
    series: np.ndarray, lags: list[int] = None
) -> np.ndarray:
    if lags is None:
        lags = [1, 2, 3, 7, 14, 21, 28]

    max_lag = max(lags)
    X = np.zeros((len(series) - max_lag, len(lags) + 3))

    for i in range(len(series) - max_lag):
        idx = i + max_lag
        # Lag values
        for j, lag in enumerate(lags):
            X[i, j] = series[idx - lag]
        # Day of week (cyclical)
        X[i, len(lags)] = np.sin(2 * np.pi * idx / 7)
        X[i, len(lags) + 1] = np.cos(2 * np.pi * idx / 7)
        # Day of month (cyclical)
        X[i, len(lags) + 2] = np.sin(2 * np.pi * idx / 30)

    return X


# ENSEMBLE FORECASTER
class ForecastEnsemble:

    def __init__(
        self,
        model_repo: str = MODEL_REPO,
        xgb_weight: float = 0.5,
        prophet_weight: float = 0.5,
    ):
        self.model_repo = model_repo
        self.xgb_weight = xgb_weight
        self.prophet_weight = prophet_weight
        self.xgb_model = None
        self.prophet_model = None
        self._last_date = None
        self._last_values: np.ndarray | None = None
        self._fitted = False
        self._rmse_xgb: float | None = None
        self._rmse_prophet: float | None = None

    # MODEL LOADING (FROM HF)
    def load_from_hub(self, repo: str = None) -> "ForecastEnsemble":
        repo = repo or self.model_repo
        try:
            xgb_path = hf_hub_download(repo_id=repo, filename="xgboost_model.pkl")
            prophet_path = hf_hub_download(
                repo_id=repo, filename="prophet_model.pkl"
            )
            meta_path = hf_hub_download(
                repo_id=repo, filename="ensemble_meta.joblib"
            )

            self.xgb_model = joblib.load(xgb_path)
            self.prophet_model = joblib.load(prophet_path)
            meta = joblib.load(meta_path)

            self.xgb_weight = meta.get("xgb_weight", 0.5)
            self.prophet_weight = meta.get("prophet_weight", 0.5)
            self._rmse_xgb = meta.get("rmse_xgb")
            self._rmse_prophet = meta.get("rmse_prophet")
            self._last_values = meta.get("last_values")
            self._fitted = True

            logger.info(f"Ensemble model loaded from {repo}")
            return self
        except Exception as e:
            logger.error(f"Failed to load from HF Hub: {e}")
            raise

    # TRAINING
    def fit(
        self,
        df: pd.DataFrame,
        date_col: str = "date",
        value_col: str = "revenue",
        tune_weights: bool = True,
    ) -> "ForecastEnsemble":
        # Preprocessing
        df = df.copy()
        df[date_col] = pd.to_datetime(df[date_col])
        df = df.sort_values(date_col).reset_index(drop=True)
        df = df.dropna(subset=[value_col])

        values = df[value_col].values.astype(float)
        dates = df[date_col]

        if len(values) < MIN_TRAINING_DAYS:
            raise ValueError(
                f"Need at least {MIN_TRAINING_DAYS} days of data. "
                f"Got {len(values)}."
            )

        self._last_date = dates.iloc[-1]
        self._last_values = values[-28:]  # keeps last 28 days for lag features

        # Trains XGBoost on lag features
        logger.info("Training XGBoost...")
        self._train_xgboost(values, tune_weights)

        # Trains Prophet on historical series
        logger.info("Training Prophet...")
        self._train_prophet(df, date_col, value_col, tune_weights)

        self._fitted = True
        logger.info(
            f"Ensemble fitted. Weights — XGBoost: {self.xgb_weight:.3f}, "
            f"Prophet: {self.prophet_weight:.3f}"
        )
        return self

    def _train_xgboost(self, values: np.ndarray, tune: bool = False):
        from xgboost import XGBRegressor

        X = _create_lag_features(values)
        y = values[max(_get_lags()) :]  # target starts after max lag

        # Splits for validation if tuning
        split = int(len(X) * 0.8)
        X_train, X_val = X[:split], X[split:]
        y_train, y_val = y[:split], y[split:]

        self.xgb_model = XGBRegressor(
            n_estimators=200,
            max_depth=5,
            learning_rate=0.05,
            subsample=0.8,
            colsample_bytree=0.8,
            random_state=42,
            verbosity=0,
        )
        self.xgb_model.fit(X_train, y_train)

        if tune and len(X_val) > 0:
            preds = self.xgb_model.predict(X_val)
            self._rmse_xgb = float(np.sqrt(mean_squared_error(y_val, preds)))

    def _train_prophet(
        self,
        df: pd.DataFrame,
        date_col: str,
        value_col: str,
        tune: bool = False,
    ):
        from prophet import Prophet

        prophet_df = df[[date_col, value_col]].rename(
            columns={date_col: "ds", value_col: "y"}
        )

        self.prophet_model = Prophet(
            yearly_seasonality=True,
            weekly_seasonality=True,
            daily_seasonality=False,
            changepoint_prior_scale=0.05,
            seasonality_prior_scale=10.0,
            interval_width=0.95,
        )
        self.prophet_model.fit(prophet_df)

        if tune:
            # Uses last 30 days for RMSE evaluation
            split_point = prophet_df["ds"].max() - pd.Timedelta(days=30)
            train_df = prophet_df[prophet_df["ds"] <= split_point]
            val_df = prophet_df[prophet_df["ds"] > split_point]

            if len(val_df) > 0:
                temp_model = Prophet(
                    yearly_seasonality=True,
                    weekly_seasonality=True,
                    interval_width=0.95,
                )
                temp_model.fit(train_df)
                future = temp_model.make_future_dataframe(periods=len(val_df))
                forecast = temp_model.predict(future)
                preds = forecast["yhat"].values[-len(val_df) :]
                self._rmse_prophet = float(
                    np.sqrt(mean_squared_error(val_df["y"].values, preds))
                )

        # Re-tunes ensemble weights based on RMSE
        if tune and self._rmse_xgb and self._rmse_prophet:
            total = self._rmse_xgb + self._rmse_prophet
            if total > 0:
                # Higher weight to better model (lower RMSE)
                self.prophet_weight = round(self._rmse_xgb / total, 4)
                self.xgb_weight = round(self._rmse_prophet / total, 4)

    # PREDICTION
    def predict(self, days: int = FORECAST_HORIZON) -> ForecastResult:
        if not self._fitted:
            raise RuntimeError("Model not fitted. Call .fit() or .load_from_hub() first.")

        days = min(days, 90)  # cap at 90 days

        # Prophet forecasting
        future = self.prophet_model.make_future_dataframe(periods=days)
        prophet_fc = self.prophet_model.predict(future)
        prophet_preds = prophet_fc["yhat"].values[-days:]
        prophet_lower = prophet_fc["yhat_lower"].values[-days:]
        prophet_upper = prophet_fc["yhat_upper"].values[-days:]

        # XGBoost forecast (recursive)
        xgb_preds = self._predict_xgboost_recursive(days)

        # Blends both models into ensemble
        ensemble_preds = self.xgb_weight * np.array(xgb_preds) + self.prophet_weight * np.array(prophet_preds)
        lower_bound = self.xgb_weight * np.array(xgb_preds) + self.prophet_weight * np.array(prophet_lower)
        upper_bound = self.xgb_weight * np.array(xgb_preds) + self.prophet_weight * np.array(prophet_upper)

        # Builds date range
        future_dates = pd.date_range(
            start=self._last_date + pd.Timedelta(days=1), periods=days, freq="D"
        )

        return ForecastResult(
            dates=[d.strftime("%Y-%m-%d") for d in future_dates],
            xgboost_forecast=[round(v, 2) for v in xgb_preds],
            prophet_forecast=[round(v, 2) for v in prophet_preds],
            ensemble_forecast=[round(v, 2) for v in ensemble_preds],
            lower_bound=[round(v, 2) for v in lower_bound],
            upper_bound=[round(v, 2) for v in upper_bound],
            xgb_weight=self.xgb_weight,
            prophet_weight=self.prophet_weight,
            rmse_xgb=self._rmse_xgb,
            rmse_prophet=self._rmse_prophet,
            metadata={
                "model_repo": self.model_repo,
                "horizon_days": days,
                "last_training_date": self._last_date.strftime("%Y-%m-%d")
                if self._last_date
                else None,
            },
        )

    def _predict_xgboost_recursive(self, days: int) -> list[float]:
        if self._last_values is None or len(self._last_values) < max(_get_lags()):
            # Fallback: use Prophet-only if not enough history for lags
            logger.warning("Insufficient history for XGBoost lag features.")
            return [0.0] * days

        lags = _get_lags()
        history = list(self._last_values)
        predictions = []

        for _ in range(days):
            feats = []
            for lag in lags:
                feats.append(history[-lag])
            idx = len(history)
            feats.append(np.sin(2 * np.pi * idx / 7))
            feats.append(np.cos(2 * np.pi * idx / 7))
            feats.append(np.sin(2 * np.pi * idx / 30))

            X = np.array(feats).reshape(1, -1)
            pred = float(self.xgb_model.predict(X)[0])
            pred = max(0.0, pred)  # revenue can't be negative
            predictions.append(pred)
            history.append(pred)

        return predictions

    # PERSISTENCE
    def save(self, path: str = None):
        path = Path(path or LOCAL_MODEL_DIR)
        path.mkdir(exist_ok=True)

        joblib.dump(self.xgb_model, path / "xgboost_model.pkl")
        joblib.dump(self.prophet_model, path / "prophet_model.pkl")
        joblib.dump(
            {
                "xgb_weight": self.xgb_weight,
                "prophet_weight": self.prophet_weight,
                "rmse_xgb": self._rmse_xgb,
                "rmse_prophet": self._rmse_prophet,
                "last_values": self._last_values,
            },
            path / "ensemble_meta.joblib",
        )
        logger.info(f"Model saved to {path}")

    def push_to_hub(self, repo: str = None, token: str = None):
        repo = repo or self.model_repo
        api = HfApi()

        # Checks the repo exists
        try:
            api.create_repo(repo, exist_ok=True, token=token)
        except Exception:
            pass

        # Saves locally first, then uploads
        self.save()

        for fname in ["xgboost_model.pkl", "prophet_model.pkl", "ensemble_meta.joblib"]:
            upload_file(
                path_or_fileobj=str(LOCAL_MODEL_DIR / fname),
                path_in_repo=fname,
                repo_id=repo,
                token=token,
            )
        logger.info(f"Model pushed to {repo}")


# HELPERS
def _get_lags() -> list[int]:
    return [1, 2, 3, 7, 14, 21, 28]


# SINGLETON
_ensemble = None


def get_forecast_ensemble(
    model_repo: str = MODEL_REPO,
) -> ForecastEnsemble:
    global _ensemble
    if _ensemble is None:
        _ensemble = ForecastEnsemble(model_repo=model_repo)
        try:
            _ensemble.load_from_hub()
        except Exception:
            logger.warning("No cached model on HF Hub. Must call .fit() before predicting.")
    return _ensemble