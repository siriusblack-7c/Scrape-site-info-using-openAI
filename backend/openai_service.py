from openai import OpenAI
import os
from typing import List, Dict
import json

class OpenAIService:
    def __init__(self):
        self.client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))
        
    async def generate_test_steps(self, description: str, url: str) -> List[Dict]:
        """
        Generate test steps using OpenAI API based on the test description and URL.
        """
        prompt = f"""
        Given the following test scenario:
        Description: {description}
        URL: {url}

        Generate a list of specific, actionable test steps that can be automated using Playwright.
        Each step should be clear, concise, and executable.
        Focus on critical user flows and functionality.

        Return the response as a JSON array of objects with the following structure:
        [
            {{
                "description": "Step description",
                "action": "Specific action to take (e.g., 'click', 'type', 'assert')",
                "selector": "CSS selector or text to find the element",
                "value": "Value to input (if applicable)"
            }}
        ]
        """

        try:
            response = self.client.chat.completions.create(
                model="gpt-4-turbo-preview",  # Using GPT-4 for better test generation
                messages=[
                    {"role": "system", "content": "You are an expert QA automation engineer. Generate clear, specific test steps that can be automated."},
                    {"role": "user", "content": prompt}
                ],
                temperature=0.7,
                max_tokens=1000
            )

            # Extract and parse the JSON response
            content = response.choices[0].message.content
            # Find JSON array in the response
            start_idx = content.find('[')
            end_idx = content.rfind(']') + 1
            if start_idx == -1 or end_idx == 0:
                raise ValueError("No valid JSON array found in the response")
            
            json_str = content[start_idx:end_idx]
            test_steps = json.loads(json_str)
            
            return test_steps

        except Exception as e:
            raise Exception(f"Error generating test steps: {str(e)}")

    def format_test_steps(self, steps: List[Dict]) -> List[Dict]:
        """
        Format the test steps for the API response.
        """
        formatted_steps = []
        for step in steps:
            formatted_step = {
                "description": step["description"],
                "status": "pending",  # Initial status
                "evidence": None,     # Will be updated after execution
                "action": step.get("action"),
                "selector": step.get("selector"),
                "value": step.get("value")
            }
            formatted_steps.append(formatted_step)
        
        return formatted_steps

    def list_models(self):
        try:
            response = self.client.models.list()
            return [model.id for model in response.data]
        except Exception as e:
            raise Exception(f"Error listing models: {str(e)}") 