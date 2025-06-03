from sqlalchemy.orm import Session
from sqlalchemy import create_engine, desc
from models import TestRun, TestStep, Base
from typing import List, Dict, Optional
from datetime import datetime
import os

class DatabaseService:
    def __init__(self):
        self.database_url = os.getenv("DATABASE_URL", "sqlite:///./test_automation.db")
        self.engine = create_engine(self.database_url)
        Base.metadata.create_all(bind=self.engine)
    
    def create_test_run(self, description: str, url: str) -> TestRun:
        """
        Create a new test run and return it.
        """
        with Session(self.engine) as session:
            test_run = TestRun(
                description=description,
                url=url,
                created_at=datetime.utcnow()
            )
            session.add(test_run)
            session.commit()
            session.refresh(test_run)
            return test_run
    
    def add_test_steps(self, test_run_id: int, steps: List[Dict]) -> List[TestStep]:
        """
        Add test steps to a test run.
        """
        with Session(self.engine) as session:
            test_steps = []
            for step in steps:
                test_step = TestStep(
                    test_run_id=test_run_id,
                    description=step["description"],
                    status=step.get("status", "pending"),
                    evidence_path=step.get("evidence"),
                    created_at=datetime.utcnow()
                )
                session.add(test_step)
                test_steps.append(test_step)
            session.commit()
            return test_steps
    
    def update_test_step(self, step_id: int, status: str, evidence_path: Optional[str] = None) -> TestStep:
        """
        Update a test step's status and evidence.
        """
        with Session(self.engine) as session:
            step = session.query(TestStep).filter(TestStep.id == step_id).first()
            if step:
                step.status = status
                if evidence_path:
                    step.evidence_path = evidence_path
                session.commit()
                session.refresh(step)
            return step
    
    def get_test_run(self, test_run_id: int) -> Optional[TestRun]:
        """
        Get a test run by ID with its steps.
        """
        with Session(self.engine) as session:
            return session.query(TestRun).filter(TestRun.id == test_run_id).first()
    
    def get_test_steps(self, test_run_id: int) -> List[TestStep]:
        """
        Get all steps for a test run.
        """
        with Session(self.engine) as session:
            return session.query(TestStep)\
                .filter(TestStep.test_run_id == test_run_id)\
                .order_by(TestStep.id)\
                .all()
    
    def get_recent_test_runs(self, limit: int = 10) -> List[TestRun]:
        """
        Get recent test runs with their steps.
        """
        with Session(self.engine) as session:
            return session.query(TestRun)\
                .order_by(desc(TestRun.created_at))\
                .limit(limit)\
                .all()
    
    def get_test_run_summary(self, test_run_id: int) -> Dict:
        """
        Get a summary of a test run including step counts.
        """
        with Session(self.engine) as session:
            test_run = session.query(TestRun).filter(TestRun.id == test_run_id).first()
            if not test_run:
                return None
                
            steps = session.query(TestStep).filter(TestStep.test_run_id == test_run_id).all()
            
            return {
                "id": test_run.id,
                "description": test_run.description,
                "url": test_run.url,
                "created_at": test_run.created_at,
                "total_steps": len(steps),
                "successful_steps": len([s for s in steps if s.status == "success"]),
                "failed_steps": len([s for s in steps if s.status == "failed"]),
                "pending_steps": len([s for s in steps if s.status == "pending"])
            } 