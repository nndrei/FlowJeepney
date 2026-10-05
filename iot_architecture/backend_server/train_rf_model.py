"""
FlowJeep Machine Learning: Offline Random Forest Model Training Script
Trains a scikit-learn RandomForestRegressor on paratransit corridor telemetry.
Outputs calibrated `rf_passenger_load.joblib` artifact.
"""

import math
import numpy as np
import pandas as pd
from sklearn.ensemble import RandomForestRegressor
from sklearn.model_selection import train_test_split
from sklearn.metrics import mean_absolute_error, r2_score
import joblib

def generate_historical_dataset(n_samples: int = 5000) -> pd.DataFrame:
    """Generates synthetic historical training data reflecting Manila paratransit dynamics."""
    np.random.seed(101)
    
    hours = np.random.uniform(5.0, 23.5, n_samples)
    days = np.random.randint(0, 7, n_samples)
    is_weekend = (days >= 5).astype(int)
    is_rush = (((hours >= 6.5) & (hours <= 9.5)) | ((hours >= 16.5) & (hours <= 20.0)) & (is_weekend == 0)).astype(int)
    
    temperatures = np.random.normal(31.5, 3.5, n_samples)
    humidity = np.random.uniform(55.0, 95.0, n_samples)
    is_raining = (np.random.rand(n_samples) < 0.30).astype(int)
    hist_corridor_load = np.random.uniform(30.0, 85.0, n_samples)
    stop_idx = np.random.randint(1, 14, n_samples)

    sin_hour = np.sin(2 * np.pi * hours / 24.0)
    cos_hour = np.cos(2 * np.pi * hours / 24.0)
    sin_day = np.sin(2 * np.pi * days / 7.0)
    cos_day = np.cos(2 * np.pi * days / 7.0)

    # Nonlinear target calculation
    base_load = 38.0 + (is_rush * 36.0) + (is_raining * 16.5) - (is_weekend * 14.0)
    target_load = base_load + (hist_corridor_load * 0.28) + (stop_idx * 0.8) + np.random.normal(0, 4.2, n_samples)
    target_load = np.clip(target_load, 10.0, 100.0)

    df = pd.DataFrame({
        "sin_hour": sin_hour,
        "cos_hour": cos_hour,
        "sin_day": sin_day,
        "cos_day": cos_day,
        "is_weekend": is_weekend,
        "is_rush_hour": is_rush,
        "temperature_c": temperatures,
        "humidity_pct": humidity,
        "is_raining": is_raining,
        "historical_corridor_load_pct": hist_corridor_load,
        "stop_sequence_index": stop_idx,
        "passenger_load_pct": target_load
    })
    return df

def main():
    print("[Training] Generating synthetic historical corridor dataset...")
    df = generate_historical_dataset(8000)
    
    feature_cols = [
        "sin_hour", "cos_hour", "sin_day", "cos_day",
        "is_weekend", "is_rush_hour", "temperature_c",
        "humidity_pct", "is_raining", "historical_corridor_load_pct",
        "stop_sequence_index"
    ]
    X = df[feature_cols]
    y = df["passenger_load_pct"]

    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)
    print(f"[Training] Training Random Forest Regressor on {len(X_train)} samples...")

    rf = RandomForestRegressor(
        n_estimators=150,
        max_depth=14,
        min_samples_leaf=3,
        n_jobs=-1,
        random_state=42
    )
    rf.fit(X_train, y_train)

    preds = rf.predict(X_test)
    mae = mean_absolute_error(y_test, preds)
    r2 = r2_score(y_test, preds)

    print(f"[Results] Test Mean Absolute Error: {mae:.2f}%")
    print(f"[Results] Test R² Score: {r2:.4f}")

    joblib.dump(rf, "rf_passenger_load.joblib")
    print("[Results] Model exported successfully to rf_passenger_load.joblib")

if __name__ == "__main__":
    main()
