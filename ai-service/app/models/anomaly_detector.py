import logging
from dataclasses import dataclass, field
import numpy as np
import pandas as pd
from sklearn.ensemble import IsolationForest
from sklearn.preprocessing import StandardScaler

logger = logging.getLogger(__name__)

# cONFIG
DEFAULT_CONTAMINATION = 0.05  # expects ~5% anomalous data points
ZSCORE_THRESHOLD = 2.5        # standard deviations for a high-confidence flag
ZSCORE_WARNING = 1.5          # standard deviations for a warning-level flag
WINDOW_DAYS = 30              # rolling window for local anomaly detection


# DATA CLASSES
@dataclass
class Anomaly:
    date: str
    value: float
    expected_value: float | None
    deviation_pct: float
    severity: str   # critical / warning
    method: str     # isolation_forest / zscore / both
    explanation: str


@dataclass
class AnomalyReport:
    total_points: int
    anomalies_found: int
    anomaly_rate: float
    anomalies: list[Anomaly] = field(default_factory=list)
    summary: str = ""
    metadata: dict = field(default_factory=dict)


# DETECTOR
class AnomalyDetector:

    def __init__(self, contamination=DEFAULT_CONTAMINATION, zscore_threshold=ZSCORE_THRESHOLD, zscore_warning=ZSCORE_WARNING, random_state=42):
        self.contamination = contamination
        self.zscore_threshold = zscore_threshold
        self.zscore_warning = zscore_warning
        self.random_state = random_state
        self.isolation_forest = None
        self.scaler = None
        self._fitted = False
        self._rolling_mean = None
        self._rolling_std = None

    # FITTING THE MODELS
    def fit(self, df, date_col="date", value_col="revenue"):
        df = df.copy()
        df[date_col] = pd.to_datetime(df[date_col])
        df = df.sort_values(date_col).reset_index(drop=True)
        values = df[value_col].to_numpy(dtype=float).reshape(-1, 1)

        if len(values) < 10:
            logger.warning("need >=10 points for anomaly detection")
            return self

        features = self._build_features(df, value_col)

        # Trains the Isolation Forest on feature matrix 
        self.isolation_forest = IsolationForest(contamination=self.contamination, random_state=self.random_state, n_estimators=100)
        self.isolation_forest.fit(features)

        # Fits the scaler for Z-score analysis on raw values 
        self.scaler = StandardScaler()
        self.scaler.fit(values)

        # Computes rolling stats for expected-value comparisons 
        series = df[value_col].to_numpy(dtype=float)
        w = min(WINDOW_DAYS, len(series) // 2)
        self._rolling_mean = pd.Series(series).rolling(window=w, min_periods=3).mean().to_numpy()
        self._rolling_std = pd.Series(series).rolling(window=w, min_periods=3).std().to_numpy()

        self._fitted = True
        logger.info("anomaly detector fitted")
        return self

    # DETECTING ANOMALIES
    def detect(self, df, date_col="date", value_col="revenue", include_recent_only=0):
        if not self._fitted:
            raise RuntimeError("not fitted, call .fit() first")

        df = df.copy()
        df[date_col] = pd.to_datetime(df[date_col])
        df = df.sort_values(date_col).reset_index(drop=True)

        values = df[value_col].to_numpy(dtype=float)
        dates = df[date_col]

        # Runs both models
        features = self._build_features(df, value_col)
        if_preds = self.isolation_forest.predict(features)  # 1 is normal, -1 is anomaly
        z_scores = np.abs(self.scaler.transform(values.reshape(-1, 1))).flatten()

        # Combines model predictions into flagged anomalies
        anomalies = []
        for i in range(len(values)):
            is_if = if_preds[i] == -1
            is_zc = z_scores[i] >= self.zscore_threshold
            is_zw = z_scores[i] >= self.zscore_warning

            if not is_if and not is_zw:
                continue

            if is_if and is_zc:
                severity, method = "critical", "both"
            elif is_if:
                severity, method = "warning", "isolation_forest"
            elif is_zc:
                severity, method = "critical", "zscore"
            else:
                severity, method = "warning", "zscore"

            rm = self._rolling_mean[i]
            expected = float(rm) if not np.isnan(rm) else None
            deviation = ((values[i] - expected) / expected * 100) if expected and expected != 0 else 0.0

            anomalies.append(Anomaly(
                date=dates.iloc[i].strftime("%Y-%m-%d"),
                value=float(values[i]),
                expected_value=round(expected, 2) if expected else None,
                deviation_pct=round(deviation, 1),
                severity=severity,
                method=method,
                explanation=self._explain(dates.iloc[i], float(values[i]), expected, deviation, severity),
            ))

        # Optionally filters to recent anomalies only
        if include_recent_only > 0 and anomalies:
            cutoff = dates.iloc[-1] - pd.Timedelta(days=include_recent_only)
            anomalies = [a for a in anomalies if pd.to_datetime(a.date) >= cutoff]

        # Builds and returns the finished report
        total, found = len(df), len(anomalies)
        return AnomalyReport(
            total_points=total,
            anomalies_found=found,
            anomaly_rate=round(found / total * 100, 1) if total > 0 else 0.0,
            anomalies=anomalies,
            summary=self._summarise(found, total, anomalies),
            metadata={"contamination": self.contamination, "zscore_threshold": self.zscore_threshold, "zscore_warning": self.zscore_warning},
        )

    # FEATURE ENGINEERING
    def _build_features(self, df, value_col):
        values = df[value_col].to_numpy(dtype=float).reshape(-1, 1)
        vals_scaled = self.scaler.transform(values) if self.scaler else values

        # Creates cyclical time features (day of week, month) 
        if "date" in df.columns:
            dows = pd.to_datetime(df["date"]).dt.dayofweek.to_numpy()
            dow_sin = np.sin(2 * np.pi * dows / 7).reshape(-1, 1)
            dow_cos = np.cos(2 * np.pi * dows / 7).reshape(-1, 1)
            months = pd.to_datetime(df["date"]).dt.month.to_numpy()
            month_sin = np.sin(2 * np.pi * months / 12).reshape(-1, 1)
        else:
            dow_sin = np.zeros((len(values), 1))
            dow_cos = np.zeros((len(values), 1))
            month_sin = np.zeros((len(values), 1))

        # Computes 7-day rolling mean and standard deviation 
        series = pd.Series(values.flatten())
        roll_mean = series.rolling(window=7, min_periods=1).mean().to_numpy().reshape(-1, 1)
        roll_std = series.rolling(window=7, min_periods=1).std().fillna(0).to_numpy().reshape(-1, 1)

        return np.hstack([vals_scaled, dow_sin, dow_cos, month_sin, roll_mean, roll_std])

    # EXPLANATION & SUMMARISING
    def _explain(self, date, value, expected, deviation, severity):
        ds = date.strftime("%d %B %Y")
        # guard against None expected value in early rolling window rows
        expected_str = f"${expected:,.2f}" if expected is not None else "unknown"
        if severity == "critical":
            if deviation > 0:
                return f"Critical anomaly on {ds}: revenue was ${value:,.2f}, {deviation:.0f}% above expected ({expected_str}). Significant spike."
            else:
                return f"Critical anomaly on {ds}: revenue was ${value:,.2f}, {abs(deviation):.0f}% below expected ({expected_str}). Significant dip."
        else:
            if deviation > 0:
                return f"Warning on {ds}: revenue was ${value:,.2f}, {deviation:.0f}% above expected ({expected_str}). May warrant investigation."
            else:
                return f"Warning on {ds}: revenue was ${value:,.2f}, {abs(deviation):.0f}% below expected ({expected_str}). May warrant investigation."

    def _summarise(self, found, total, anomalies):
        if found == 0:
            return "No anomalies detected."
        critical = sum(1 for a in anomalies if a.severity == "critical")
        warnings = sum(1 for a in anomalies if a.severity == "warning")
        parts = [f"Found {found} anomalies out of {total} records."]
        if critical:
            parts.append(f"{critical} critical.")
        if warnings:
            parts.append(f"{warnings} warnings.")
        return " ".join(parts)


# SINGLETON
_detector = None

def get_anomaly_detector(contamination=DEFAULT_CONTAMINATION):
    global _detector
    if _detector is None:
        _detector = AnomalyDetector(contamination=contamination)
    return _detector
