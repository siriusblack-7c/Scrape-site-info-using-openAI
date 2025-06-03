# AI Test Automation Backend

This is the backend service for the AI Test Automation tool. It provides APIs for generating and executing automated tests using AI.

## Setup

1. Create a virtual environment:
```bash
python -m venv venv
```

2. Activate the virtual environment:
- Windows:
```bash
.\venv\Scripts\activate
```
- Unix/MacOS:
```bash
source venv/bin/activate
```

3. Install dependencies:
```bash
pip install -r requirements.txt
```

4. Install Playwright browsers:
```bash
playwright install
```

5. Create a `.env` file:
```bash
cp .env.example .env
```
Then edit the `.env` file with your configuration.

## Running the Server

Start the development server:
```bash
uvicorn main:app --reload
```

The API will be available at `http://localhost:8000`

## API Documentation

Once the server is running, you can access:
- Swagger UI: `http://localhost:8000/docs`
- ReDoc: `http://localhost:8000/redoc`

## Project Structure

- `main.py`: FastAPI application and routes
- `models.py`: Database models
- `requirements.txt`: Project dependencies
- `.env`: Environment variables (create from .env.example)

## Features

- FastAPI backend with async support
- SQLite database with SQLAlchemy ORM
- OpenAI integration for test generation
- Playwright for browser automation
- Screenshot capture and storage
- CORS support for frontend integration 