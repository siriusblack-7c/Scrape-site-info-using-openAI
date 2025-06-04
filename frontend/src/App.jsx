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
    <div className="fixed inset-0 bg-gradient-to-b from-gray-50 to-gray-100 flex items-center justify-center">
      <div className="w-full h-full max-w-6xl max-h-[90vh] bg-white shadow-2xl rounded-3xl flex overflow-hidden">
        {/* Left: Form Panel */}
        <div className="w-full md:w-1/2 p-8 flex flex-col justify-center border-r border-gray-100">
          <div className="mb-8 text-center">
            <h1 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-600">
              AI Test Automation Tool
            </h1>
            <p className="text-sm text-gray-500 mt-2">
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
        </div>
        {/* Right: Result Panel */}
        <div className="w-full md:w-1/2 h-full flex flex-col bg-gray-50">
          <div className="flex-1 overflow-y-auto p-8">
            {/* Comments Section */}
            <div className="mb-6 p-4 bg-indigo-50 border border-indigo-100 rounded-lg text-sm text-indigo-800">
              <strong>Result Panel:</strong> Here you will see errors, loading status, and the generated test steps. <br />
              <span className="text-indigo-600">Tip:</span> After submitting your test description and URL, the results will appear here. Scroll if the content is long.
            </div>
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
  );
}

export default App; 