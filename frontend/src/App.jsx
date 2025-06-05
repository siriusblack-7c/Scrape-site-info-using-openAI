import React, { useState, useEffect } from 'react';
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
  const [theme, setTheme] = useState(() => localStorage.getItem('theme') || 'light');

  useEffect(() => {
    localStorage.setItem('theme', theme);
    if (theme === 'dark') {
      document.body.classList.add('dark');
    } else {
      document.body.classList.remove('dark');
    }
  }, [theme]);

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
      if (!data.choices || !data.choices[0] || !data.choices[0].message || !data.choices[0].message.content) {
        if (data.error && data.error.message) {
          throw new Error('OpenAI API error: ' + data.error.message);
        }
        throw new Error('OpenAI API did not return a valid response. Please check your API key and try again.');
      }
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
    <>
      <button
        className="absolute top-4 right-4 px-4 py-2 rounded bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-100 z-50 shadow"
        onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}
      >
        {theme === 'light' ? '🌙 Dark' : '☀️ Light'}
      </button>
      <div className="fixed inset-0 flex items-center justify-center" style={{ background: 'linear-gradient(to bottom, var(--color-bg-from), var(--color-bg-to))' }}>
        <div className="w-full h-full max-w-6xl max-h-[90vh] flex overflow-hidden rounded-3xl shadow-2xl">
          {/* Left: Form Panel */}
          <div className={`w-full md:w-1/2 p-8 flex flex-col justify-center border-r ${theme === 'dark' ? 'border-gray-800 bg-gray-900 text-gray-100' : 'border-gray-100 bg-white text-gray-900'}`}>
            <div className="mb-8 text-center">
              <h1 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-[var(--color-primary)] to-[var(--color-accent)] dark:from-[var(--color-primary-dark)] dark:to-[var(--color-accent-dark)]">
                AI Test Automation Tool
              </h1>
              <p className={`text-sm mt-2 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-500'}`}>Generate and execute automated tests using AI</p>
            </div>
            <TestForm
              testDescription={testDescription}
              websiteUrl={websiteUrl}
              isLoading={isLoading}
              onDescriptionChange={(e) => setTestDescription(e.target.value)}
              onUrlChange={(e) => setWebsiteUrl(e.target.value)}
              onSubmit={handleSubmit}
              color="var(--color-primary)"
            />
          </div>
          {/* Right: Result Panel */}
          <div className={`w-full md:w-1/2 h-full flex flex-col ${theme === 'dark' ? 'bg-gray-800 text-gray-100' : 'bg-gray-50 text-gray-900'}`}>
            <div className="flex-1 overflow-y-auto p-8">
              {/* Comments Section */}
              <div className={`mb-6 p-4 border rounded-lg text-sm ${theme === 'dark' ? 'bg-gray-900 border-gray-700 text-indigo-200' : 'bg-indigo-50 border-indigo-100 text-indigo-800'}`}>
                <strong>Result Panel:</strong>
                {!isLoading && testSteps.length > 0 ? null : (
                  <>
                    {' '}Here you will see errors, loading status, and the generated test steps. <br />
                    <span className={theme === 'dark' ? 'text-indigo-300' : 'text-indigo-600'}>Tip:</span> After submitting your test description and URL, the results will appear here. Scroll if the content is long.
                  </>
                )}
              </div>
              <ErrorMessage
                message={error}
                onDismiss={() => setError('')}
              />
              {isLoading && (
                <LoadingSpinner message="Generating test steps using OpenAI..." />
              )}
              {!isLoading && testSteps.length > 0 && (
                <TestSteps steps={testSteps} websiteUrl={websiteUrl} />
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

export default App; 