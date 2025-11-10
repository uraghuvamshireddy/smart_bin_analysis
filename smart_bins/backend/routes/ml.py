from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from datetime import datetime, timedelta, timezone
import numpy as np
import joblib
import os
import traceback
from collections import Counter, defaultdict

from sklearn.linear_model import LinearRegression
from sklearn.cluster import KMeans
from sklearn.preprocessing import StandardScaler
from sklearn.neighbors import NearestNeighbors

from database import SessionLocal
from models import Bin, FillHistory

router = APIRouter(prefix="/ml", tags=["ml"])

MODEL_DIR = "models_store"
os.makedirs(MODEL_DIR, exist_ok=True)

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

def load_or_train_model(bin_id: str, db: Session):
    path = f"{MODEL_DIR}/{bin_id}.pkl"

    if os.path.exists(path):
        try:
            packed = joblib.load(path)
            if isinstance(packed, dict) and "model" in packed and "t0" in packed:
                return packed
        except Exception:
            pass

    rows = db.query(FillHistory).filter(FillHistory.bin_id == bin_id).order_by(FillHistory.ts.asc()).all()
    if len(rows) < 2:
        raise HTTPException(status_code=400, detail="Not enough data to train")

    t0 = rows[0].ts
    X = np.array([(r.ts - t0).total_seconds() / 3600.0 for r in rows]).reshape(-1, 1)
    y = np.array([r.fill_pct for r in rows])

    model = LinearRegression().fit(X, y)

    packed = {"model": model, "t0": t0}
    joblib.dump(packed, path)

    return packed

@router.get("/predict/{bin_id}")
def predict_for_bin(bin_id: str, db: Session = Depends(get_db)):
    latest = db.query(FillHistory).filter(FillHistory.bin_id == bin_id).order_by(FillHistory.ts.desc()).first()
    if not latest:
        return {
            "bin_id": bin_id,
            "current_fill": 0,
            "hours_left": None,
            "eta_iso": None,
            "status": "no_sensor_data",
            "slope": 0.0
        }

    try:
        packed = load_or_train_model(bin_id, db)
        model = packed["model"]
        t0 = packed["t0"]

        last_t = (latest.ts - t0).total_seconds() / 3600.0
        slope = float(model.coef_[0])
        intercept = float(model.intercept_)

        target_fill = 100.0

        if slope > 0.1:
            t_at_target_fill = (target_fill - intercept) / slope
            hours_left = max(0.0, t_at_target_fill - last_t)
            eta = datetime.now(timezone.utc) + timedelta(hours=hours_left)
            status = "predicting"
        else:
            hours_left = None
            eta = None
            if latest.fill_pct >= 98:
                hours_left = 0.0
                eta = datetime.now(timezone.utc)
                status = "already_full"
            else:
                status = "slow_or_no_fill"

    except HTTPException as e:
        slope = 0.0
        hours_left = None
        eta = None
        status = e.detail
    except Exception as e:
        slope = 0.0
        hours_left = None
        eta = None
        status = f"prediction_error: {str(e)}"

    return {
        "bin_id": bin_id,
        "current_fill": latest.fill_pct,
        "hours_left": round(hours_left, 2) if hours_left is not None else None,
        "eta_iso": eta.isoformat() if eta else None,
        "status": status,
        "slope": round(slope, 3)
    }

@router.get("/predictions")
def predict_all(db: Session = Depends(get_db)):
    bins = db.query(Bin).all()
    results = []

    for b in bins:
        try:
            res = predict_for_bin(b.bin_id, db=db)
            results.append(res)
        except Exception as e:
            results.append({
                "bin_id": b.bin_id,
                "status": "prediction_failed",
                "error": str(e)
            })
    results.sort(key=lambda x: x.get('hours_left') if x.get('hours_left') is not None else float('inf'))
    return {"predictions": results}

def calculate_bin_importance_score(
    current_fill: float,
    hours_left: float | None,
    status: str,
    slope: float
) -> float:
    score = 0.0

    score += current_fill * 0.5

    if status == "already_full":
        score += 100
    elif hours_left is not None and hours_left <= 48:
        score += (48 - hours_left) * (100 / 48.0)
    elif hours_left is None and current_fill >= 90:
        score += 50

    if slope > 0:
        score += min(slope * 10, 20)

    if score < 1.0 and (current_fill > 0 or slope > 0 or status == "predicting"):
        score = 1.0
    
    return min(score, 150.0) # Cap importance score to prevent extreme outliers

@router.get("/hotspots")
def hotspots(db: Session = Depends(get_db)):
    bins = db.query(Bin).all()
    
    data_for_clustering = []
    bin_metadata = []

    for b in bins:
        try:
            prediction_res = predict_for_bin(b.bin_id, db)
            
            current_fill = prediction_res.get("current_fill", 0)
            hours_left = prediction_res.get("hours_left")
            status = prediction_res.get("status", "unknown")
            bin_slope = prediction_res.get("slope", 0.0)

            importance_score = calculate_bin_importance_score(
                current_fill=current_fill,
                hours_left=hours_left,
                status=status,
                slope=bin_slope
            )

            if importance_score > 0 and b.latitude is not None and b.longitude is not None:
                data_for_clustering.append([float(b.latitude), float(b.longitude), importance_score])
                bin_metadata.append({"bin_id": b.bin_id, "latitude": float(b.latitude), "longitude": float(b.longitude), "importance_score": importance_score})

        except Exception as e:
            print(f"Error processing bin {b.bin_id} for hotspots: {e}")
            pass

    if len(data_for_clustering) < 2:
        return {"hotspot_centers": []}

    X = np.array(data_for_clustering)
    
    lat_lon_scaler = StandardScaler()
    X_lat_lon_scaled = lat_lon_scaler.fit_transform(X[:, :2])

    importance_scaler = StandardScaler()
    X_importance_scaled = importance_scaler.fit_transform(X[:, 2].reshape(-1, 1))

    weighted_importance_factor = 0.5
    X_scaled = np.column_stack([X_lat_lon_scaled, X_importance_scaled * weighted_importance_factor])

    k = min(max(1, len(X_scaled) // 5), 8)
    
    kmeans = KMeans(n_clusters=k, n_init=10, random_state=42)
    kmeans.fit(X_scaled)

    hotspot_centers = []
    
    for i in range(k):
        cluster_points_indices = np.where(kmeans.labels_ == i)[0]
        
        if len(cluster_points_indices) == 0:
            continue

        original_cluster_points = X[cluster_points_indices]
        
        avg_lat = np.mean(original_cluster_points[:, 0])
        avg_lon = np.mean(original_cluster_points[:, 1])
        avg_importance = np.mean(original_cluster_points[:, 2])

        bins_in_cluster = [bin_metadata[idx] for idx in cluster_points_indices]

        # Use NearestNeighbors to find a "representative" bin for the cluster, if desired,
        # or just use the average lat/lon. For "new bin locations," average is fine.
        
        hotspot_centers.append({
            "cluster_id": int(i),
            "latitude": float(avg_lat),
            "longitude": float(avg_lon),
            "average_importance_score": round(float(avg_importance), 2),
            "num_bins_in_hotspot": len(bins_in_cluster),
            "example_bin_ids": sorted([bm["bin_id"] for bm in bins_in_cluster], key=lambda x: bin_metadata[np.where([b['bin_id'] == x for b in bin_metadata])[0][0]]['importance_score'], reverse=True)[:3]
        })
    
    hotspot_centers.sort(key=lambda x: x.get('average_importance_score', 0), reverse=True)

    return {"hotspot_centers": hotspot_centers}

@router.get("/patterns")
def detect_patterns(db: Session = Depends(get_db)):
    try:
        from routes.analytics import average_fill_time
        fill_time_data = average_fill_time(db)
        per_bin_avg_hours = fill_time_data.get("per_bin_hours", {})
    except ImportError:
        per_bin_avg_hours = {}
    except Exception as e:
        per_bin_avg_hours = {}

    all_bins = db.query(Bin).all()
    current_fills = {b.bin_id: b.current_fill_pct for b in all_bins}

    patterns = defaultdict(list)

    for bin_id, avg_hours in per_bin_avg_hours.items():
        if avg_hours < 12:
            patterns["very_fast_filling_bins"].append(bin_id)
        elif avg_hours < 24:
            patterns["fast_filling_bins"].append(bin_id)
        elif avg_hours > 72:
            patterns["slow_filling_bins"].append(bin_id)

    for bin_id, fill_pct in current_fills.items():
        if fill_pct is None:
            continue
        if fill_pct >= 90 and bin_id in patterns["fast_filling_bins"]:
            patterns["critical_pickup_needed"].append(bin_id)
        if fill_pct < 10 and bin_id in patterns["slow_filling_bins"]:
            patterns["rarely_used_or_oversized"].append(bin_id)

    result_patterns = []
    if patterns["critical_pickup_needed"]:
        result_patterns.append({
            "type": "Critical Pickup Needed",
            "bin_ids": patterns["critical_pickup_needed"],
            "insight": "These bins are almost full and typically fill up quickly. Prioritize immediate collection."
        })
    if patterns["very_fast_filling_bins"]:
        result_patterns.append({
            "type": "Very Fast Filling Bins",
            "bin_ids": patterns["very_fast_filling_bins"],
            "insight": "Bins in high-traffic areas or undersized. Consider more frequent pickups or larger bins."
        })
    if patterns["fast_filling_bins"]:
        result_patterns.append({
            "type": "Fast Filling Bins",
            "bin_ids": patterns["fast_filling_bins"],
            "insight": "Regularly require attention. Optimize routing to include these more often."
        })
    if patterns["slow_filling_bins"]:
        result_patterns.append({
            "type": "Slow Filling Bins",
            "bin_ids": patterns["slow_filling_bins"],
            "insight": "Bins in low-traffic areas. Pickup frequency can be reduced to save costs."
        })
    if patterns["rarely_used_or_oversized"]:
        result_patterns.append({
            "type": "Rarely Used / Oversized",
            "bin_ids": patterns["rarely_used_or_oversized"],
            "insight": "These bins are consistently empty despite being slow to fill. May be oversized or in very low-usage areas."
        })

    bins_with_data = set(per_bin_avg_hours.keys())
    no_fill_history_bins = [b.bin_id for b in all_bins if b.bin_id not in bins_with_data and current_fills.get(b.bin_id) is not None]
    if no_fill_history_bins:
        result_patterns.append({
            "type": "New/No Data Bins",
            "bin_ids": no_fill_history_bins,
            "insight": "These bins have no fill history or insufficient data for analysis. Monitor closely."
        })

    return {"patterns": result_patterns}