
import React from 'react';
import { LogoIcon } from './Icons';

const LoadingScreen: React.FC = () => {
    return (
        <div className="fixed inset-0 bg-slate-950 flex flex-col items-center justify-center z-50 text-slate-300">
            <div className="immersive-loading-logo mb-8">
                <LogoIcon className="w-24 h-24 text-accent-500" />
            </div>
            <div className="flex items-center space-x-2">
                <div className="text-lg font-semibold tracking-wider">ANALYZING EDGE</div>
                <div className="loading-dots flex space-x-1.5">
                    <div className="w-2 h-2 bg-accent-500 rounded-full"></div>
                    <div className="w-2 h-2 bg-accent-500 rounded-full"></div>
                    <div className="w-2 h-2 bg-accent-500 rounded-full"></div>
                </div>
            </div>
            <div className="w-full max-w-lg h-20 mt-8 relative overflow-hidden">
                 <svg width="100%" height="100%" viewBox="0 0 800 100" preserveAspectRatio="none" className="absolute inset-0">
                    <defs>
                        <linearGradient id="chartGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                            <stop offset="0%" className="loading-chart-gradient-stop" stopColor="#16a34a" stopOpacity="0.5" />
                            <stop offset="100%" stopColor="#16a34a" stopOpacity="0" />
                        </linearGradient>
                    </defs>
                    <path className="loading-chart-line" fill="url(#chartGradient)" stroke="#16a34a" strokeWidth="2"
                        d="M-100,50 C0,20 100,80 200,50 S300,20 400,50 S500,80 600,50 S700,20 800,50" />
                </svg>
            </div>
        </div>
    );
};

export default LoadingScreen;
