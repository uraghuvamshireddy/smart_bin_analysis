from sqlalchemy import Column, Integer, String, Float, DateTime,Boolean,ForeignKey
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from database import Base
from datetime import datetime, timezone

class Bin(Base):
    __tablename__ = "bins"

    id = Column(Integer, primary_key=True, index=True)
    bin_id = Column(String, unique=True, nullable=False)
    latitude = Column(Float, nullable=False)
    longitude = Column(Float, nullable=False)
    capacity_litres = Column(Integer)
    current_fill_pct = Column(Integer, default=0)
    status = Column(String, default="not full")
    created_at = Column(DateTime, server_default=func.now())

class FillHistory(Base):
    __tablename__ = "fill_history"

    id = Column(Integer, primary_key=True, index=True)
    bin_id = Column(String, nullable=False, index=True)
    ts = Column(DateTime, server_default=func.now())
    fill_pct = Column(Integer, nullable=False)

class User(Base):
    __tablename__ = "users"

    id = Column(Integer,primary_key=True,index=True)
    username=Column(String,unique=True,nullable=False)
    password=Column(String,nullable=False)
    role=Column(String,nullable=False)

class Alert(Base):
    __tablename__ = "alerts"
    id = Column(Integer, primary_key=True, index=True)
    bin_id = Column(String, ForeignKey("bins.bin_id"))
    is_resolved = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.now(timezone.utc))
    resolved_at = Column(DateTime, nullable=True)

class Task(Base):
    __tablename__ = "tasks"

    id = Column(Integer, primary_key=True, index=True)
    alert_id = Column(Integer, ForeignKey("alerts.id"))
    worker_id = Column(Integer, ForeignKey("users.id"))
    status = Column(String, default="assigned") 
    created_at = Column(DateTime, server_default=func.now())
    completed_at = Column(DateTime)

    alert = relationship("Alert", backref="task")
    worker = relationship("User")
    
