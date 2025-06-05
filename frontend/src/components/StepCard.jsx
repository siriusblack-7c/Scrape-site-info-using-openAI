import React from 'react';

function StepCard({
    step, index, result, testing, currentStep, handleRetryStep, handleSkipStep, backendUrl
}) {
    return (
        <div
            className="p-4 !bg-[#3b82f6dd] rounded-lg shadow-sm border border-slate-300 hover:shadow-md transition duration-150 ease-in-out"
        >
            <div className="flex items-start space-x-4">
                <span className="flex-shrink-0 h-8 w-8 rounded-full bg-indigo-200 text-indigo-800 flex items-center justify-center font-medium ring-2 ring-indigo-50">
                    {index + 1}
                </span>
                <div className="flex-1 min-w-0">
                    <div className="flex items-center text-sm font-medium !text-gray-200">
                        <div className="flex-1">
                            <div><strong>Description:</strong> {step.description}</div>
                            {step.action && <div><strong>Action:</strong> {step.action}</div>}
                            {step.selector && <div><strong>Selector:</strong> {step.selector}</div>}
                            {step.value && <div><strong>Value:</strong> {step.value}</div>}
                        </div>
                        {testing && currentStep === index && (
                            <svg className="animate-spin h-5 w-5 !text-indigo-500 ml-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                        )}
                    </div>
                    {result?.error && (
                        <div className="mt-1 p-2 bg-red-50 border border-red-200 rounded text-xs text-red-800">
                            <strong>Error:</strong> {(() => {
                                const err = String(result.error);
                                const screenshotMatch = err.match(/Screenshot: ([^|]+) \|/);
                                const htmlMatch = err.match(/HTML: ([^|]+)/);
                                const makeAbsolute = (path) => {
                                    if (!path) return null;
                                    if (/^https?:\/\//.test(path)) return path;
                                    if (path.startsWith('/')) return backendUrl + path;
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
                                        {result.status !== 'skipped' && (
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
            {result && (
                <div className={`mt-2 text-sm ${result.status === 'success' ? 'text-green-600' : 'text-red-900'}`}>
                    {result.status === 'success' ? '✅ Success' : `❌ Failed`}
                    {result.evidence && (
                        <div className="mt-1">
                            <a href={result.evidence} target="_blank" rel="noopener noreferrer" className="underline text-blue-500">View Evidence</a>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}

export default StepCard; 