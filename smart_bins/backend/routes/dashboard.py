from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from database import SessionLocal
from models import Bin, Alert, Task, User
from auth import get_current_user, require_admin

router = APIRouter()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


@router.get("/admin")
def admin_dashboard(db: Session = Depends(get_db), user=Depends(require_admin)):
    return {
        "total_bins": db.query(Bin).count(),
        "active_alerts": db.query(Alert).filter(Alert.is_resolved == False).count(),
        "workers": db.query(User).filter(User.role == "worker").count(),
        "assigned_tasks": db.query(Task).filter(Task.status == "assigned").count(),
        "completed_tasks": db.query(Task).filter(Task.status == "completed").count(),
    }


@router.get("/worker")
def worker_dashboard(user=Depends(get_current_user), db: Session = Depends(get_db)):
    if user.role != "worker":
        raise HTTPException(403, "Only workers can view this")

    total = db.query(Task).filter(Task.worker_id == user.id).count()
    completed = db.query(Task).filter(Task.worker_id == user.id, Task.status == "completed").count()
    pending = total - completed

    next_task = db.query(Task).filter(
        Task.worker_id == user.id,
        Task.status == "assigned"
    ).first()

    return {
        "total_tasks": total,
        "completed_tasks": completed,
        "pending_tasks": pending,
        "next_task": {
            "id": next_task.id,
            "alert_id": next_task.alert_id,
        } if next_task else None
    }
