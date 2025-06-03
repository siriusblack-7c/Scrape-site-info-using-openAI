from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional
import os
from dotenv import load_dotenv

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

class TestRequest(BaseModel):
    description: str
    url: str

class TestStep(BaseModel):
    description: str
    status: Optional[str] = None
    evidence: Optional[str] = None

class TestResponse(BaseModel):
    steps: List[TestStep]

@app.get("/")
async def read_root():
    return {"message": "AI Test Automation API is running"}

@app.post("/generate-tests", response_model=TestResponse)
async def generate_tests(request: TestRequest):
    try:
        # TODO: Implement OpenAI integration for test generation
        # TODO: Implement Playwright for test execution
        # For now, return mock data
        mock_steps = [
            TestStep(
                description="Navigate to the website",
                status="success",
                evidence="screenshot1.png"
            ),
            TestStep(
                description="Verify the page loaded correctly",
                status="success",
                evidence="screenshot2.png"
            )
        ]
        return TestResponse(steps=mock_steps)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000) 