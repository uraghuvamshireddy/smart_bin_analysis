from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from datetime import datetime, timedelta, timezone
from collections import defaultdict, Counter

from database import SessionLocal
from models import Bin, FillHistory, Alert

router = APIRouter(prefix="/analytics", tags=["analytics"])

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


# ✅ Current fill-level bin distribution
@router.get("/bin-distribution")
def bin_distribution(db: Session = Depends(get_db)):
    bins = db.query(Bin).all()
    total = len(bins)
    low = sum(1 for b in bins if (b.current_fill_pct or 0) < 50)
    medium = sum(1 for b in bins if 50 <= (b.current_fill_pct or 0) < 80)
    high = sum(1 for b in bins if (b.current_fill_pct or 0) >= 80)
    return {"total_bins": total, "low": low, "medium": medium, "high": high}


# ✅ Alerts summary
@router.get("/alerts-summary")
def alerts_summary(db: Session = Depends(get_db)):
    total_alerts = db.query(Alert).count()
    active = db.query(Alert).filter(Alert.is_resolved == False).count()
    resolved = db.query(Alert).filter(Alert.is_resolved == True).count()
    return {
        "total_alerts": total_alerts,
        "active_alerts": active,
        "resolved_alerts": resolved
    }


# ✅ Hourly rise in fill% (last 7 days)
@router.get("/hourly-waste")
def hourly_waste(db: Session = Depends(get_db)):
    now = datetime.now(timezone.utc)
    start = now - timedelta(days=7)

    rows = db.query(FillHistory).filter(FillHistory.ts >= start).order_by(
        FillHistory.bin_id, FillHistory.ts
    ).all()

    counts = Counter()
    prev = {}

    for r in rows:
        b = r.bin_id
        if b in prev and r.fill_pct > prev[b].fill_pct:
            counts[r.ts.astimezone(timezone.utc).hour] += 1
        prev[b] = r

    result = [{"hour": h, "count": counts.get(h, 0)} for h in range(24)]
    return {"last_7_days": result}


# ✅ Frequent fully-filled bins (Top 10 bins that trigger most alerts)
@router.get("/frequent-full-bins")
def frequent_full_bins(db: Session = Depends(get_db)):
    # Assuming an "alert" is created when a bin becomes "full" or requires attention
    rows = db.query(Alert).all()
    c = Counter(a.bin_id for a in rows)
    top = c.most_common(10)
    return {"top_bins": [{"bin_id": b, "alerts": cnt} for b, cnt in top]}


# ✅ Avg Fill Time — Empty(≤5%) → Full(≥80%)
@router.get("/average-fill-time")
def average_fill_time(db: Session = Depends(get_db)):
    rows = db.query(FillHistory).order_by(FillHistory.bin_id, FillHistory.ts).all()
    by = defaultdict(list)

    for r in rows:
        by[r.bin_id].append(r)

    durations_all = []
    result = {}

    for bin_id, recs in by.items():
        start = None
        durations = []
        for r in recs:
            if start is None and r.fill_pct <= 5: # Bin is empty or nearly empty
                start = r.ts
            elif start is not None and r.fill_pct >= 80: # Bin is full
                hours = (r.ts - start).total_seconds() / 3600
                if hours > 0:
                    durations.append(hours)
                    durations_all.append(hours)
                start = None # Reset for the next fill cycle

        if durations:
            result[bin_id] = round(sum(durations) / len(durations), 2)

    overall = round(sum(durations_all) / len(durations_all), 2) if durations_all else None
    return {"per_bin_hours": result, "overall_avg_hours": overall}


# ✅ Overflow records (sudden spikes - defined as >= 100% fill)
@router.get("/overflow-incidents")
def overflow_incidents(db: Session = Depends(get_db)):
    rows = db.query(FillHistory).filter(FillHistory.fill_pct >= 100).order_by(
        FillHistory.ts.desc()
    ).limit(50).all() # Get up to 50 most recent overflow incidents

    return {
        "incidents": [
            {"bin_id": r.bin_id, "timestamp": r.ts.isoformat(), "fill_pct": r.fill_pct}
            for r in rows
        ]
    }


# ✅ 30-Day Fill Trend (Average fill level per day across all bins)
@router.get("/trend-30days")
def trend_30days(db: Session = Depends(get_db)):
    end = datetime.now(timezone.utc)
    start = end - timedelta(days=30)

    rows = db.query(FillHistory).filter(FillHistory.ts >= start).all()
    by_day = defaultdict(list)

    for r in rows:
        by_day[r.ts.date().isoformat()].append(r.fill_pct)

    result = [
        {"date": day, "avg_fill": round(sum(vals) / len(vals), 2)}
        for day, vals in sorted(by_day.items())
    ]
    return {"trend_30days": result}


# ✅ Bin Utilization Classification
@router.get("/bin-utilization")
def bin_utilization(db: Session = Depends(get_db)):
    fill_time_data = average_fill_time(db) # Reuses existing endpoint logic
    per_bin = fill_time_data.get("per_bin_hours", {})
    
    high_count, medium_count, low_count, no_data_count = 0, 0, 0, 0
    
    for bin_id, hours in per_bin.items():
        if hours < 24: # Fills up in less than 1 day
            high_count += 1
        elif hours <= 72: # Fills up between 1 and 3 days
            medium_count += 1
        else: # Fills up in more than 3 days
            low_count += 1

    all_bins = db.query(Bin).count()
    no_data_count = all_bins - len(per_bin) # total - those with measured fill time
    
    return {
        "High Usage (< 24h)": high_count,
        "Medium Usage (1-3 days)": medium_count,
        "Low Usage (> 3 days)": low_count,
        "No Data": no_data_count
    }