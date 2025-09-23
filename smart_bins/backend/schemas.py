from pydantic import BaseModel
from datetime import datetime

class BinCreate(BaseModel):
    bin_id: str
    capacity_litres: int

class BinOut(BaseModel):
    id: int
    bin_id: str
    capacity_litres: int
    last_collected: datetime | None
    created_at: datetime

    class Config:
        orm_mode = True

class BinReadingCreate(BaseModel):
    bin_id: str
    fill_pct: int

class BinReadingOut(BaseModel):
    id: int
    bin_id: str
    ts: datetime
    fill_pct: int

    class Config:
        orm_mode = True