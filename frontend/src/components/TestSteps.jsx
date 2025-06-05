import React, { useState } from 'react';
import axios from 'axios';
import StepCard from './StepCard';

function TestSteps({ steps, websiteUrl }) {
    const backendUrl = import.meta.env.VITE_BACKEND_URL || process.env.REACT_APP_BACKEND_URL || "http://localhost:8000";
    const [results, setResults] = useState(Array(steps.length).fill(null));
    const [testing, setTesting] = useState(false);
    const [error, setError] = useState(null);
    const [currentStep, setCurrentStep] = useState(0);

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

    // Skip a single step and continue testing all remaining steps
    const handleSkipStep = async (stepIdx) => {
        let newResults = [...results];
        // Mark as skipped but keep error and evidence
        newResults[stepIdx] = {
            ...newResults[stepIdx],
            status: 'skipped',
            // error and evidence remain unchanged
        };
        setResults([...newResults]);
        // Continue testing all remaining steps
        if (stepIdx + 1 < steps.length) {
            await handleTestAllSteps(stepIdx + 1);
        }
    };

    if (!steps.length) return null;

    return (
        <div className="mt-8 space-y-6">
            <div className="flex items-center space-x-3 mb-4">
                <h3 className="text-lg font-medium !text-gray-500 dark:text-gray-100">Generated Test Steps</h3>
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
                    <StepCard
                        key={index}
                        step={step}
                        index={index}
                        result={results[index]}
                        testing={testing}
                        currentStep={currentStep}
                        handleRetryStep={handleRetryStep}
                        handleSkipStep={handleSkipStep}
                        backendUrl={backendUrl}
                    />
                ))}
            </div>
        </div>
    );
}

export default TestSteps; 