

import React, { useState, useMemo, useEffect } from 'react';
import { useAppContext } from '../context';
import { RiskOfRuinIcon } from './Icons';

const InfoCard: React.FC<{ title: string; value: string; subtext?: string; isPrimary?: boolean }> = ({ title, value, subtext, isPrimary = false }) => {
    const primaryStyles = "bg-accent-500/10 dark:bg-accent-900/50 border-accent-500/50";
    const defaultStyles = "bg-slate-100 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700/50";
    const primaryText = "text-accent-600 dark:text-accent-300";
    const defaultText = "text-slate-900 dark:text-white";

    return (
        <div className={`p-4 rounded-xl border ${isPrimary ? primaryStyles : defaultStyles} transition-all`}>
            <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">{title}</p>
            <p className={`text-3xl font-bold mt-1 ${isPrimary ? primaryText : defaultText}`}>{value}</p>
            {subtext && <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">{subtext}</p>}
        </div>
    );
};

const RoRGauge: React.FC<{ value: number }> = ({ value }) => {
    const [animatedValue, setAnimatedValue] = useState(0);

    useEffect(() => {
        const targetValue = Math.min(isNaN(value) ? 0 : value, 100);
        const startValue = animatedValue;
        const difference = targetValue - startValue;
        const duration = 800; // ms
        let startTime: number | null = null;

        const step = (timestamp: number) => {
            if (!startTime) startTime = timestamp;
            const progress = Math.min((timestamp - startTime) / duration, 1);
            const easedProgress = 1 - Math.pow(1 - progress, 4); // easeOutQuart

            const currentValue = startValue + difference * easedProgress;
            setAnimatedValue(currentValue);
            
            if (progress < 1) {
                requestAnimationFrame(step);
            } else {
                setAnimatedValue(targetValue); // Ensure it ends on the exact value
            }
        };
        
        const animationFrameId = requestAnimationFrame(step);
        return () => cancelAnimationFrame(animationFrameId);
    }, [value]);

    const getRiskProfile = (ror: number) => {
        if (ror < 1) return { color: '#22c55e', label: 'Very Low', gradientId: 'gauge-gradient-green' };
        if (ror < 5) return { color: '#10b981', label: 'Low', gradientId: 'gauge-gradient-emerald' };
        if (ror < 15) return { color: '#eab308', label: 'Moderate', gradientId: 'gauge-gradient-yellow' };
        if (ror < 30) return { color: '#f97316', label: 'High', gradientId: 'gauge-gradient-orange' };
        return { color: '#ef4444', label: 'Very High', gradientId: 'gauge-gradient-red' };
    };

    const { color, label, gradientId } = getRiskProfile(animatedValue);

    const width = 280;
    const height = 140;
    const cx = width / 2;
    const cy = height - 20;
    const radius = 100;
    const strokeWidth = 25;

    const valueToAngle = (val: number) => -90 + (val / 100) * 180;
    const angle = valueToAngle(animatedValue);
    
    const arcPath = (r: number) => `M ${cx - r},${cy} A ${r},${r} 0 0 1 ${cx + r},${cy}`;

    return (
        <div className="flex flex-col items-center w-full">
            <svg viewBox={`0 0 ${width} ${height}`} className="w-full max-w-xs drop-shadow-lg">
                <defs>
                    <filter id="gauge-shadow" x="-50%" y="-50%" width="200%" height="200%">
                        <feDropShadow dx="0" dy="4" stdDeviation="4" floodColor="#000" floodOpacity="0.15" />
                    </filter>
                    <linearGradient id="gauge-gradient-green" x1="0" y1="0" x2="1" y2="0"><stop stopColor="#16a34a"/><stop offset="1" stopColor="#4ade80"/></linearGradient>
                    <linearGradient id="gauge-gradient-emerald" x1="0" y1="0" x2="1" y2="0"><stop stopColor="#059669"/><stop offset="1" stopColor="#34d399"/></linearGradient>
                    <linearGradient id="gauge-gradient-yellow" x1="0" y1="0" x2="1" y2="0"><stop stopColor="#d97706"/><stop offset="1" stopColor="#fbbf24"/></linearGradient>
                    <linearGradient id="gauge-gradient-orange" x1="0" y1="0" x2="1" y2="0"><stop stopColor="#ea580c"/><stop offset="1" stopColor="#fb923c"/></linearGradient>
                    <linearGradient id="gauge-gradient-red" x1="0" y1="0" x2="1" y2="0"><stop stopColor="#dc2626"/><stop offset="1" stopColor="#f87171"/></linearGradient>
                </defs>

                <g filter="url(#gauge-shadow)">
                    <path d={arcPath(radius)} fill="none" className="stroke-slate-200 dark:stroke-slate-700" strokeWidth={strokeWidth} strokeLinecap="round" />
                    <path d={arcPath(radius)} fill="none" stroke={`url(#${gradientId})`} strokeWidth={strokeWidth} strokeLinecap="round" strokeDasharray={Math.PI * radius} strokeDashoffset={Math.PI * radius * (1 - animatedValue / 100)} style={{ transition: 'stroke-dashoffset 800ms cubic-bezier(0.23, 1, 0.32, 1)' }} />
                    <path d={arcPath(radius - strokeWidth / 2 + 1)} fill="none" className="stroke-black/5 dark:stroke-black/20" strokeWidth="1" />
                    <path d={arcPath(radius + strokeWidth / 2 - 1)} fill="none" className="stroke-white/20 dark:stroke-white/10" strokeWidth="1" />
                </g>
                
                <g transform={`rotate(${angle}, ${cx}, ${cy})`} style={{ transition: 'transform 800ms cubic-bezier(0.23, 1, 0.32, 1)' }}>
                    <path d={`M ${cx} ${cy - radius - 10} L ${cx + 7} ${cy} L ${cx - 7} ${cy} Z`} className="fill-slate-800 dark:fill-slate-200" filter="url(#gauge-shadow)" />
                </g>
                <circle cx={cx} cy={cy} r="12" className="fill-slate-300 dark:fill-slate-600 stroke-slate-400/50 dark:stroke-slate-900/50" strokeWidth="1.5" filter="url(#gauge-shadow)" />
                <circle cx={cx} cy={cy} r="5" className="fill-slate-700 dark:fill-slate-300" />

            </svg>
            
            <div className="text-center mt-2">
                <p className="transition-colors duration-300 text-4xl font-bold tracking-tighter" style={{ color: color }}>
                    {animatedValue.toFixed(2)}%
                </p>
                <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
                    Risk of Ruin
                </p>
            </div>
            
            <div className={`mt-4 px-4 py-1.5 rounded-full text-sm font-semibold transition-all duration-300`} style={{ backgroundColor: `${color}20`, color: color }}>
                Risk Level: {label}
            </div>
        </div>
    );
};


const RiskOfRuinCalculator: React.FC = () => {
    const { accounts, trades } = useAppContext();

    const [dataSource, setDataSource] = useState<'auto' | 'manual'>('auto');
    const [selectedAccountId, setSelectedAccountId] = useState<string>('all');
    
    // Manual inputs
    const [winRate, setWinRate] = useState<string>('50');
    const [avgRR, setAvgRR] = useState<string>('1.5');
    const [riskPerTrade, setRiskPerTrade] = useState<string>('1');
    const [ruinLevel, setRuinLevel] = useState<string>('20');
    
    const autoMetrics = useMemo(() => {
        const relevantTrades = trades.filter(t => t.trade_taken && (selectedAccountId === 'all' || t.account_id === selectedAccountId));
        if (relevantTrades.length < 5) return null; // Require at least 5 trades for a meaningful calculation

        const winningTrades = relevantTrades.filter(t => t.pnl > 0);
        const losingTrades = relevantTrades.filter(t => t.pnl <= 0);
        
        const wr = (winningTrades.length / relevantTrades.length) * 100;

        const avgWin = winningTrades.length > 0 ? winningTrades.reduce((sum, t) => sum + t.pnl, 0) / winningTrades.length : 0;
        const avgLoss = losingTrades.length > 0 ? Math.abs(losingTrades.reduce((sum, t) => sum + t.pnl, 0) / losingTrades.length) : 0;
        
        const rr = avgLoss > 0 ? avgWin / avgLoss : (avgWin > 0 ? Infinity : 0);
        
        return { winRate: wr, avgRR: rr };

    }, [trades, selectedAccountId]);

    useEffect(() => {
        if (dataSource === 'auto') {
            if (autoMetrics) {
                setWinRate(autoMetrics.winRate.toFixed(1));
                setAvgRR(isFinite(autoMetrics.avgRR) ? autoMetrics.avgRR.toFixed(2) : '999'); // Use a large number for Infinity
            } else {
                setWinRate('');
                setAvgRR('');
            }
        }
    }, [dataSource, autoMetrics]);

    const calculationResults = useMemo(() => {
        const wr = parseFloat(winRate) / 100;
        const rr = parseFloat(avgRR);
        const risk = parseFloat(riskPerTrade) / 100;
        const ruin = parseFloat(ruinLevel) / 100;

        if (isNaN(wr) || isNaN(rr) || isNaN(risk) || isNaN(ruin) || wr < 0 || wr > 1 || rr < 0 || risk <= 0 || ruin <= 0) {
            return null;
        }

        if (wr === 1) { // 100% win rate means 0% risk of ruin
            return { ror: 0, edge: rr };
        }
        if (wr === 0) { // 0% win rate means 100% risk of ruin
             return { ror: 100, edge: -1 };
        }

        const edge = (wr * rr) - (1 - wr);
        
        if (edge <= 0) {
            return { ror: 100, edge };
        }

        const capitalUnits = ruin / risk;
        const ror = Math.pow(((1 - edge) / (1 + edge)), capitalUnits) * 100;

        return { ror, edge };

    }, [winRate, avgRR, riskPerTrade, ruinLevel]);
    
    const inputStyles = "w-full bg-slate-100 dark:bg-slate-700/50 text-slate-900 dark:text-white p-3 rounded-lg border border-slate-300 dark:border-slate-700 focus:ring-2 focus:ring-accent-500 focus:border-accent-500 text-base transition-colors disabled:opacity-50";
    const labelStyles = "block text-sm font-medium text-slate-500 dark:text-slate-400 mb-2";

    return (
        <div className="max-w-4xl mx-auto space-y-6">
            <div className="text-center">
                 <h2 className="text-3xl font-bold text-slate-900 dark:text-white flex items-center justify-center gap-3">
                    <RiskOfRuinIcon className="w-8 h-8 text-accent-500" />
                    Risk of Ruin Calculator
                </h2>
                <p className="text-slate-500 dark:text-slate-400 mt-2">Estimate the probability of reaching a specific drawdown level based on your strategy's metrics.</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Input Section */}
                <div className="bg-white/80 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-xl shadow-lg p-6 space-y-4">
                     <h3 className="text-xl font-semibold text-slate-900 dark:text-white">Strategy Parameters</h3>
                     <div className="flex items-center gap-2 bg-slate-200 dark:bg-slate-800 p-1 rounded-lg">
                        <button onClick={() => setDataSource('auto')} className={`w-full px-3 py-1.5 text-sm font-medium rounded-md transition-all ${dataSource === 'auto' ? 'bg-white dark:bg-slate-700 shadow text-slate-900 dark:text-white' : 'text-slate-500 dark:text-slate-400'}`}>
                            Auto from Journal
                        </button>
                        <button onClick={() => setDataSource('manual')} className={`w-full px-3 py-1.5 text-sm font-medium rounded-md transition-all ${dataSource === 'manual' ? 'bg-white dark:bg-slate-700 shadow text-slate-900 dark:text-white' : 'text-slate-500 dark:text-slate-400'}`}>
                            Manual Input
                        </button>
                    </div>

                    {dataSource === 'auto' && (
                         <div>
                            <label htmlFor="account-select" className={labelStyles}>Data Source</label>
                            <select 
                                id="account-select"
                                value={selectedAccountId} 
                                onChange={e => setSelectedAccountId(e.target.value)}
                                className={inputStyles}
                            >
                                <option value="all">All Accounts</option>
                                {accounts.map(acc => <option key={acc.id} value={acc.id}>{acc.name}</option>)}
                            </select>
                        </div>
                    )}

                    {dataSource === 'auto' && !autoMetrics && (
                        <div className="bg-yellow-500/10 p-3 rounded-md text-center text-sm text-yellow-800 dark:text-yellow-200">
                            Not enough trade data for this selection (min. 5 trades required). Please log more trades or switch to Manual Input.
                        </div>
                    )}

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label htmlFor="win-rate" className={labelStyles}>Win Rate (%)</label>
                            <input id="win-rate" type="number" value={winRate} onChange={e => setWinRate(e.target.value)} className={inputStyles} disabled={dataSource === 'auto'} />
                        </div>
                         <div>
                            <label htmlFor="avg-rr" className={labelStyles}>Payoff Ratio (Avg W/L)</label>
                            <input id="avg-rr" type="number" step="0.1" value={avgRR} onChange={e => setAvgRR(e.target.value)} className={inputStyles} disabled={dataSource === 'auto'} />
                        </div>
                    </div>
                    
                    <div>
                        <label htmlFor="risk-per-trade" className={`${labelStyles} flex justify-between`}>
                            <span>Risk per Trade (%)</span>
                            <span className="font-semibold text-slate-700 dark:text-slate-300">{riskPerTrade}%</span>
                        </label>
                        <input id="risk-per-trade" type="range" min="0.1" max="10" step="0.1" value={riskPerTrade} onChange={e => setRiskPerTrade(e.target.value)} className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-accent-500" />
                    </div>

                     <div>
                        <label htmlFor="ruin-level" className={`${labelStyles} flex justify-between`}>
                            <span>Drawdown to Ruin (%)</span>
                            <span className="font-semibold text-slate-700 dark:text-slate-300">{ruinLevel}%</span>
                        </label>
                        <input id="ruin-level" type="range" min="1" max="100" step="1" value={ruinLevel} onChange={e => setRuinLevel(e.target.value)} className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-accent-500" />
                    </div>
                </div>

                {/* Results Section */}
                <div className="bg-white/80 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-xl shadow-lg p-6 flex flex-col items-center justify-center">
                    {calculationResults ? (
                        <div className="text-center space-y-6 w-full">
                            <RoRGauge value={calculationResults.ror} />
                             <div className="grid grid-cols-2 gap-4 w-full">
                                <InfoCard 
                                    title="Your Edge"
                                    value={`${(calculationResults.edge * 100).toFixed(2)}%`}
                                    subtext="Positive edge is required"
                                    isPrimary
                                />
                                <InfoCard 
                                    title="Capital Units"
                                    value={`${(parseFloat(ruinLevel)/parseFloat(riskPerTrade)).toFixed(1)}`}
                                    subtext="Losses until ruin"
                                />
                            </div>
                        </div>
                    ) : (
                        <div className="text-center text-slate-500 dark:text-slate-400 p-4">
                            <p>Enter valid parameters to calculate your Risk of Ruin.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default RiskOfRuinCalculator;