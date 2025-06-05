import React, { useState } from 'react';
import axios from 'axios';

function TestSteps({ steps, websiteUrl }) {
    const backendUrl = import.meta.env.VITE_BACKEND_URL || process.env.REACT_APP_BACKEND_URL || "http://localhost:8000";
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
            setCurrentStep(idx);
            try {
                const response = await axios.post(
                    `${backendUrl}/test-steps`,
                    { steps: [{ content: JSON.stringify(steps[idx]) }] }
                );
                const resultStep = response.data.steps[0];
                newResults[idx] = {
                    status: resultStep.error ? 'failed' : 'success',
                    error: resultStep.error,
                    evidence: resultStep.evidence,
                };
                setResults([...newResults]);
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
        setCurrentStep(-1);
    };

    const handleSkip = () => {
        setError(null);
        setSkipping(true);
        handleTestAllSteps(currentStep + 1);
        setSkipping(false);
    };

    // Retry a single step
    const handleRetryStep = async (stepIdx) => {
        setCurrentStep(stepIdx);
        setTesting(true);
        setError(null);
        let newResults = [...results];
        try {
            const response = await axios.post(
                `${backendUrl}/test-steps`,
                { steps: [{ content: JSON.stringify(steps[stepIdx]) }] }
            );
            const resultStep = response.data.steps[0];
            newResults[stepIdx] = {
                status: resultStep.error ? 'failed' : 'success',
                error: resultStep.error,
                evidence: resultStep.evidence,
            };
            setResults([...newResults]);
        } catch (err) {
            newResults[stepIdx] = {
                status: 'failed',
                error: err.response?.data?.detail || err.message,
                evidence: null,
            };
            setResults([...newResults]);
        }
        setTesting(false);
        setCurrentStep(-1);
    };

    // Skip a single step and run the next one, but keep error info and remove skip button
    const handleSkipStep = async (stepIdx) => {
        let newResults = [...results];
        // Mark as skipped but keep error and evidence
        newResults[stepIdx] = {
            ...newResults[stepIdx],
            status: 'skipped',
            // error and evidence remain unchanged
        };
        setResults([...newResults]);
        // Run the next step if it exists
        if (stepIdx + 1 < steps.length) {
            setCurrentStep(stepIdx + 1);
            setTesting(true);
            setError(null);
            try {
                const response = await axios.post(
                    `${backendUrl}/test-steps`,
                    { steps: [{ content: JSON.stringify(steps[stepIdx + 1]) }] }
                );
                const resultStep = response.data.steps[0];
                newResults[stepIdx + 1] = {
                    status: resultStep.error ? 'failed' : 'success',
                    error: resultStep.error,
                    evidence: resultStep.evidence,
                };
                setResults([...newResults]);
            } catch (err) {
                newResults[stepIdx + 1] = {
                    status: 'failed',
                    error: err.response?.data?.detail || err.message,
                    evidence: null,
                };
                setResults([...newResults]);
            }
            setTesting(false);
            setCurrentStep(-1);
        }
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
                    className="ml-auto px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:bg-blue-300 flex items-center"
                    onClick={() => handleTestAllSteps(0)}
                    disabled={testing || error}
                >
                    {testing ? (
                        <svg className="animate-spin h-4 w-4 text-white mr-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                    ) : null}
                    Test All Steps
                </button>
            </div>
            {error && <div className="p-2 bg-red-100 text-red-800 rounded">Error: {error}</div>}
            <div className="space-y-4 bg">
                {steps.map((step, index) => (
                    <div
                        key={index}
                        className="p-4 bg-gray-50 dark:bg-gray-900 rounded-lg shadow-sm border border-gray-100 dark:border-gray-700 hover:shadow-md transition duration-150 ease-in-out"
                    >
                        <div className="flex items-start space-x-4">
                            <span className="flex-shrink-0 h-8 w-8 rounded-full bg-indigo-200 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200 flex items-center justify-center font-medium ring-2 ring-indigo-50 dark:ring-indigo-900">
                                {index + 1}
                            </span>
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center text-sm font-medium text-gray-900 dark:text-gray-100">
                                    <div className="flex-1">
                                        <div><strong>Description:</strong> {step.description}</div>
                                        {step.action && <div><strong>Action:</strong> {step.action}</div>}
                                        {step.selector && <div><strong>Selector:</strong> {step.selector}</div>}
                                        {step.value && <div><strong>Value:</strong> {step.value}</div>}
                                    </div>
                                    {testing && currentStep === index && (
                                        <svg className="animate-spin h-5 w-5 text-indigo-500 ml-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                        </svg>
                                    )}
                                </div>
                                {results[index]?.error && (
                                    <div className="mt-1 p-2 bg-red-50 border border-red-200 rounded text-xs text-red-800">
                                        <strong>Error:</strong> {(() => {
                                            const err = String(results[index].error);
                                            // Try to extract screenshot and HTML paths
                                            const screenshotMatch = err.match(/Screenshot: ([^|]+) \|/);
                                            const htmlMatch = err.match(/HTML: ([^|]+)/);
                                            // Helper to make URLs absolute if needed
                                            const makeAbsolute = (path) => {
                                                if (!path) return null;
                                                if (/^https?:\/\//.test(path)) return path;
                                                // If already absolute (starts with /), use backendUrl as base
                                                if (path.startsWith('/')) return backendUrl + path;
                                                // Otherwise, treat as relative to backend
                                                return backendUrl + '/' + path;
                                            };
                                            return <>
                                                {err.split('|')[0]}
                                                {screenshotMatch && (
                                                    <>
                                                        <br />
                                                        <a href={makeAbsolute(screenshotMatch[1].trim())} target="_blank" rel="noopener noreferrer" className="underline text-blue-500">View Screenshot</a>
                                                    </>
                                                )}
                                                {htmlMatch && (
                                                    <>
                                                        <br />
                                                        <a href={makeAbsolute(htmlMatch[1].trim())} target="_blank" rel="noopener noreferrer" className="underline text-blue-500">View HTML</a>
                                                    </>
                                                )}
                                                <div className="flex gap-2 mt-2">
                                                    {results[index].status !== 'skipped' && (
                                                        <button
                                                            className="px-2 py-1 bg-yellow-500 text-white rounded hover:bg-yellow-600 text-xs"
                                                            onClick={() => handleSkipStep(index)}
                                                            disabled={testing}
                                                        >
                                                            Skip
                                                        </button>
                                                    )}
                                                    <button
                                                        className="px-2 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 text-xs"
                                                        onClick={() => handleRetryStep(index)}
                                                        disabled={testing}
                                                    >
                                                        Retry
                                                    </button>
                                                </div>
                                            </>;
                                        })()}
                                    </div>
                                )}
                            </div>
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
                ))}
            </div>
        </div>
    );
}

export default TestSteps; 