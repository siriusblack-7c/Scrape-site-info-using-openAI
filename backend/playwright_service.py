from playwright.async_api import async_playwright, Page, Browser
import os
from typing import Dict, Optional
import asyncio
from datetime import datetime
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class PlaywrightService:
    def __init__(self):
        self.screenshot_dir = os.getenv("SCREENSHOT_DIR", "screenshots")
        os.makedirs(self.screenshot_dir, exist_ok=True)
        
    async def execute_test_step(self, page: Page, step: Dict) -> Dict:
        """
        Execute a single test step using Playwright.
        """
        try:
            # Take screenshot before action
            timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
            screenshot_path = os.path.join(self.screenshot_dir, f"step_{timestamp}.png")
            
            # Execute the action based on the step type
            action = step.get("action", "").lower()
            selector = step.get("selector")
            value = step.get("value")
            
            if action == "navigate":
                await page.goto(value)
                await page.wait_for_load_state("networkidle")
                
            elif action == "click":
                await page.click(selector)
                await page.wait_for_load_state("networkidle")
                
            elif action == "type":
                await page.fill(selector, value)
                
            elif action == "assert":
                if selector:
                    element = await page.wait_for_selector(selector)
                    if not element:
                        raise Exception(f"Element not found: {selector}")
                    if value:
                        text = await element.text_content()
                        if value not in text:
                            raise Exception(f"Expected text '{value}' not found in element")
                else:
                    raise Exception("Selector required for assert action")
                    
            elif action == "select":
                await page.select_option(selector, value)
                
            elif action == "wait":
                await page.wait_for_timeout(int(value))
                
            else:
                raise Exception(f"Unsupported action: {action}")
            
            # Take screenshot after successful action
            await page.screenshot(path=screenshot_path)
            
            return {
                "status": "success",
                "evidence": screenshot_path,
                "error": None
            }
            
        except Exception as e:
            # Take screenshot on failure
            error_screenshot = os.path.join(self.screenshot_dir, f"error_{timestamp}.png")
            await page.screenshot(path=error_screenshot)
            
            logger.error(f"Error executing step: {str(e)}")
            return {
                "status": "failed",
                "evidence": error_screenshot,
                "error": str(e)
            }
    
    async def execute_test_steps(self, url: str, steps: list) -> list:
        """
        Execute a list of test steps using Playwright.
        """
        async with async_playwright() as p:
            browser = await p.chromium.launch(headless=True)
            context = await browser.new_context()
            page = await context.new_page()
            
            results = []
            try:
                # Navigate to the initial URL
                await page.goto(url)
                await page.wait_for_load_state("networkidle")
                
                # Execute each step
                for step in steps:
                    result = await self.execute_test_step(page, step)
                    step["status"] = result["status"]
                    step["evidence"] = result["evidence"]
                    if result["error"]:
                        step["error"] = result["error"]
                    results.append(step)
                    
                    # Stop execution if a step fails
                    if result["status"] == "failed":
                        break
                        
            except Exception as e:
                logger.error(f"Error during test execution: {str(e)}")
                raise
                
            finally:
                await browser.close()
                
            return results 