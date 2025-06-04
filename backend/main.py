from fastapi import FastAPI, HTTPException, Body
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional
import asyncio
from playwright.async_api import async_playwright
import json
import os
from datetime import datetime
import requests
from dotenv import load_dotenv

app = FastAPI()

# Enable CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, replace with specific origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

load_dotenv()
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")

class Step(BaseModel):
    content: str
    test_result: Optional[str] = None
    error: Optional[str] = None
    # Optionally, you can add action, selector, value fields for easier access

class TestRequest(BaseModel):
    steps: List[Step]

async def run_playwright_test(step: Step) -> Step:
    try:
        # Parse the content as JSON to extract action, selector, value, etc.
        try:
            step_data = json.loads(step.content) if isinstance(step.content, str) else step.content
        except Exception:
            step_data = step.content if isinstance(step.content, dict) else {"description": step.content}

        action = step_data.get("action")
        selector = step_data.get("selector")
        value = step_data.get("value")
        url = step_data.get("value") if action == "goto" else None

        async with async_playwright() as p:
            browser = await p.chromium.launch(headless=False)
            page = await browser.new_page()

            # Helper for error logging
            async def log_error_and_return(e, label="error"):
                timestamp = datetime.now().strftime("%Y%m%d_%H%M%S_%f")
                screenshot_path = f"{label}_screenshot_{timestamp}.png"
                html_path = f"{label}_page_{timestamp}.html"
                await page.screenshot(path=screenshot_path)
                content = await page.content()
                with open(html_path, "w", encoding="utf-8") as f:
                    f.write(content)
                print(f"[ERROR] {str(e)}\n[HTML] {content[:500]}")
                step.error = f"{str(e)} | Screenshot: {screenshot_path} | HTML: {html_path}"
                await browser.close()
                return step

            # Helper to log and save every step
            async def log_and_save_step(label):
                timestamp = datetime.now().strftime("%Y%m%d_%H%M%S_%f")
                screenshot_path = f"step_{label}_{timestamp}.png"
                html_path = f"step_{label}_{timestamp}.html"
                await page.screenshot(path=screenshot_path)
                content = await page.content()
                with open(html_path, "w", encoding="utf-8") as f:
                    f.write(content)
                print(f"[STEP {label}]\n[HTML] {content[:500]}")
                return content

            # Helper to check for blank/error/anti-bot pages
            def is_blank_or_error_page(page_text):
                text = page_text.strip().lower()
                if not text or len(text) < 50:
                    return True
                error_phrases = [
                    "access denied", "bot detected", "are you human", "recaptcha", "captcha",
                    "error", "forbidden", "not allowed", "blocked", "cloudflare"
                ]
                for phrase in error_phrases:
                    if phrase in text:
                        return True
                return False

            # Actually perform the action
            if action == "goto" and url:
                try:
                    response = await page.goto(url)
                    page_text = await log_and_save_step("goto")
                    if not response or response.status >= 400:
                        return await log_error_and_return(f"Navigation to {url} failed with status {response.status if response else 'No response'}.", label="goto_fail")
                    if is_blank_or_error_page(page_text):
                        return await log_error_and_return("Blocked by anti-bot, CAPTCHA, or blank/error page after navigation.", label="goto_fail")
                except Exception as e:
                    return await log_error_and_return(f"Navigation to {url} failed: {str(e)}", label="goto_fail")
            elif action == "click" and selector:
                try:
                    await page.click(selector, timeout=5000)
                    page_text = await log_and_save_step("click")
                    if is_blank_or_error_page(page_text):
                        return await log_error_and_return("Blocked by anti-bot, CAPTCHA, or blank/error page after click.", label="click_fail")
                except Exception as e:
                    return await log_error_and_return(f"Click failed for selector '{selector}': {str(e)}", label="click_fail")
            elif action == "type" and selector and value:
                try:
                    await page.fill(selector, value, timeout=5000)
                    page_text = await log_and_save_step("type")
                    if is_blank_or_error_page(page_text):
                        return await log_error_and_return("Blocked by anti-bot, CAPTCHA, or blank/error page after type.", label="type_fail")
                except Exception as e:
                    return await log_error_and_return(f"Type failed for selector '{selector}': {str(e)}", label="type_fail")
            elif action == "waitForSelector" and selector:
                try:
                    await page.wait_for_selector(selector, timeout=5000)
                    page_text = await log_and_save_step("waitForSelector")
                    if is_blank_or_error_page(page_text):
                        return await log_error_and_return("Blocked by anti-bot, CAPTCHA, or blank/error page after waitForSelector.", label="wait_fail")
                except Exception as e:
                    return await log_error_and_return(f"waitForSelector failed for selector '{selector}': {str(e)}", label="wait_fail")
            elif action == "assertVisible" and selector:
                try:
                    el = await page.query_selector(selector)
                    page_text = await log_and_save_step("assertVisible")
                    if not el or not await el.is_visible():
                        return await log_error_and_return(f"Element {selector} is not visible", label="assertVisible_fail")
                    if is_blank_or_error_page(page_text):
                        return await log_error_and_return("Blocked by anti-bot, CAPTCHA, or blank/error page after assertVisible.", label="assertVisible_fail")
                except Exception as e:
                    return await log_error_and_return(f"assertVisible failed for selector '{selector}': {str(e)}", label="assertVisible_fail")
            elif action == "assert" and selector:
                try:
                    el = await page.query_selector(selector)
                    page_text = await log_and_save_step("assert")
                    if not el:
                        return await log_error_and_return(f"Element {selector} not found", label="assert_fail")
                    if value:
                        text = await el.text_content()
                        if value not in (text or ""):
                            return await log_error_and_return(f"Expected value '{value}' not found in element text: {text}", label="assert_fail")
                    if is_blank_or_error_page(page_text):
                        return await log_error_and_return("Blocked by anti-bot, CAPTCHA, or blank/error page after assert.", label="assert_fail")
                except Exception as e:
                    return await log_error_and_return(f"assert failed for selector '{selector}': {str(e)}", label="assert_fail")
            # After each action, check for reCAPTCHA or similar blocks
            recaptcha_selectors = [
                'iframe[src*="recaptcha"]',
                'div.g-recaptcha',
                'div.h-captcha',
                'iframe[src*="hcaptcha"]',
                'div[data-sitekey]',
            ]
            recaptcha_found = False
            for sel in recaptcha_selectors:
                if await page.query_selector(sel):
                    recaptcha_found = True
                    break
            page_text = await page.content()
            if ("recaptcha" in page_text.lower() or "captcha" in page_text.lower()) and recaptcha_found:
                return await log_error_and_return("Blocked by reCAPTCHA or similar bot protection.", label="recaptcha_fail")

            step.test_result = "Success"
            await log_and_save_step("success")
            await browser.close()
            return step
    except Exception as e:
        print(f"[FATAL ERROR] {str(e)}")
        step.error = str(e)
        return step

@app.post("/test-steps")
async def test_steps(request: TestRequest):
    results = []
    
    for step in request.steps:
        # Run the test for each step
        result = await run_playwright_test(step)
        results.append(result)
        
        # If there's an error, stop processing further steps
        if result.error:
            break
    
    return {"steps": results}

@app.post("/openai-proxy")
def openai_proxy(payload: dict = Body(...)):
    headers = {
        "Authorization": f"Bearer {OPENAI_API_KEY}",
        "Content-Type": "application/json"
    }
    response = requests.post(
        "https://api.openai.com/v1/chat/completions",
        headers=headers,
        json=payload
    )
    return response.json()

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000) 