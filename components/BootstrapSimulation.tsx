import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { useAppContext } from '../context';
import { ArrowPathIcon } from './Icons';

// Helper for statistics
const getPercentile = (data: number[], percentile: number): number => {
    if (data.length === 0) return 0;
    const sorted = [...data].sort((a, b) => a - b);
    const index = (percentile / 100) * (sorted.length - 1);
    const lower = Math.floor(index);
    const upper = Math.ceil(index);
    if (lower === upper) return sorted[lower];
    return sorted[lower] * (upper - index) + sorted[upper] * (index - lower);
};

const StatCard: React.FC<{ title: string; value: string | number; subtext?: string; valueClassName?: string; }> = ({ title, value, subtext, valueClassName }) => (
    <div className="bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-white/10 p-4 rounded-xl shadow-lg">
        <h3 className="text-sm font-medium text-slate-500 dark:text-slate-400">{title}</h3>
        <p className={`text-2xl font-bold mt-2 ${valueClassName || 'text-slate-900 dark:text-white'}`}>{value}</p>
        {subtext && <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">{subtext}</p>}
    </div>
);

// Main Component
const BootstrapSimulation: React.FC = () => {
    const { trades, accounts, theme } = useAppContext();

    // Input state
    const [selectedAccountId, setSelectedAccountId] = useState<string>('all');
    const [numSimulations, setNumSimulations] = useState<number>(1000);
    const [sampleSize, setSampleSize] = useState<number>(0);

    // Results state
    const [isSimulating, setIsSimulating] = useState<boolean>(false);
    const [results, setResults] = useState<any>(null);
    const [error, setError] = useState<string>('');

    const historicalTrades = useMemo(() => {
        return trades.filter(t => t.trade_taken && (selectedAccountId === 'all' || t.account_id === selectedAccountId));
    }, [trades, selectedAccountId]);
    
    useEffect(() => {
        setSampleSize(historicalTrades.length);
    }, [historicalTrades]);


    const handleRunSimulation = useCallback(() => {
        setIsSimulating(true);
        setResults(null);
        setError('');
    }, []);

    useEffect(() => {
        if (!isSimulating) {
            return;
        }

        const timerId = setTimeout(() => {
            if (historicalTrades.length < 10) {
                setError("Not enough data. At least 10 trades are needed for a meaningful simulation.");
                setIsSimulating(false);
                return;
            }

            const historicalPnls = historicalTrades.map(t => t.pnl);

            const simulationResults = {
                winRates: [] as number[],
                profitFactors: [] as number[],
                netPnls: [] as number[],
            };

            for (let i = 0; i < numSimulations; i++) {
                const samplePnls: number[] = [];
                for (let j = 0; j < sampleSize; j++) {
                    const randomIndex = Math.floor(Math.random() * historicalPnls.length);
                    samplePnls.push(historicalPnls[randomIndex]);
                }
                
                const winningTrades = samplePnls.filter(pnl => pnl > 0);
                const losingTrades = samplePnls.filter(pnl => pnl <= 0);
                
                const winRate = samplePnls.length > 0 ? (winningTrades.length / samplePnls.length) * 100 : 0;
                
                const totalGains = winningTrades.reduce((sum, pnl) => sum + pnl, 0);
                const totalLosses = Math.abs(losingTrades.reduce((sum, pnl) => sum + pnl, 0));
                
                const profitFactor = totalLosses > 0 ? totalGains / totalLosses : Infinity;
                const netPnl = totalGains - totalLosses;

                simulationResults.winRates.push(winRate);
                simulationResults.profitFactors.push(profitFactor);
                simulationResults.netPnls.push(netPnl);
            }
            
            // Calculate original metrics for comparison
            const originalWinning = historicalPnls.filter(p => p > 0);
            const originalLosing = historicalPnls.filter(p => p <= 0);
            const originalWinRate = historicalPnls.length > 0 ? (originalWinning.length / historicalPnls.length) * 100 : 0;
            const originalGains = originalWinning.reduce((s, p) => s + p, 0);
            const originalLosses = Math.abs(originalLosing.reduce((s,p) => s + p, 0));
            const originalProfitFactor = originalLosses > 0 ? originalGains / originalLosses : Infinity;

            // Create histogram data for Net P/L
            const netPnlData = simulationResults.netPnls;
            const minPnl = Math.min(...netPnlData);
            const maxPnl = Math.max(...netPnlData);
            const numBins = 20;
            const binWidth = (maxPnl - minPnl) / numBins;
            const bins = Array.from({ length: numBins }, (_, i) => ({
                name: `${(minPnl + i * binWidth).toFixed(0)}`,
                range: [minPnl + i * binWidth, minPnl + (i + 1) * binWidth],
                count: 0,
            }));

            netPnlData.forEach(pnl => {
                const binIndex = Math.min(Math.floor((pnl - minPnl) / binWidth), numBins - 1);
                if (bins[binIndex]) {
                    bins[binIndex].count++;
                }
            });

            setResults({
                original: {
                    winRate: originalWinRate,
                    profitFactor: originalProfitFactor,
                },
                winRateCI: [getPercentile(simulationResults.winRates, 5), getPercentile(simulationResults.winRates, 95)],
                profitFactorCI: [getPercentile(simulationResults.profitFactors.filter(isFinite), 5), getPercentile(simulationResults.profitFactors.filter(isFinite), 95)],
                netPnlCI: [getPercentile(simulationResults.netPnls, 5), getPercentile(simulationResults.netPnls, 95)],
                avgWinRate: simulationResults.winRates.reduce((a, b) => a + b, 0) / numSimulations,
                histogramData: bins,
            });

            setIsSimulating(false);
        }, 50);

        return () => clearTimeout(timerId);

    }, [isSimulating, historicalTrades, numSimulations, sampleSize]);

    const inputStyles = "w-full bg-slate-100 dark:bg-slate-700/50 text-slate-900 dark:text-white p-3 rounded-lg border border-slate-300 dark:border-slate-700 focus:ring-2 focus:ring-accent-500 focus:border-accent-500 text-base transition-colors";
    const labelStyles = "block text-sm font-medium text-slate-500 dark:text-slate-400 mb-1";
    
    return (
        <div className="space-y-6">
            <div className="text-center">
                <h2 className="text-3xl font-bold text-slate-900 dark:text-white flex items-center justify-center gap-3">
                    <ArrowPathIcon className="w-8 h-8 text-accent-500" />
                    Bootstrap Simulation
                </h2>
                <p className="text-slate-500 dark:text-slate-400 mt-2 max-w-2xl mx-auto">
                    Test the statistical robustness of your strategy by resampling your trades to see a range of possible outcomes.
                </p>
            </div>

            <div className="bg-white/80 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-xl shadow-lg p-6 max-w-4xl mx-auto">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 items-end">
                    <div className="lg:col-span-1">
                        <label htmlFor="sample-size" className={labelStyles}>Sample Size</label>
                        <input id="sample-size" type="number" value={sampleSize} onChange={e => setSampleSize(parseInt(e.target.value, 10))} className={inputStyles} />
                    </div>
                    <div className="lg:col-span-1">
                        <label htmlFor="num-sims" className={labelStyles}># of Sims</label>
                        <input id="num-sims" type="number" value={numSimulations} onChange={e => setNumSimulations(parseInt(e.target.value, 10))} className={inputStyles} />
                    </div>
                     <div className="lg:col-span-2">
                        <label htmlFor="data-source" className={labelStyles}>Data Source</label>
                        <select id="data-source" value={selectedAccountId} onChange={e => setSelectedAccountId(e.target.value)} className={inputStyles}>
                            <option value="all">All Accounts ({trades.filter(t => t.trade_taken).length} trades)</option>
                            {accounts.map(acc => <option key={acc.id} value={acc.id}>{acc.name} ({trades.filter(t => t.account_id === acc.id && t.trade_taken).length} trades)</option>)}
                        </select>
                    </div>
                    <div className="lg:col-span-1">
                        <button onClick={handleRunSimulation} disabled={isSimulating} className="w-full text-base font-semibold bg-gradient-to-r from-accent-500 to-green-500 text-white px-4 py-3 rounded-lg transition-all duration-300 hover:scale-105 hover:shadow-lg disabled:opacity-50 disabled:cursor-wait">
                            {isSimulating ? 'Running...' : 'Run'}
                        </button>
                    </div>
                </div>
                {error && <p className="text-red-500 text-sm mt-4 text-center">{error}</p>}
            </div>

             {isSimulating && (
                <div className="text-center p-12">
                    <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-accent-500"></div>
                    <p className="text-slate-500 dark:text-slate-400 mt-4">Resampling your history {numSimulations.toLocaleString()} times...</p>
                </div>
            )}
            
            {results && (
                 <div className="space-y-6 animate-fade-in">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <StatCard title="Original Win Rate" value={`${results.original.winRate.toFixed(1)}%`} />
                        <StatCard title="Original Profit Factor" value={isFinite(results.original.profitFactor) ? results.original.profitFactor.toFixed(2) : '∞'} />
                        <StatCard title="Avg. Sim Win Rate" value={`${results.avgWinRate.toFixed(1)}%`} />
                        <StatCard title="Win Rate 95% CI" value={`${results.winRateCI[0].toFixed(1)}% - ${results.winRateCI[1].toFixed(1)}%`} subtext="5th - 95th Percentile" />
                    </div>

                    <div className="bg-white/80 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-xl shadow-lg p-6 h-[28rem]">
                        <h3 className="text-lg font-semibold mb-4 text-slate-900 dark:text-white">Distribution of Net P/L Outcomes</h3>
                         <ResponsiveContainer width="100%" height="90%">
                            <BarChart data={results.histogramData} margin={{ top: 5, right: 20, left: -15, bottom: 0 }}>
                                <CartesianGrid strokeDasharray="3 3" stroke={theme === 'dark' ? '#334155' : '#e2e8f0'} />
                                <XAxis dataKey="name" name="Net P/L ($)" tick={{fontSize: 10}} />
                                <YAxis name="Frequency" tick={{fontSize: 10}} />
                                <Tooltip
                                    formatter={(value: number, name: string, props: any) => [`${value} simulations`, `Range: $${props.payload.range[0].toFixed(0)} to $${props.payload.range[1].toFixed(0)}`]}
                                    contentStyle={theme === 'dark' ? { backgroundColor: 'rgba(15, 23, 42, 0.9)', border: '1px solid #334155' } : {}}
                                />
                                <Bar dataKey="count" name="Frequency">
                                    {results.histogramData.map((_entry: any, index: number) => (
                                        <Cell key={`cell-${index}`} fill={theme === 'dark' ? '#4f46e5' : '#6366f1'} />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </div>

                     <div className="bg-white/80 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-xl shadow-lg p-6">
                        <h3 className="text-lg font-semibold mb-4 text-slate-900 dark:text-white">Confidence Intervals (95%)</h3>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                             <StatCard title="Net P/L" value={`$${results.netPnlCI[0].toFixed(0)} to $${results.netPnlCI[1].toFixed(0)}`} subtext="Range of likely outcomes for this sample size." />
                             <StatCard title="Win Rate" value={`${results.winRateCI[0].toFixed(1)}% to ${results.winRateCI[1].toFixed(1)}%`} subtext="Your true win rate likely falls in this range."/>
                             <StatCard title="Profit Factor" value={`${results.profitFactorCI[0].toFixed(2)} to ${results.profitFactorCI[1].toFixed(2)}`} subtext="Range of likely profit factor values." />
                        </div>
                        <div className="mt-4 text-center text-sm text-slate-500 dark:text-slate-400 italic">
                            If your original metrics fall within these 95% confidence intervals, it suggests your results are statistically robust and not likely due to random chance for the given sample size.
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default BootstrapSimulation;
