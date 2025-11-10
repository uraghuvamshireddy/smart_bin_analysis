from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from database import SessionLocal
from models import Alert
from schemas import AlertOut
from auth import require_admin

router = APIRouter()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

@router.get("/active", response_model=list[AlertOut], dependencies=[Depends(require_admin)])
def get_active_alerts(db: Session = Depends(get_db)):
    return db.query(Alert).filter(Alert.is_resolved == False).all()


@router.get("/resolved", response_model=list[AlertOut], dependencies=[Depends(require_admin)])
def get_resolved_alerts(db: Session = Depends(get_db)):
    return db.query(Alert).filter(Alert.is_resolved == True).all()
