from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from database import SessionLocal
from models import Bin
from schemas import BinCreate, BinOut

router = APIRouter()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

@router.post("/", response_model=BinOut)
def create_bin(bin: BinCreate, db: Session = Depends(get_db)):
    db_bin = db.query(Bin).filter(Bin.bin_id == bin.bin_id).first()
    if db_bin:
        raise HTTPException(status_code=400, detail="Bin ID already exists")
    new_bin = Bin(bin_id=bin.bin_id, capacity_litres=bin.capacity_litres)
    db.add(new_bin)
    db.commit()
    db.refresh(new_bin)
    return new_bin

@router.get("/", response_model=list[BinOut])
def get_all_bins(db: Session = Depends(get_db)):
    bins = db.query(Bin).all()
    return bins
