import React from 'react';

function LoadingSpinner({ message = 'Loading...' }) {
    return (
        <div className="mt-8 text-center space-y-4">
            <div className="relative">
                <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-indigo-600 border-t-transparent"></div>
                <div className="absolute inset-0 flex items-center justify-center">
                    <div className="h-6 w-6 rounded-full bg-indigo-600 animate-pulse"></div>
                </div>
            </div>
            <div className="space-y-2">
                <p className="text-sm font-medium text-gray-900">{message}</p>
                <p className="text-xs text-gray-500">This may take a few moments...</p>
            </div>
        </div>
    );
}

export default LoadingSpinner; 