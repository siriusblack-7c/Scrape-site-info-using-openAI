import React, { useState } from 'react';

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
        throw new Error('Failed to generate test steps');
      }

      const data = await response.json();
      setTestSteps(data.steps);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 py-6 flex flex-col justify-center sm:py-12">
      <div className="relative py-3 sm:max-w-xl sm:mx-auto">
        <div className="relative px-4 py-10 bg-white shadow-lg sm:rounded-3xl sm:p-20">
          <div className="max-w-md mx-auto">
            <div className="divide-y divide-gray-200">
              <div className="py-8 text-base leading-6 space-y-4 text-gray-700 sm:text-lg sm:leading-7">
                <h1 className="text-2xl font-bold text-center mb-8 text-indigo-600">
                  AI Test Automation Tool
                </h1>

                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label htmlFor="description" className="block text-sm font-medium text-gray-700">
                      Test Description
                    </label>
                    <textarea
                      id="description"
                      value={testDescription}
                      onChange={(e) => setTestDescription(e.target.value)}
                      rows="3"
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                      placeholder="e.g., I want to test the checkout flow of my e-commerce app"
                    />
                  </div>

                  <div>
                    <label htmlFor="url" className="block text-sm font-medium text-gray-700">
                      Website URL
                    </label>
                    <input
                      type="url"
                      id="url"
                      value={websiteUrl}
                      onChange={(e) => setWebsiteUrl(e.target.value)}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                      placeholder="https://example.com"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:bg-indigo-400"
                  >
                    {isLoading ? 'Generating Tests...' : 'Generate Test Steps'}
                  </button>
                </form>

                {error && (
                  <div className="mt-4 p-4 bg-red-50 rounded-md">
                    <p className="text-sm text-red-700">{error}</p>
                  </div>
                )}

                {testSteps.length > 0 && (
                  <div className="mt-8">
                    <h3 className="text-lg font-medium text-gray-900">Generated Test Steps:</h3>
                    <div className="mt-2 space-y-4">
                      {testSteps.map((step, index) => (
                        <div key={index} className="p-4 bg-gray-50 rounded-md">
                          <div className="flex items-start">
                            <span className="flex-shrink-0 h-6 w-6 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-medium">
                              {index + 1}
                            </span>
                            <div className="ml-3">
                              <p className="text-sm text-gray-700">{step.description}</p>
                              {step.status && (
                                <p className={`mt-1 text-sm ${step.status === 'success' ? 'text-green-600' : 'text-red-600'
                                  }`}>
                                  Status: {step.status}
                                </p>
                              )}
                              {step.evidence && (
                                <div className="mt-2">
                                  <img
                                    src={step.evidence}
                                    alt={`Evidence for step ${index + 1}`}
                                    className="rounded-md max-w-full"
                                  />
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
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
