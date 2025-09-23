from sqlalchemy import Column, Integer, String, DateTime
from sqlalchemy.sql import func
from sqlalchemy.ext.declarative import declarative_base

Base = declarative_base()

class Bin(Base):
    __tablename__ = "bins"
    id = Column(Integer, primary_key=True, index=True)
    bin_id = Column(String, unique=True, nullable=False)
    capacity_litres = Column(Integer)
    last_collected = Column(DateTime)
    created_at = Column(DateTime, server_default=func.now())

class FillHistory(Base):
    __tablename__ = "fill_history"
    id = Column(Integer, primary_key=True, index=True)
    bin_id = Column(String, nullable=False, index=True)
    ts = Column(DateTime, server_default=func.now())
    fill_pct = Column(Integer, nullable=False)
