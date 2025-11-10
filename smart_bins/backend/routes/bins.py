from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from database import SessionLocal
from models import Bin
from schemas import BinCreate, BinOut
from auth import get_current_user, require_admin

router = APIRouter()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

@router.post("/", response_model=BinOut, dependencies=[Depends(require_admin)])
def create_bin(bin: BinCreate, db: Session = Depends(get_db)):
    db_bin = db.query(Bin).filter(Bin.bin_id == bin.bin_id).first()
    if db_bin:
        raise HTTPException(status_code=400, detail="Bin ID already exists")
    new_bin = Bin(bin_id=bin.bin_id, latitude=bin.latitude, longitude=bin.longitude, capacity_litres=bin.capacity_litres)
    db.add(new_bin)
    db.commit()
    db.refresh(new_bin)
    return new_bin

@router.get("/", response_model=list[BinOut])
def get_all_bins(db: Session = Depends(get_db)):
    return db.query(Bin).all()

@router.get("/{bin_id}", response_model=BinOut)
def get_bin(bin_id: str, db: Session = Depends(get_db)):
    b = db.query(Bin).filter(Bin.bin_id == bin_id).first()
    if not b:
        raise HTTPException(status_code=404, detail="Bin not found")
    return b

@router.delete("/{bin_id}", dependencies=[Depends(require_admin)])
def delete_bin(bin_id: str, db: Session = Depends(get_db)):
    b = db.query(Bin).filter(Bin.bin_id == bin_id).first()
    if not b:
        raise HTTPException(status_code=404, detail="Bin not found")
    db.delete(b)
    db.commit()
    return {"detail": "deleted"}

@router.put("/{bin_id}", response_model=BinOut, dependencies=[Depends(require_admin)])
def update_bin(bin_id: str, updated: BinCreate, db: Session = Depends(get_db)):
    bin_obj = db.query(Bin).filter(Bin.bin_id == bin_id).first()
    if not bin_obj:
        raise HTTPException(status_code=404, detail="Bin not found")

    bin_obj.bin_id = updated.bin_id
    bin_obj.latitude = updated.latitude
    bin_obj.longitude = updated.longitude
    bin_obj.capacity_litres = updated.capacity_litres

    db.commit()
    db.refresh(bin_obj)
    return bin_obj
