import React, { useState } from 'react';
import TestForm from './components/TestForm';
import ErrorMessage from './components/ErrorMessage';
import LoadingSpinner from './components/LoadingSpinner';
import TestSteps from './components/TestSteps';

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

    try {
      // TODO: Replace with actual API call
      const response = await fetch('http://localhost:8000/generate-tests', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          description: testDescription,
          url: websiteUrl,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'Failed to generate test steps');
      }

      const data = await response.json();
      setTestSteps(data.steps);
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
                  <LoadingSpinner message="Generating test steps and executing tests..." />
                )}

                {!isLoading && (
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
