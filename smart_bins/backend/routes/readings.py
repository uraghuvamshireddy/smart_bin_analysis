from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from database import SessionLocal
from models import Bin
from schemas import BinReadingCreate, BinReadingOut
from models import FillHistory

router = APIRouter()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

@router.post("/", response_model=BinReadingOut)
def create_reading(reading: BinReadingCreate, db: Session = Depends(get_db)):
    bin_exists = db.query(Bin).filter(Bin.bin_id == reading.bin_id).first()
    if not bin_exists:
        raise HTTPException(status_code=404, detail="Bin not found")
    new_reading = FillHistory(bin_id=reading.bin_id, fill_pct=reading.fill_pct)
    db.add(new_reading)
    db.commit()
    db.refresh(new_reading)
    return new_reading

@router.get("/", response_model=list[BinReadingOut])
def get_all_readings(db: Session = Depends(get_db)):
    readings = db.query(FillHistory).all()
    return readings
