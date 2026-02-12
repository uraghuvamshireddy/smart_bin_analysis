from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from database import SessionLocal
from models import Bin, FillHistory, Alert, Task
from schemas import BinReadingCreate, BinReadingOut
from auth import get_current_user, require_admin
from datetime import datetime, timezone
from config import USE_HARDWARE, IOT_SECRET_KEY

router = APIRouter()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

@router.post("/", response_model=BinReadingOut)
def create_reading(reading: BinReadingCreate, db: Session = Depends(get_db)):
    
    bin_data = db.query(Bin).filter(Bin.bin_id == reading.bin_id).first()
    if not bin_data:
        raise HTTPException(status_code=404, detail="Bin not found")
    new_val = reading.fill_pct
    bin_data.current_fill_pct = new_val
    bin_data.status = "full" if new_val > 80 else "not full"
    alert = db.query(Alert).filter(Alert.bin_id == bin_data.bin_id, Alert.is_resolved == False).first()
    if new_val > 80:
        if not alert:
            new_alert = Alert(
                bin_id=bin_data.bin_id,
                is_resolved=False,
                created_at=datetime.now(timezone.utc)
            )
            db.add(new_alert)
    

    new_reading = FillHistory(bin_id=reading.bin_id, fill_pct=new_val, ts=datetime.now(timezone.utc))
    db.add(new_reading)
    db.commit()
    db.refresh(new_reading)
    return new_reading

@router.get("/", response_model=list[BinReadingOut], dependencies=[Depends(require_admin)])
def get_all_readings(db: Session = Depends(get_db)):
    return db.query(FillHistory).all()

@router.get("/{bin_id}", response_model=list[BinReadingOut], dependencies=[Depends(require_admin)])
def get_readings_for_bin(bin_id: str, db: Session = Depends(get_db)):
    bin_exists = db.query(Bin).filter(Bin.bin_id == bin_id).first()
    if not bin_exists:
        raise HTTPException(status_code=404, detail="Bin not found")
    readings = db.query(FillHistory).filter(FillHistory.bin_id == bin_id).order_by(FillHistory.ts.desc()).all()
    return readings