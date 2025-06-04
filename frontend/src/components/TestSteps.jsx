import React, { useState } from 'react';
import axios from 'axios';

function TestSteps({ steps, websiteUrl }) {
    const [results, setResults] = useState(Array(steps.length).fill(null));
    const [testing, setTesting] = useState(false);
    const [error, setError] = useState(null);
    const [currentStep, setCurrentStep] = useState(0);
    const [skipping, setSkipping] = useState(false);

    const handleTestAllSteps = async (startIdx = 0) => {
        setTesting(true);
        setError(null);
        let newResults = [...results];
        let idx = startIdx;
        for (; idx < steps.length; idx++) {
            try {
                const response = await axios.post(
                    'http://localhost:8000/test-steps',
                    { steps: [{ content: JSON.stringify(steps[idx]) }] }
                );
                const resultStep = response.data.steps[0];
                newResults[idx] = {
                    status: resultStep.error ? 'failed' : 'success',
                    error: resultStep.error,
                    evidence: resultStep.evidence,
                };
                setResults([...newResults]);
                setCurrentStep(idx);
                if (resultStep.error) {
                    setError(resultStep.error || 'Step failed');
                    setTesting(false);
                    return;
                }
            } catch (err) {
                setError(err.response?.data?.detail || err.message);
                setTesting(false);
                return;
            }
        }
        setTesting(false);
    };

    const handleSkip = () => {
        setError(null);
        setSkipping(true);
        handleTestAllSteps(currentStep + 1);
        setSkipping(false);
    };

    if (!steps.length) return null;

    return (
        <div className="mt-8 space-y-6">
            <div className="flex items-center space-x-3 mb-4">
                <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">Generated Test Steps</h3>
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200">
                    {steps.length} steps
                </span>
                <button
                    className="ml-auto px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:bg-blue-300"
                    onClick={() => handleTestAllSteps(0)}
                    disabled={testing || error}
                >
                    Test All Steps
                </button>
                {error && (
                    <button
                        className="ml-2 px-4 py-2 bg-yellow-500 text-white rounded hover:bg-yellow-600 disabled:bg-yellow-300"
                        onClick={handleSkip}
                        disabled={testing || skipping}
                    >
                        Skip
                    </button>
                )}
            </div>
            {error && <div className="p-2 bg-red-100 text-red-800 rounded">Error: {error}</div>}
            <div className="space-y-4 bg">
                {steps.map((step, index) => (
                    <div
                        key={index}
                        className="p-4 bg-white dark:bg-gray-900 rounded-lg shadow-sm border border-gray-100 dark:border-gray-700 hover:shadow-md transition duration-150 ease-in-out"
                    >
                        <div className="flex items-start space-x-4">
                            <span className="flex-shrink-0 h-8 w-8 rounded-full bg-indigo-200 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200 flex items-center justify-center font-medium ring-2 ring-indigo-50 dark:ring-indigo-900">
                                {index + 1}
                            </span>
                            <div className="flex-1 min-w-0">
                                <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                                    <div><strong>Description:</strong> {step.description}</div>
                                    {step.action && <div><strong>Action:</strong> {step.action}</div>}
                                    {step.selector && <div><strong>Selector:</strong> {step.selector}</div>}
                                    {step.value && <div><strong>Value:</strong> {step.value}</div>}
                                    {results[index]?.error && (
                                        <div className="mt-1 p-2 bg-red-50 border border-red-200 rounded text-xs text-red-800">
                                            <strong>Error:</strong> {(() => {
                                                const err = String(results[index].error);
                                                // Try to extract screenshot and HTML paths
                                                const screenshotMatch = err.match(/Screenshot: ([^|]+) \|/);
                                                const htmlMatch = err.match(/HTML: ([^|]+)/);
                                                return <>
                                                    {err.split('|')[0]}
                                                    {screenshotMatch && (
                                                        <>
                                                            <br />
                                                            <a href={screenshotMatch[1].trim()} target="_blank" rel="noopener noreferrer" className="underline text-blue-500">View Screenshot</a>
                                                        </>
                                                    )}
                                                    {htmlMatch && (
                                                        <>
                                                            <br />
                                                            <a href={htmlMatch[1].trim()} target="_blank" rel="noopener noreferrer" className="underline text-blue-500">View HTML</a>
                                                        </>
                                                    )}
                                                </>;
                                            })()}
                                        </div>
                                    )}
                                </div>
                                {results[index] && (
                                    <div className={`mt-2 text-sm ${results[index].status === 'success' ? 'text-green-600' : 'text-red-600'}`}>
                                        {results[index].status === 'success' ? '✅ Success' : `❌ Failed`}
                                        {results[index].evidence && (
                                            <div className="mt-1">
                                                <a href={results[index].evidence} target="_blank" rel="noopener noreferrer" className="underline text-blue-500">View Evidence</a>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

export default TestSteps; 