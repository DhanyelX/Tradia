import React from 'react';

const ApiKeyMissingBanner: React.FC = () => {
    return (
        <div 
            role="alert"
            className="fixed top-0 left-0 right-0 bg-red-600 text-white text-sm text-center p-2 z-[100] shadow-lg"
        >
            <strong>Configuration Needed:</strong> Your Gemini <code>API_KEY</code> is not set. AI features will be disabled. Please add it as an environment variable in your Vercel project settings to enable all features.
        </div>
    );
};

export default ApiKeyMissingBanner;
