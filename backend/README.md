# Backend Testing Service

This is a FastAPI backend service that integrates with Playwright for automated testing of frontend steps.

## Setup

1. Create a virtual environment:
```bash
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

2. Install dependencies:
```bash
pip install -r requirements.txt
```

3. Install Playwright browsers:
```bash
playwright install
```

## Running the Service

Start the server:
```bash
python main.py
```

The server will run on `http://localhost:8000`

## API Endpoints

### POST /test-steps
Tests a list of steps using Playwright.

Request body:
```json
{
    "steps": [
        {
            "content": "Step description",
            "test_result": null,
            "error": null
        }
    ]
}
```

Response:
```json
{
    "steps": [
        {
            "content": "Step description",
            "test_result": "Test passed successfully",
            "error": null
        }
    ]
}
```

If an error occurs during testing, the response will include the error message and stop processing further steps. 