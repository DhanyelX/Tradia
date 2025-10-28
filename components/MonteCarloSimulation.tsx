import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Line, Legend, ComposedChart } from 'recharts';
import { useAppContext } from '../context';
import { CubeTransparentIcon } from './Icons';

// Helper for statistics
const getPercentile = (data: number[], percentile: number): number => {
    if(data.length === 0) return 0;
    const sorted = [...data].sort((a, b) => a - b);
    const index = (percentile / 100) * (sorted.length - 1);
    const lower = Math.floor(index);
    const upper = Math.ceil(index);
    if (lower === upper) return sorted[lower];
    return sorted[lower] * (upper - index) + sorted[upper] * (index - lower);
};

// Main Component
const MonteCarloSimulation: React.FC = () => {
    const { trades, accounts, theme } = useAppContext();

    // Input state
    const [selectedAccountId, setSelectedAccountId] = useState<string>('all');
    const [numTrades, setNumTrades] = useState<number>(250);
    const [numSimulations, setNumSimulations] = useState<number>(1000);
    const [startCapital, setStartCapital] = useState<number>(100000);

    // Results state
    const [isSimulating, setIsSimulating] = useState<boolean>(false);
    const [results, setResults] = useState<any>(null);
    const [error, setError] = useState<string>('');

    const handleRunSimulation = useCallback(() => {
        setIsSimulating(true);
        setResults(null);
        setError('');
    }, []);

    useEffect(() => {
        if (!isSimulating) {
            return;
        }

        // Run simulation in a timeout to allow UI to update with loading state
        const timerId = setTimeout(() => {
            const historicalTrades = trades.filter(t => t.trade_taken && (selectedAccountId === 'all' || t.account_id === selectedAccountId));
            
            if (historicalTrades.length < 10) {
                setError("Not enough historical data. At least 10 trades are needed for a meaningful simulation.");
                setIsSimulating(false);
                return;
            }
            
            const historicalPnls = historicalTrades.map(t => t.pnl);
            
            const allPaths: number[][] = [];
            const finalEquities: number[] = [];

            for (let i = 0; i < numSimulations; i++) {
                let currentEquity = startCapital;
                const path = [startCapital];
                for (let j = 0; j < numTrades; j++) {
                    const randomPnl = historicalPnls[Math.floor(Math.random() * historicalPnls.length)];
                    currentEquity += randomPnl;
                    path.push(currentEquity);
                }
                allPaths.push(path);
                finalEquities.push(currentEquity);
            }

            const chartData = Array.from({ length: numTrades + 1 }, (_, tradeIndex) => {
                const equitiesAtStep = allPaths.map(path => path[tradeIndex]);
                return {
                    trade: tradeIndex,
                    median: getPercentile(equitiesAtStep, 50),
                    p95: getPercentile(equitiesAtStep, 95),
                    p5: getPercentile(equitiesAtStep, 5),
                    range: [getPercentile(equitiesAtStep, 5), getPercentile(equitiesAtStep, 95)],
                };
            });
            
            const probOfProfit = (finalEquities.filter(e => e > startCapital).length / numSimulations) * 100;
            const avgFinalEquity = finalEquities.reduce((a, b) => a + b, 0) / numSimulations;

            setResults({
                chartData,
                medianFinalEquity: getPercentile(finalEquities, 50),
                avgFinalEquity,
                probOfProfit,
                bestCase: getPercentile(finalEquities, 95),
                worstCase: getPercentile(finalEquities, 5),
            });

            setIsSimulating(false);
        }, 50);

        return () => clearTimeout(timerId);

    }, [isSimulating, trades, selectedAccountId, numTrades, numSimulations, startCapital]);

    const inputStyles = "w-full bg-slate-100 dark:bg-slate-700/50 text-slate-900 dark:text-white p-3 rounded-lg border border-slate-300 dark:border-slate-700 focus:ring-2 focus:ring-accent-500 focus:border-accent-500 text-base transition-colors";
    const labelStyles = "block text-sm font-medium text-slate-500 dark:text-slate-400 mb-1";

    return (
        <div className="space-y-6">
            <div className="text-center">
                <h2 className="text-3xl font-bold text-slate-900 dark:text-white flex items-center justify-center gap-3">
                    <CubeTransparentIcon className="w-8 h-8 text-accent-500" />
                    Monte Carlo Simulation
                </h2>
                <p className="text-slate-500 dark:text-slate-400 mt-2 max-w-2xl mx-auto">
                    Forecast potential equity curve outcomes by running thousands of simulations based on your historical performance.
                </p>
            </div>

            <div className="bg-white/80 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-xl shadow-lg p-6 max-w-4xl mx-auto">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 items-end">
                    <div className="lg:col-span-1">
                        <label htmlFor="start-capital" className={labelStyles}>Start Capital ($)</label>
                        <input id="start-capital" type="number" value={startCapital} onChange={e => setStartCapital(parseInt(e.target.value, 10))} className={inputStyles} />
                    </div>
                    <div className="lg:col-span-1">
                        <label htmlFor="num-trades" className={labelStyles}>Trades per Sim</label>
                        <input id="num-trades" type="number" value={numTrades} onChange={e => setNumTrades(parseInt(e.target.value, 10))} className={inputStyles} />
                    </div>
                     <div className="lg:col-span-1">
                        <label htmlFor="num-sims" className={labelStyles}># of Sims</label>
                        <input id="num-sims" type="number" value={numSimulations} onChange={e => setNumSimulations(parseInt(e.target.value, 10))} className={inputStyles} />
                    </div>
                     <div className="lg:col-span-1">
                        <label htmlFor="data-source" className={labelStyles}>Data Source</label>
                        <select id="data-source" value={selectedAccountId} onChange={e => setSelectedAccountId(e.target.value)} className={inputStyles}>
                            <option value="all">All Accounts</option>
                            {accounts.map(acc => <option key={acc.id} value={acc.id}>{acc.name}</option>)}
                        </select>
                    </div>
                    <div className="lg:col-span-1">
                        <button onClick={handleRunSimulation} disabled={isSimulating} className="w-full text-base font-semibold bg-gradient-to-r from-accent-500 to-green-500 text-white px-4 py-3 rounded-lg transition-all duration-300 hover:scale-105 hover:shadow-lg disabled:opacity-50 disabled:cursor-wait">
                            {isSimulating ? 'Simulating...' : 'Run'}
                        </button>
                    </div>
                </div>
                 {error && <p className="text-red-500 text-sm mt-4 text-center">{error}</p>}
            </div>

            {isSimulating && (
                <div className="text-center p-12">
                    <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-accent-500"></div>
                    <p className="text-slate-500 dark:text-slate-400 mt-4">Running {numSimulations.toLocaleString()} simulations... this may take a moment.</p>
                </div>
            )}
            
            {results && (
                <div className="space-y-6 animate-fade-in">
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                        <StatCard title="Median Final Equity" value={`$${results.medianFinalEquity.toLocaleString(undefined, { maximumFractionDigits: 0 })}`} />
                        <StatCard title="Avg Final Equity" value={`$${results.avgFinalEquity.toLocaleString(undefined, { maximumFractionDigits: 0 })}`} />
                        <StatCard title="Prob. of Profit" value={`${results.probOfProfit.toFixed(1)}%`} valueClassName={results.probOfProfit > 50 ? "text-green-500" : "text-red-500"} />
                        <StatCard title="Best Case (95%)" value={`$${results.bestCase.toLocaleString(undefined, { maximumFractionDigits: 0 })}`} valueClassName="text-green-500" />
                        <StatCard title="Worst Case (5%)" value={`$${results.worstCase.toLocaleString(undefined, { maximumFractionDigits: 0 })}`} valueClassName="text-red-500" />
                    </div>
                    
                    <div className="bg-white/80 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-xl shadow-lg p-6 h-[28rem]">
                        <h3 className="text-lg font-semibold mb-4 text-slate-900 dark:text-white">Simulated Equity Curves</h3>
                         <ResponsiveContainer width="100%" height="90%">
                            <ComposedChart data={results.chartData} margin={{ top: 5, right: 20, left: -15, bottom: 0 }}>
                                <defs>
                                    <linearGradient id="rangeFill" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor={theme === 'dark' ? '#334155' : '#e2e8f0'} stopOpacity={0.8}/>
                                        <stop offset="95%" stopColor={theme === 'dark' ? '#334155' : '#e2e8f0'} stopOpacity={0.1}/>
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" stroke={theme === 'dark' ? '#334155' : '#e2e8f0'} />
                                <XAxis dataKey="trade" name="Trades" tick={{fontSize: 12}} />
                                <YAxis domain={['auto', 'auto']} tickFormatter={(val) => `$${(val/1000).toFixed(0)}k`} tick={{fontSize: 12}} />
                                <Tooltip formatter={(value: any) => typeof value === 'number' ? `$${value.toLocaleString(undefined, { maximumFractionDigits: 0 })}` : value} contentStyle={theme === 'dark' ? { backgroundColor: 'rgba(15, 23, 42, 0.9)', border: '1px solid #334155' } : {}} />
                                <Legend />

                                <Area dataKey="range" name="5-95% Range" fill="url(#rangeFill)" strokeWidth={0} activeDot={false} />
                                <Line type="monotone" dataKey="median" name="Median Outcome" stroke="#4f46e5" strokeWidth={2.5} dot={false} />
                            </ComposedChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            )}
        </div>
    );
};

// Simple stat card, can be defined locally or imported
const StatCard: React.FC<{ title: string; value: string | number; valueClassName?: string; }> = ({ title, value, valueClassName }) => (
    <div className="bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-white/10 p-4 rounded-xl shadow-lg">
        <h3 className="text-sm font-medium text-slate-500 dark:text-slate-400">{title}</h3>
        <p className={`text-2xl font-bold mt-2 ${valueClassName || 'text-slate-900 dark:text-white'}`}>{value}</p>
    </div>
);

export default MonteCarloSimulation;