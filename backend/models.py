from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import relationship
from datetime import datetime
import os

Base = declarative_base()

class TestRun(Base):
    __tablename__ = "test_runs"

    id = Column(Integer, primary_key=True, index=True)
    description = Column(String)
    url = Column(String)
    created_at = Column(DateTime, default=datetime.utcnow)
    steps = relationship("TestStep", back_populates="test_run")

class TestStep(Base):
    __tablename__ = "test_steps"

    id = Column(Integer, primary_key=True, index=True)
    test_run_id = Column(Integer, ForeignKey("test_runs.id"))
    description = Column(String)
    status = Column(String)
    evidence_path = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    test_run = relationship("TestRun", back_populates="steps")

# Create database engine
DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./test_automation.db")
engine = create_engine(DATABASE_URL)

# Create tables
def init_db():
    Base.metadata.create_all(bind=engine) 