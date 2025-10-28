
import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useAppContext } from '../context';
import { Trade } from '../types';
import { getDashboardInsight } from '../services/geminiService';
import { 
    JournalIcon, ProfitFactorIcon, BalanceIcon,
    TrendingUpIcon, TrendingDownIcon, BellIcon, AIInsightsIcon, WinningStreakIcon, PerformanceBreakdownIcon, ArrowUpIcon, ArrowDownIcon
} from './Icons';

const MiniGauge: React.FC<{ value: number; gradientId: string }> = ({ value, gradientId }) => {
    const clampedValue = Math.min(isNaN(value) ? 0 : value, 100);

    // Dimensions
    const width = 48;
    const height = 26;
    const cx = width / 2;
    const cy = height - 4;
    const radius = 20;
    const strokeWidth = 5;

    const valueToAngle = (val: number) => -90 + (val / 100) * 180;
    const angle = valueToAngle(clampedValue);
    
    const arcPath = (r: number) => `M ${cx - r},${cy} A ${r},${r} 0 0 1 ${cx + r},${cy}`;

    return (
        <svg viewBox={`0 0 ${width} ${height}`} className="w-12 h-[26px] drop-shadow-sm" role="img" aria-label={`Gauge showing ${Math.round(clampedValue)}%`}>
            <defs>
                <linearGradient id="gauge-gradient-green" x1="0" y1="0" x2="1" y2="0"><stop stopColor="#16a34a"/><stop offset="1" stopColor="#4ade80"/></linearGradient>
                <linearGradient id="gauge-gradient-yellow" x1="0" y1="0" x2="1" y2="0"><stop stopColor="#d97706"/><stop offset="1" stopColor="#fbbf24"/></linearGradient>
                <linearGradient id="gauge-gradient-red" x1="0" y1="0" x2="1" y2="0"><stop stopColor="#dc2626"/><stop offset="1" stopColor="#f87171"/></linearGradient>
            </defs>

            <g>
                <path d={arcPath(radius)} fill="none" className="stroke-slate-200 dark:stroke-slate-700" strokeWidth={strokeWidth} strokeLinecap="round" />
                <path d={arcPath(radius)} fill="none" stroke={`url(#${gradientId})`} strokeWidth={strokeWidth} strokeLinecap="round" strokeDasharray={Math.PI * radius} strokeDashoffset={Math.PI * radius * (1 - clampedValue / 100)} className="transition-[stroke-dashoffset] duration-1000 ease-out" />
            </g>
            
            <g transform={`rotate(${angle}, ${cx}, ${cy})`} className="transition-transform duration-1000 ease-out">
                {/* Needle */}
                <path d={`M ${cx} ${cy - radius + 4} L ${cx + 3} ${cy} L ${cx - 3} ${cy} Z`} className="fill-slate-800 dark:fill-slate-200" />
            </g>
            {/* Pivot */}
            <circle cx={cx} cy={cy} r="5" className="fill-slate-300 dark:fill-slate-600 stroke-slate-400/50 dark:stroke-slate-900/50" strokeWidth="1" />
            <circle cx={cx} cy={cy} r="2" className="fill-slate-700 dark:fill-slate-300" />
        </svg>
    );
};

const CombinedStatCard: React.FC<{
  title1: string;
  value1: string | number;
  gauge1: React.ReactNode;
  title2: string;
  value2: string | number;
  gauge2: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
}> = ({ title1, value1, gauge1, title2, value2, gauge2, className, style }) => (
  <div className={`bg-white/80 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 p-4 rounded-xl shadow-lg shadow-slate-200/20 dark:shadow-black/20 transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl ${className}`} style={style}>
    <div className="grid grid-cols-2 divide-x divide-slate-200 dark:divide-slate-700 h-full items-center">
        <div className="px-4 flex flex-col items-center justify-center gap-2">
            {gauge1}
            <div className="text-center">
                <h3 className="text-sm font-medium text-slate-500 dark:text-slate-400">{title1}</h3>
                <p className="text-2xl font-bold mt-1 text-slate-900 dark:text-white">{value1}</p>
            </div>
        </div>
        <div className="px-4 flex flex-col items-center justify-center gap-2">
            {gauge2}
            <div className="text-center">
                <h3 className="text-sm font-medium text-slate-500 dark:text-slate-400">{title2}</h3>
                <p className="text-2xl font-bold mt-1 text-slate-900 dark:text-white">{value2}</p>
            </div>
        </div>
    </div>
  </div>
);


const AvgWinLossCard: React.FC<{ avgWin: number, avgLoss: number, className?: string; style?: React.CSSProperties }> = ({ avgWin, avgLoss, className, style }) => (
    <div className={`bg-white/80 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 p-4 rounded-xl shadow-lg shadow-slate-200/20 dark:shadow-black/20 transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl ${className}`} style={style}>
        <div className="grid grid-cols-2 divide-x divide-slate-200 dark:divide-slate-700 h-full items-center">
            <div className="px-4 text-center">
                <h3 className="text-sm font-medium text-slate-500 dark:text-slate-400">Average Win</h3>
                <p className="text-2xl font-bold mt-1 text-accent-500">
                    +${avgWin.toFixed(2)}
                </p>
            </div>
            <div className="px-4 text-center">
                <h3 className="text-sm font-medium text-slate-500 dark:text-slate-400">Average Loss</h3>
                <p className="text-2xl font-bold mt-1 text-red-500">
                    -${avgLoss.toFixed(2)}
                </p>
            </div>
        </div>
    </div>
);

const StatCardSkeleton: React.FC<{className?: string, style?: React.CSSProperties}> = ({ className, style }) => (
    <div className={`bg-white/80 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 p-4 rounded-xl shadow-lg shadow-slate-200/20 dark:shadow-black/20 space-y-3 ${className}`} style={style}>
        <div className="h-4 w-3/4 rounded shimmer-bg"></div>
        <div className="h-8 w-1/2 rounded shimmer-bg"></div>
    </div>
);

const EquityChartSkeleton: React.FC<{className?: string, style?: React.CSSProperties}> = ({ className, style }) => (
    <div className={`bg-white/80 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 p-4 sm:p-6 rounded-xl shadow-lg shadow-slate-200/20 dark:shadow-black/20 h-[20rem] ${className}`} style={style}>
        <div className="h-6 w-1/4 rounded shimmer-bg mb-4"></div>
        <div className="h-full w-full rounded shimmer-bg"></div>
    </div>
);

const ActivityFeedSkeleton: React.FC<{className?: string, style?: React.CSSProperties}> = ({ className, style }) => (
    <div className={`bg-white/80 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 p-5 rounded-xl shadow-lg shadow-slate-200/20 dark:shadow-black/20 ${className}`} style={style}>
        <div className="h-5 w-1/3 rounded shimmer-bg mb-3"></div>
        <div className="space-y-2 overflow-y-auto h-56">
            {[...Array(5)].map((_, i) => (
                <div key={i} className="flex items-center gap-3 p-2">
                    <div className="flex-shrink-0 w-8 h-8 rounded-lg shimmer-bg"></div>
                    <div className="flex-grow space-y-2">
                        <div className="h-4 w-full rounded shimmer-bg"></div>
                        <div className="h-3 w-1/2 rounded shimmer-bg"></div>
                    </div>
                    <div className="h-5 w-12 rounded shimmer-bg"></div>
                </div>
            ))}
        </div>
    </div>
);


const Dashboard: React.FC = () => {
    const { user, trades, accounts, theme, setSelectedTrade, dataLoading } = useAppContext();
    const [aiInsight, setAiInsight] = useState<string | null>(null);
    const [isLoadingInsight, setIsLoadingInsight] = useState(true);

    const actualTrades = useMemo(() => trades.filter(t => t.trade_taken), [trades]);

    useEffect(() => {
        const fetchInsight = async () => {
            if (actualTrades.length === 0 || dataLoading) {
                 if (!dataLoading) setAiInsight("Log your first trade to see AI-powered insights here!");
                 setIsLoadingInsight(false);
                 return;
            };
            setIsLoadingInsight(true);
            try {
                const insight = await getDashboardInsight(actualTrades);
                setAiInsight(insight);
            } catch (error) {
                console.error("Failed to fetch dashboard insight", error);
                setAiInsight("Could not load AI insight at this time.");
            }
            setIsLoadingInsight(false);
        };
        fetchInsight();
    }, [actualTrades, dataLoading]);

    const overallStats = useMemo(() => {
        const totalTrades = actualTrades.length;
        if (totalTrades === 0) return { netPnl: 0, winRate: 0, profitFactor: 0, avgWin: 0, avgLoss: 0 };
        
        const winningTrades = actualTrades.filter(t => t.pnl > 0);
        const losingTrades = actualTrades.filter(t => t.pnl <= 0);
        const netPnl = actualTrades.reduce((sum, t) => sum + t.pnl, 0);
        const winRate = (winningTrades.length / totalTrades) * 100;
        
        const totalGains = winningTrades.reduce((sum, t) => sum + t.pnl, 0);
        const totalLosses = Math.abs(losingTrades.reduce((sum, t) => sum + t.pnl, 0));

        const avgWin = winningTrades.length > 0 ? totalGains / winningTrades.length : 0;
        const avgLoss = losingTrades.length > 0 ? totalLosses / losingTrades.length : 0;
        
        const profitFactor = totalLosses > 0 ? totalGains / totalLosses : Infinity;
        
        return { netPnl, winRate, profitFactor, avgWin, avgLoss };
    }, [actualTrades]);

    const portfolioGrowth = useMemo(() => {
        const netPnl = overallStats.netPnl;
        const totalInitial = accounts.reduce((sum, acc) => sum + acc.initial_balance, 0);
        const percentageChange = totalInitial > 0 ? (netPnl / totalInitial) * 100 : 0;
        return { netPnl, percentageChange };
    }, [accounts, overallStats.netPnl]);

    const performanceByInstrument = useMemo(() => {
        const byInstrument: {[key: string]: number} = {};
        actualTrades.forEach(t => {
            if (!byInstrument[t.instrument]) byInstrument[t.instrument] = 0;
            byInstrument[t.instrument] += t.pnl;
        });
        const sorted = Object.entries(byInstrument).sort((a, b) => b[1] - a[1]);
        return {
            best: sorted[0] ? { name: sorted[0][0], pnl: sorted[0][1] } : null,
            worst: sorted[sorted.length-1] && sorted[sorted.length-1][1] < 0 ? { name: sorted[sorted.length-1][0], pnl: sorted[sorted.length-1][1] } : null
        };
    }, [actualTrades]);
    
    const chartData = useMemo(() => {
        const sortedTrades = [...actualTrades].sort((a,b) => new Date(a.exit_timestamp).getTime() - new Date(b.exit_timestamp).getTime());
        let cumulativePnl = 0;
        return sortedTrades.map(trade => {
            cumulativePnl += trade.pnl;
            return {
                date: new Date(trade.exit_timestamp).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
                cumulativePnl,
                tradeId: trade.id,
            };
        });
    }, [actualTrades]);

    const handleChartClick = useCallback((chartData: any) => {
        if (chartData && chartData.activePayload && chartData.activePayload.length > 0) {
            const payload = chartData.activePayload[0].payload;
            const tradeId = payload.tradeId;
            if (tradeId) {
                const tradeToSelect = actualTrades.find(t => t.id === tradeId);
                if (tradeToSelect) {
                    setSelectedTrade(tradeToSelect);
                }
            }
        }
    }, [actualTrades, setSelectedTrade]);

    const gradientOffset = useMemo(() => {
        if (!chartData || chartData.length === 0) return 0.5;

        const dataMax = Math.max(...chartData.map((d) => d.cumulativePnl));
        const dataMin = Math.min(...chartData.map((d) => d.cumulativePnl));

        if (dataMin >= 0 || dataMax <= 0) {
            return 0.5; 
        }
        
        return dataMax / (dataMax - dataMin);
    }, [chartData]);

    const { fillUrl, strokeColor } = useMemo(() => {
        if (!chartData || chartData.length === 0) {
            return { fillUrl: 'url(#gradientPositiveDashboard)', strokeColor: '#22c55e' };
        }

        const dataMax = Math.max(...chartData.map((d) => d.cumulativePnl));
        const dataMin = Math.min(...chartData.map((d) => d.cumulativePnl));
        const finalPnl = chartData.length > 0 ? chartData[chartData.length - 1].cumulativePnl : 0;
        
        if (dataMin >= 0) {
            return { fillUrl: 'url(#gradientPositiveDashboard)', strokeColor: '#22c55e' };
        }
        if (dataMax <= 0) {
            return { fillUrl: 'url(#gradientNegativeDashboard)', strokeColor: '#ef4444' };
        }
        
        return { fillUrl: 'url(#splitGradientDashboard)', strokeColor: finalPnl >= 0 ? '#22c55e' : '#ef4444' };

    }, [chartData]);

    const getWinRateGradient = (wr: number) => {
        if (wr >= 55) return 'gauge-gradient-green';
        if (wr >= 40) return 'gauge-gradient-yellow';
        return 'gauge-gradient-red';
    };

    const getProfitFactorGradient = (pf: number) => {
        if (!isFinite(pf) || pf >= 1.5) return 'gauge-gradient-green';
        if (pf >= 1.0) return 'gauge-gradient-yellow';
        return 'gauge-gradient-red';
    };

    const normalizedProfitFactor = isFinite(overallStats.profitFactor)
        ? Math.min(overallStats.profitFactor / 3, 1) * 100
        : 100;

    const pnlColorClass = portfolioGrowth.netPnl >= 0 ? 'text-accent-500' : 'text-red-500';
    const changeColorClass = portfolioGrowth.percentageChange >= 0 ? 'bg-green-500/10 text-green-500' : 'bg-red-500/10 text-red-500';

    if (dataLoading) {
        return (
            <div className="space-y-6">
                <div className="animate-fade-in-up">
                    <div className="h-9 w-1/2 rounded shimmer-bg"></div>
                    <div className="h-5 w-3/4 rounded shimmer-bg mt-2"></div>
                </div>
    
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="lg:col-span-2 space-y-6">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                            <StatCardSkeleton className="sm:col-span-2" />
                            <StatCardSkeleton />
                            <StatCardSkeleton />
                        </div>
                        <EquityChartSkeleton />
                    </div>
    
                    <div className="space-y-6">
                        <StatCardSkeleton style={{ height: '7rem' }} />
                        <StatCardSkeleton style={{ flexGrow: 1 }} />
                    </div>
                </div>
    
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    <StatCardSkeleton />
                    <StatCardSkeleton />
                    <ActivityFeedSkeleton />
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="animate-fade-in-up">
                <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Welcome back, {user?.name}!</h1>
                <p className="text-slate-500 dark:text-slate-400 mt-1">Here's your trading performance at a glance. Today is {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}.</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 space-y-6">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                        <div className="bg-white/80 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 p-4 rounded-xl shadow-lg shadow-slate-200/20 dark:shadow-black/20 transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl animate-fade-in-up sm:col-span-2" style={{ animationDelay: '100ms' }}>
                            <div className="flex justify-between items-start">
                                <div>
                                    <h3 className="text-sm font-medium text-slate-500 dark:text-slate-400">Total Net P/L</h3>
                                    <div className="flex items-baseline gap-3 mt-1">
                                        <p className={`text-4xl font-bold ${pnlColorClass}`}>
                                            {portfolioGrowth.netPnl >= 0 ? '+' : '-'}${Math.abs(portfolioGrowth.netPnl).toFixed(2)}
                                        </p>
                                        {portfolioGrowth.percentageChange !== 0 && (
                                            <div className={`flex items-center gap-1 text-sm font-semibold px-2 py-1 rounded-full ${changeColorClass}`}>
                                                {portfolioGrowth.percentageChange > 0 ? <ArrowUpIcon className="w-4 h-4" /> : <ArrowDownIcon className="w-4 h-4" />}
                                                <span>{Math.abs(portfolioGrowth.percentageChange).toFixed(2)}%</span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                        <CombinedStatCard
                            title1="Win Rate"
                            value1={`${overallStats.winRate.toFixed(1)}%`}
                            gauge1={<MiniGauge value={overallStats.winRate} gradientId={getWinRateGradient(overallStats.winRate)} />}
                            title2="Profit Factor"
                            value2={isFinite(overallStats.profitFactor) ? overallStats.profitFactor.toFixed(2) : '∞'}
                            gauge2={<MiniGauge value={normalizedProfitFactor} gradientId={getProfitFactorGradient(overallStats.profitFactor)} />}
                            className="animate-fade-in-up"
                            style={{ animationDelay: '200ms' }}
                        />
                        <AvgWinLossCard 
                            avgWin={overallStats.avgWin} 
                            avgLoss={overallStats.avgLoss}
                            className="animate-fade-in-up"
                            style={{ animationDelay: '300ms' }}
                        />
                    </div>
                    <div className="bg-white/80 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 p-4 sm:p-6 rounded-xl shadow-lg shadow-slate-200/20 dark:shadow-black/20 h-[20rem] animate-fade-in-up" style={{ animationDelay: '500ms' }}>
                        <h3 className="text-lg font-semibold mb-4 text-slate-900 dark:text-white">Equity Curve</h3>
                        <ResponsiveContainer width="100%" height="90%">
                            <AreaChart 
                                data={chartData} 
                                margin={{ top: 5, right: 20, left: -15, bottom: 0 }}
                                onClick={handleChartClick}
                                style={{ cursor: 'pointer' }}
                            >
                                <defs>
                                    <linearGradient id="gradientPositiveDashboard" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#22c55e" stopOpacity={0.4}/>
                                        <stop offset="95%" stopColor="#22c55e" stopOpacity={0}/>
                                    </linearGradient>
                                    <linearGradient id="gradientNegativeDashboard" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#ef4444" stopOpacity={0.4}/>
                                        <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
                                    </linearGradient>
                                     <linearGradient id="splitGradientDashboard" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset={0} stopColor="#22c55e" stopOpacity={0.4}/>
                                        <stop offset={gradientOffset} stopColor="#22c55e" stopOpacity={0.0}/>
                                        <stop offset={gradientOffset} stopColor="#ef4444" stopOpacity={0.0}/>
                                        <stop offset={1} stopColor="#ef4444" stopOpacity={0.4}/>
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" stroke={theme === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)'} />
                                <XAxis dataKey="date" stroke={theme === 'dark' ? '#94a3b8' : '#64748b'} tick={{fontSize: 12}} />
                                <YAxis stroke={theme === 'dark' ? '#94a3b8' : '#64748b'} tick={{fontSize: 12}} domain={['auto', 'auto']} />
                                <Tooltip 
                                    contentStyle={theme === 'dark' ? { backgroundColor: 'rgba(15, 23, 42, 0.9)', border: '1px solid rgba(255,255,255,0.2)' } : {}}
                                    formatter={(value: number, name: string, props: any) => {
                                        if (!props.payload) return [`$${value.toFixed(2)}`, 'Equity'];
                                        const trade = actualTrades.find(t => t.id === props.payload.tradeId);
                                        const pnl = trade ? trade.pnl : 0;
                                        const formattedValue = `$${(value as number).toFixed(2)}`;
                                        const formattedPnl = `${pnl >= 0 ? '+' : ''}$${pnl.toFixed(2)}`;
                                        return [formattedValue, `Equity (${formattedPnl})`];
                                    }}
                                />
                                <Area type="monotone" dataKey="cumulativePnl" name="CPnL" stroke={strokeColor} strokeWidth={2} fillOpacity={1} fill={fillUrl} />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                <div className="space-y-6">
                    <div className="bg-white/80 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 p-5 rounded-xl shadow-lg shadow-slate-200/20 dark:shadow-black/20 animate-fade-in-up" style={{ animationDelay: '600ms' }}>
                        <h3 className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-2 flex items-center gap-2"><AIInsightsIcon/> AI Quick Insight</h3>
                        {isLoadingInsight ? (
                            <div className="space-y-2">
                                <div className="h-4 w-full rounded shimmer-bg"></div>
                                <div className="h-4 w-3/4 rounded shimmer-bg"></div>
                            </div>
                        ) : (
                            <p className="text-slate-700 dark:text-slate-300 italic">"{aiInsight}"</p>
                        )}
                    </div>
                     <div className="bg-white/80 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 p-5 rounded-xl shadow-lg shadow-slate-200/20 dark:shadow-black/20 animate-fade-in-up" style={{ animationDelay: '700ms' }}>
                        <h3 className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-3">Account Balances</h3>
                        <div className="space-y-2">
                            {accounts.map(acc => (
                                <div key={acc.id} className="flex justify-between items-center text-sm">
                                    <span className="font-semibold text-slate-700 dark:text-slate-200">{acc.name}</span>
                                    <span className="font-mono text-slate-500 dark:text-slate-400">${acc.balance.toLocaleString()}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <div className="bg-white/80 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 p-5 rounded-xl shadow-lg shadow-slate-200/20 dark:shadow-black/20 animate-fade-in-up" style={{ animationDelay: '900ms' }}>
                    <h3 className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-2 flex items-center gap-2"><TrendingUpIcon/> Top Performer</h3>
                    {performanceByInstrument.best ? (
                        <div>
                            <p className="text-xl font-bold text-slate-900 dark:text-white">{performanceByInstrument.best.name}</p>
                            <p className="font-semibold text-accent-500">+${performanceByInstrument.best.pnl.toFixed(2)}</p>
                        </div>
                    ) : <p className="text-sm text-slate-500 dark:text-slate-400">Not enough data.</p>}
                </div>
                 <div className="bg-white/80 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 p-5 rounded-xl shadow-lg shadow-slate-200/20 dark:shadow-black/20 animate-fade-in-up" style={{ animationDelay: '1000ms' }}>
                    <h3 className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-2 flex items-center gap-2"><TrendingDownIcon/> Biggest Loser</h3>
                     {performanceByInstrument.worst ? (
                        <div>
                            <p className="text-xl font-bold text-slate-900 dark:text-white">{performanceByInstrument.worst.name}</p>
                            <p className="font-semibold text-red-500">${performanceByInstrument.worst.pnl.toFixed(2)}</p>
                        </div>
                    ) : <p className="text-sm text-slate-500 dark:text-slate-400">No losing instruments yet!</p>}
                </div>
                 <div className="bg-white/80 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 p-5 rounded-xl shadow-lg shadow-slate-200/20 dark:shadow-black/20 animate-fade-in-up" style={{ animationDelay: '1100ms' }}>
                    <h3 className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-3 flex items-center gap-2"><JournalIcon /> Recent Activity</h3>
                    <div className="space-y-2 overflow-y-auto h-56">
                        {trades.slice(0, 5).map(trade => (
                            <div key={trade.id} onClick={() => setSelectedTrade(trade)} className="flex items-center gap-3 p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-md cursor-pointer">
                                <div className={`flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center ${trade.trade_taken ? (trade.pnl >= 0 ? 'bg-accent-500/20 text-accent-500' : 'bg-red-500/20 text-red-500') : 'bg-blue-500/20 text-blue-500'}`}>
                                    {trade.trade_taken ? (trade.pnl >= 0 ? <ArrowUpIcon className="w-4 h-4" /> : <ArrowDownIcon className="w-4 h-4" />) : <JournalIcon className="w-4 h-4" />}
                                </div>
                                <div className="flex-grow">
                                    <p className="font-semibold text-sm text-slate-800 dark:text-slate-200">{trade.instrument}</p>
                                    <p className="text-xs text-slate-500 dark:text-slate-400">{trade.exit_timestamp.toLocaleDateString()}</p>
                                </div>
                                {trade.trade_taken && (
                                    <p className={`font-semibold text-sm text-right ${trade.pnl >= 0 ? 'text-accent-500' : 'text-red-500'}`}>
                                        {trade.pnl >= 0 ? '+' : ''}${trade.pnl.toFixed(0)}
                                    </p>
                                )}
                            </div>
                        ))}
                    </div>
                 </div>
            </div>
        </div>
    );
};

export default Dashboard;
