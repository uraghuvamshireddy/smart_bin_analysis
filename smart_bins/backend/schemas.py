from pydantic import BaseModel,Field
from datetime import datetime

class BinCreate(BaseModel):
    bin_id: str
    latitude: float
    longitude: float
    capacity_litres: int

class BinOut(BaseModel):
    id: int
    bin_id: str
    latitude: float
    longitude: float
    capacity_litres: int
    current_fill_pct: int
    status: str
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

class UserCreate(BaseModel):
    username: str = Field(..., min_length=3, max_length=50)
    password: str = Field(..., min_length=4, max_length=72)
    role:str

class UserOut(BaseModel):
    id:int
    username:str
    role:str

    class Config:
        orm_mode =True

class LoginRequest(BaseModel):
    username:str
    password:str

class AlertOut(BaseModel):
    id: int
    bin_id: str
    is_resolved: bool
    created_at: datetime
    resolved_at: datetime | None

    class Config:
        orm_mode = True

class TaskCreate(BaseModel):
    alert_id: int
    worker_id: int


class TaskOut(BaseModel):
    id: int
    alert:AlertOut
    worker_id: int
    status: str
    created_at: datetime
    completed_at: datetime | None

    class Config:
        orm_mode = True