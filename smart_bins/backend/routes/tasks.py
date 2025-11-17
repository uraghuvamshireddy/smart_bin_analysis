from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from database import SessionLocal
from models import Task, Alert, User, Bin
from schemas import TaskCreate, TaskOut
from auth import get_current_user, require_admin
from datetime import datetime
from config import USE_HARDWARE, IOT_SECRET_KEY

router = APIRouter()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

@router.post("/", response_model=TaskOut, dependencies=[Depends(require_admin)])
def assign_task(task: TaskCreate, db: Session = Depends(get_db)):
    alert = db.query(Alert).filter(Alert.id == task.alert_id, Alert.is_resolved == False).first()
    if not alert:
        raise HTTPException(404, "Alert not found or resolved")

    worker = db.query(User).filter(User.id == task.worker_id, User.role == "worker").first()
    if not worker:
        raise HTTPException(400, "Worker not found")

    exists = db.query(Task).filter(Task.alert_id == task.alert_id, Task.status == "assigned").first()
    if exists:
        raise HTTPException(400, "Alert already assigned")

    new_task = Task(alert_id=task.alert_id, worker_id=task.worker_id)
    db.add(new_task)
    db.commit()
    db.refresh(new_task)
    return new_task


@router.post("/{task_id}/complete", response_model=TaskOut)
def complete_task(task_id: int, user = Depends(get_current_user),
                  db: Session = Depends(get_db)):

    task = db.query(Task).filter(Task.id == task_id).first()
    if not task:
        raise HTTPException(404, "Task not found")

    if user.role != "worker" or user.id != task.worker_id:
        raise HTTPException(403, "Unauthorized")

    if task.status == "completed":
        raise HTTPException(400, "Task already completed")

    alert = db.query(Alert).filter(Alert.id == task.alert_id).first()
    if not alert:
        raise HTTPException(404, "Associated alert not found")

    bin_obj = db.query(Bin).filter(Bin.bin_id == alert.bin_id).first()
    if not bin_obj:
        raise HTTPException(404, "Associated bin not found")

    if USE_HARDWARE:
        if bin_obj.current_fill_pct <= 5:
            task.status = "completed"
            task.completed_at = datetime.utcnow()
            alert.is_resolved = True
            alert.resolved_at = datetime.utcnow()
            bin_obj.current_fill_pct = 0
            bin_obj.status = "not full"
        else:
            raise HTTPException(400, "Bin not clean enough according to sensor. Please re-check and try again.")
    else:
        task.status = "completed"
        task.completed_at = datetime.utcnow()
        alert.is_resolved = True
        alert.resolved_at = datetime.utcnow()
        bin_obj.current_fill_pct = 0
        bin_obj.status = "not full"

    db.commit()
    db.refresh(task)
    return task


@router.get("/admin/list", response_model=list[TaskOut], dependencies=[Depends(require_admin)])
def list_all_tasks(db: Session = Depends(get_db)):
    return db.query(Task).all()


@router.get("/worker/list", response_model=list[TaskOut])
def worker_tasks(user = Depends(get_current_user), db: Session = Depends(get_db)):
    if user.role != "worker":
        raise HTTPException(403, "Only workers")

    return db.query(Task).join(Alert).filter(Task.worker_id == user.id).all()