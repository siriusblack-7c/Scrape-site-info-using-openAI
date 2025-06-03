import React, { useState } from 'react';
import TestForm from './components/TestForm';
import ErrorMessage from './components/ErrorMessage';
import LoadingSpinner from './components/LoadingSpinner';
import TestSteps from './components/TestSteps';
import { callOpenAI } from './openaiApi';

function App() {
  const [testDescription, setTestDescription] = useState('');
  const [websiteUrl, setWebsiteUrl] = useState('');
  const [testSteps, setTestSteps] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    setTestSteps([]);

    const prompt = `
      Given the following test scenario:
      Description: ${testDescription}
      URL: ${websiteUrl}

      Generate a list of specific, actionable test steps that can be automated using Playwright.
      Each step should be clear, concise, and executable.
      Focus on critical user flows and functionality.

      Return the response as a JSON array of objects with the following structure:
      [
        {
          "description": "Step description",
          "action": "Specific action to take (e.g., 'click', 'type', 'assert')",
          "selector": "CSS selector or text to find the element",
          "value": "Value to input (if applicable)"
        }
      ]
    `;

    try {
      const data = await callOpenAI(prompt);
      // Try to extract JSON array from the response
      const content = data.choices[0].message.content;
      const startIdx = content.indexOf('[');
      const endIdx = content.lastIndexOf(']') + 1;
      let steps = [];
      if (startIdx !== -1 && endIdx !== -1) {
        const jsonStr = content.slice(startIdx, endIdx);
        steps = JSON.parse(jsonStr);
      } else {
        throw new Error('Could not parse test steps from OpenAI response.');
      }
      setTestSteps(steps);
    } catch (err) {
      setError(err.message || 'An unexpected error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 py-6 flex flex-col justify-center sm:py-12">
      <div className="relative py-3 sm:max-w-xl sm:mx-auto">
        <div className="absolute inset-0 bg-gradient-to-r from-indigo-400 to-purple-500 shadow-lg transform -skew-y-6 sm:skew-y-0 sm:-rotate-6 sm:rounded-3xl"></div>
        <div className="relative px-4 py-10 bg-white shadow-lg sm:rounded-3xl sm:p-20">
          <div className="max-w-md mx-auto">
            <div className="divide-y divide-gray-200">
              <div className="py-8 text-base leading-6 space-y-6 text-gray-700 sm:text-lg sm:leading-7">
                <div className="text-center space-y-2">
                  <h1 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-600">
                    AI Test Automation Tool
                  </h1>
                  <p className="text-sm text-gray-500">
                    Generate and execute automated tests using AI
                  </p>
                </div>

                <TestForm
                  testDescription={testDescription}
                  websiteUrl={websiteUrl}
                  isLoading={isLoading}
                  onDescriptionChange={(e) => setTestDescription(e.target.value)}
                  onUrlChange={(e) => setWebsiteUrl(e.target.value)}
                  onSubmit={handleSubmit}
                />

                <ErrorMessage
                  message={error}
                  onDismiss={() => setError('')}
                />

                {isLoading && (
                  <LoadingSpinner message="Generating test steps using OpenAI..." />
                )}

                {!isLoading && testSteps.length > 0 && (
                  <TestSteps steps={testSteps} />
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App; 