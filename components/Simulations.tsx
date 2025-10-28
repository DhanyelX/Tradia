import React from 'react';
import { useAppContext } from '../context';
import { CubeTransparentIcon, TrendingDownIcon, ArrowPathIcon } from './Icons';

const SimulationCard: React.FC<{ icon: React.ReactNode, title: string, description: string, onClick: () => void }> = ({ icon, title, description, onClick }) => (
    <button onClick={onClick} className="text-left bg-white/80 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-xl shadow-lg p-6 transition-all duration-300 hover:shadow-2xl hover:-translate-y-2 hover:border-accent-500/50 h-full flex flex-col">
        <div className="flex items-center justify-center w-16 h-16 bg-accent-500/10 rounded-lg mb-4 flex-shrink-0">
            <div className="text-accent-500">{icon}</div>
        </div>
        <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">{title}</h3>
        <p className="text-sm text-slate-500 dark:text-slate-400 flex-grow">{description}</p>
    </button>
);

const Simulations: React.FC = () => {
    const { setView } = useAppContext();
    
    const simulations = [
        {
            title: "Monte Carlo Simulation",
            description: "Forecast thousands of potential equity curve outcomes based on your historical performance to understand the range of possibilities.",
            icon: <CubeTransparentIcon className="w-8 h-8" />,
            view: 'simulations/monte-carlo'
        },
        {
            title: "Time Under Water Analysis",
            description: "Analyze the duration and depth of your historical drawdowns to mentally prepare for and manage future periods of underperformance.",
            icon: <TrendingDownIcon className="w-8 h-8" />,
            view: 'simulations/time-under-water'
        },
        {
            title: "Bootstrap Simulation",
            description: "Resample your existing trades to test the robustness of your strategy's statistics, like win rate and profit factor, against randomness.",
            icon: <ArrowPathIcon className="w-8 h-8" />,
            view: 'simulations/bootstrap'
        }
    ];

    return (
        <div className="space-y-8">
            <div className="text-center">
                <h2 className="text-3xl font-bold text-slate-900 dark:text-white">What simulation do you want to run today?</h2>
                <p className="text-slate-500 dark:text-slate-400 mt-2 max-w-2xl mx-auto">Select a tool to stress-test your strategy, understand your risk profile, and build statistical confidence in your trading edge.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 pt-4">
                {simulations.map((sim, index) => (
                    <div key={sim.title} className="animate-fade-in-up" style={{ animationDelay: `${index * 150}ms` }}>
                         <SimulationCard 
                            icon={sim.icon}
                            title={sim.title}
                            description={sim.description}
                            onClick={() => setView(sim.view)}
                        />
                    </div>
                ))}
            </div>
        </div>
    );
};

export default Simulations;