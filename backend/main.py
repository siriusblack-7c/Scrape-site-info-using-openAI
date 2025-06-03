from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional, Dict
import os
from dotenv import load_dotenv
from openai_service import OpenAIService
from playwright_service import PlaywrightService
from database_service import DatabaseService
from models import TestRun, TestStep
from datetime import datetime

# Load environment variables
load_dotenv()

app = FastAPI(
    title="AI Test Automation API",
    description="API for generating and executing automated tests using AI",
    version="1.0.0"
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],  # React frontend
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize services
openai_service = OpenAIService()
playwright_service = PlaywrightService()
db_service = DatabaseService()

class TestRequest(BaseModel):
    description: str
    url: str

class TestStep(BaseModel):
    description: str
    status: Optional[str] = None
    evidence: Optional[str] = None
    action: Optional[str] = None
    selector: Optional[str] = None
    value: Optional[str] = None
    error: Optional[str] = None

class TestResponse(BaseModel):
    steps: List[TestStep]

class TestRunSummary(BaseModel):
    id: int
    description: str
    url: str
    created_at: datetime
    total_steps: int
    successful_steps: int
    failed_steps: int
    pending_steps: int

@app.get("/")
async def read_root():
    return {"message": "AI Test Automation API is running"}

@app.post("/generate-tests", response_model=TestResponse)
async def generate_tests(request: TestRequest):
    try:
        # Generate test steps using OpenAI
        test_steps = await openai_service.generate_test_steps(
            description=request.description,
            url=request.url
        )
        
        # Format the steps for the response
        formatted_steps = openai_service.format_test_steps(test_steps)
        
        # Store the test run and steps in the database
        test_run = db_service.create_test_run(request.description, request.url)
        db_service.add_test_steps(test_run.id, formatted_steps)
        
        return TestResponse(steps=[TestStep(**step) for step in formatted_steps])
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/execute-tests", response_model=TestResponse)
async def execute_tests(request: TestRequest):
    try:
        # Generate test steps using OpenAI
        test_steps = await openai_service.generate_test_steps(
            description=request.description,
            url=request.url
        )
        
        # Format the steps for execution
        formatted_steps = openai_service.format_test_steps(test_steps)
        
        # Store the test run and steps in the database
        test_run = db_service.create_test_run(request.description, request.url)
        db_steps = db_service.add_test_steps(test_run.id, formatted_steps)
        
        # Execute the test steps using Playwright
        executed_steps = await playwright_service.execute_test_steps(
            url=request.url,
            steps=formatted_steps
        )
        
        # Update the database with execution results
        for step, db_step in zip(executed_steps, db_steps):
            db_service.update_test_step(
                db_step.id,
                step["status"],
                step["evidence"]
            )
        
        return TestResponse(steps=[TestStep(**step) for step in executed_steps])
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/test-runs", response_model=List[TestRunSummary])
async def get_test_runs(limit: int = 10):
    """
    Get a list of recent test runs with their summaries.
    """
    try:
        test_runs = db_service.get_recent_test_runs(limit)
        return [TestRunSummary(**db_service.get_test_run_summary(run.id)) for run in test_runs]
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/test-runs/{test_run_id}", response_model=TestResponse)
async def get_test_run(test_run_id: int):
    """
    Get a specific test run with its steps.
    """
    try:
        test_run = db_service.get_test_run(test_run_id)
        if not test_run:
            raise HTTPException(status_code=404, detail="Test run not found")
            
        steps = db_service.get_test_steps(test_run_id)
        return TestResponse(steps=[TestStep(
            description=step.description,
            status=step.status,
            evidence=step.evidence_path,
            created_at=step.created_at
        ) for step in steps])
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000) 