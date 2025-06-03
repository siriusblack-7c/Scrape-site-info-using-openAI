import React from 'react';

function TestSteps({ steps }) {
    if (!steps.length) return null;

    return (
        <div className="mt-8 space-y-6">
            <div className="flex items-center space-x-3">
                <h3 className="text-lg font-medium text-gray-900">Generated Test Steps</h3>
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800">
                    {steps.length} steps
                </span>
            </div>
            <div className="space-y-4">
                {steps.map((step, index) => (
                    <div
                        key={index}
                        className="p-4 bg-white rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition duration-150 ease-in-out"
                    >
                        <div className="flex items-start space-x-4">
                            <span className="flex-shrink-0 h-8 w-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-medium ring-2 ring-indigo-50">
                                {index + 1}
                            </span>
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-gray-900">{step.description}</p>
                                {step.status && (
                                    <div className="mt-2 flex items-center">
                                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${step.status === 'success'
                                                ? 'bg-green-100 text-green-800'
                                                : 'bg-red-100 text-red-800'
                                            }`}>
                                            {step.status === 'success' ? (
                                                <svg className="-ml-0.5 mr-1.5 h-2 w-2 text-green-400" fill="currentColor" viewBox="0 0 8 8">
                                                    <circle cx="4" cy="4" r="3" />
                                                </svg>
                                            ) : (
                                                <svg className="-ml-0.5 mr-1.5 h-2 w-2 text-red-400" fill="currentColor" viewBox="0 0 8 8">
                                                    <circle cx="4" cy="4" r="3" />
                                                </svg>
                                            )}
                                            {step.status}
                                        </span>
                                    </div>
                                )}
                                {step.evidence && (
                                    <div className="mt-3">
                                        <div className="relative group">
                                            <img
                                                src={step.evidence}
                                                alt={`Evidence for step ${index + 1}`}
                                                className="rounded-md max-w-full shadow-sm transition duration-150 ease-in-out group-hover:shadow-md"
                                            />
                                            <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-10 transition duration-150 ease-in-out rounded-md"></div>
                                        </div>
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