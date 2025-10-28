import React, { useState, useMemo, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Cell } from 'recharts';
import { useAppContext } from '../context';
import { Trade } from '../types';
import { 
    DashboardIcon, ProfitFactorIcon, ExpectancyIcon, PerformanceBreakdownIcon, BalanceIcon,
    ChevronLeftIcon, ChevronRightIcon, XMarkIcon, ArrowUpIcon, ArrowDownIcon
} from './Icons';

const StatCard: React.FC<{ title: string; value: string | number; icon: React.ReactNode; valueClassName?: string; }> = ({ title, value, icon, valueClassName }) => {
    return (
        <div className="bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-white/10 p-4 rounded-xl shadow-lg flex flex-col justify-between">
            <div className="flex justify-between items-center">
                <h3 className="text-sm font-medium text-slate-500 dark:text-slate-400">{title}</h3>
                <div className="text-slate-400 dark:text-slate-500">{icon}</div>
            </div>
            <p className={`text-2xl font-bold mt-2 ${valueClassName || 'text-slate-900 dark:text-white'}`}>{value}</p>
        </div>
    );
};

const TradiaScoreStatCard: React.FC<{ winRate: number; profitFactor: number; avgRR: number }> = ({ winRate, profitFactor, avgRR }) => {
    const normalize = (value: number, good: number, excellent: number): number => {
        if (!isFinite(value)) return 100;
        const mid = 50;
        if (value < good) return Math.max(0, (value / good) * mid);
        const normalizedTop = Math.min(1, Math.max(0, (value - good) / (excellent - good)));
        return mid + normalizedTop * mid;
    };

    const wrScore = normalize(winRate, 50, 70);
    const pfScore = normalize(profitFactor, 1.5, 3.0);
    const rrScore = normalize(avgRR, 1.5, 3.0);

    const proScore = Math.round(wrScore * 0.4 + pfScore * 0.3 + rrScore * 0.3);

    const getRank = (score: number) => {
        if (score >= 90) return { name: 'Elite', color: 'text-cyan-400' };
        if (score >= 80) return { name: 'Pro', color: 'text-green-400' };
        if (score >= 70) return { name: 'Consistent', color: 'text-blue-400' };
        if (score >= 60) return { name: 'Developing', color: 'text-yellow-400' };
        return { name: 'Novice', color: 'text-orange-400' };
    };
    const rank = getRank(proScore);
    
    const svgSize = 70;
    const center = { x: svgSize / 2, y: svgSize / 2 };
    const radius = svgSize / 2 - 10;

    const v1_outer = { x: center.x, y: center.y - radius };
    const v2_outer = { x: center.x - radius * Math.cos(Math.PI / 6), y: center.y + radius * Math.sin(Math.PI / 6) };
    const v3_outer = { x: center.x + radius * Math.cos(Math.PI / 6), y: center.y + radius * Math.sin(Math.PI / 6) };
    
    const interpolate = (p_outer: {x:number, y:number}, score: number) => {
        const scoreRatio = score / 100;
        return {
            x: center.x + (p_outer.x - center.x) * scoreRatio,
            y: center.y + (p_outer.y - center.y) * scoreRatio
        };
    };

    const v1_inner = interpolate(v1_outer, wrScore);
    const v2_inner = interpolate(v2_outer, pfScore);
    const v3_inner = interpolate(v3_outer, rrScore);

    const outerPoints = `${v1_outer.x},${v1_outer.y} ${v2_outer.x},${v2_outer.y} ${v3_outer.x},${v3_outer.y}`;
    const innerPoints = `${v1_inner.x},${v1_inner.y} ${v2_inner.x},${v2_inner.y} ${v3_inner.x},${v3_inner.y}`;

    return (
        <div className="bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-white/10 p-4 rounded-xl shadow-lg flex flex-col justify-between">
            <div className="flex justify-between items-start">
                <h3 className="text-sm font-medium text-slate-500 dark:text-slate-400">Tradia Score</h3>
                <p className={`font-semibold ${rank.color} text-xs`}>{rank.name}</p>
            </div>
            <div className="flex items-end justify-between mt-1">
                <div className="w-16 h-16 -ml-1.5 -mb-1.5">
                    <svg viewBox={`0 0 ${svgSize} ${svgSize}`} className="w-full h-full">
                        <polygon points={outerPoints} className="fill-transparent stroke-slate-200 dark:stroke-slate-700" strokeWidth="1" />
                        <text x={v1_outer.x} y={v1_outer.y - 3} textAnchor="middle" className="text-[7px] font-medium fill-slate-400 dark:fill-slate-500">WR</text>
                        <text x={v2_outer.x - 3} y={v2_outer.y + 3} textAnchor="end" className="text-[7px] font-medium fill-slate-400 dark:fill-slate-500">PF</text>
                        <text x={v3_outer.x + 3} y={v3_outer.y + 3} textAnchor="start" className="text-[7px] font-medium fill-slate-400 dark:fill-slate-500">RR</text>
                        <polygon points={innerPoints} className="fill-accent-500/20 stroke-accent-400" strokeWidth="1.5" strokeLinejoin="round" style={{ transition: 'points 0.5s ease-in-out' }} />
                    </svg>
                </div>
                <p className="text-3xl font-bold text-slate-900 dark:text-white">{proScore}</p>
            </div>
        </div>
    );
};

const DayTradesModal: React.FC<{
    date: Date;
    trades: Trade[];
    onClose: () => void;
}> = ({ date, trades, onClose }) => {
    const { setSelectedTrade } = useAppContext();
    const [portalContainer, setPortalContainer] = useState<Element | null>(null);

    useEffect(() => {
        setPortalContainer(document.getElementById('modal-portal'));
    }, []);

    const handleTradeClick = (trade: Trade) => {
        onClose();
        setSelectedTrade(trade);
    };
    
    const modalContent = (
         <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in" onClick={onClose}>
            <div className="bg-white dark:bg-slate-800 rounded-lg shadow-xl w-full max-w-md max-h-[80vh] flex flex-col animate-fade-in-up" onClick={e => e.stopPropagation()}>
                <div className="flex-shrink-0 flex items-center justify-between p-4 border-b border-slate-200 dark:border-slate-700">
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                        Trades for {date.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
                    </h3>
                    <button onClick={onClose} className="p-1 rounded-full text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-700"><XMarkIcon /></button>
                </div>
                <div className="flex-grow p-4 overflow-y-auto space-y-2">
                    {trades.length > 0 ? trades.map(trade => (
                        <button 
                            key={trade.id} 
                            onClick={() => handleTradeClick(trade)}
                            className="w-full flex items-center justify-between p-3 rounded-md hover:bg-slate-100 dark:hover:bg-slate-700/50 text-left transition-colors"
                        >
                            <div className="flex items-center gap-3">
                                <div className={`flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center ${trade.pnl >= 0 ? 'bg-accent-500/20 text-accent-500' : 'bg-red-500/20 text-red-500'}`}>
                                    {trade.pnl >= 0 ? <ArrowUpIcon className="w-4 h-4" /> : <ArrowDownIcon className="w-4 h-4" />}
                                </div>
                                <div>
                                    <p className="font-semibold text-sm text-slate-800 dark:text-slate-200">{trade.instrument}</p>
                                    <p className="text-xs text-slate-500 dark:text-slate-400">{new Date(trade.exit_timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                                </div>
                            </div>
                            <p className={`font-semibold text-sm text-right ${trade.pnl >= 0 ? 'text-accent-500' : 'text-red-500'}`}>
                                {trade.pnl >= 0 ? '+' : ''}${trade.pnl.toFixed(2)}
                            </p>
                        </button>
                    )) : (
                        <p className="text-center text-slate-500 dark:text-slate-400 py-8">No trades for this day.</p>
                    )}
                </div>
            </div>
        </div>
    );
    
    if (!portalContainer) return null;
    
    return createPortal(modalContent, portalContainer);
};

const PerformanceCalendar: React.FC<{ data: { [key: string]: { pnl: number } }, onDayClick: (date: Date) => void }> = ({ data, onDayClick }) => {
    const [currentDate, setCurrentDate] = useState(new Date());

    const changeMonth = (amount: number) => {
        setCurrentDate(prev => {
            const newDate = new Date(prev);
            newDate.setMonth(newDate.getMonth() + amount);
            return newDate;
        });
    };

    const calendarGrid = useMemo(() => {
        const year = currentDate.getFullYear();
        const month = currentDate.getMonth();
        const firstDayOfMonth = new Date(year, month, 1);
        const lastDayOfMonth = new Date(year, month + 1, 0);
        
        const startDate = new Date(firstDayOfMonth);
        startDate.setDate(startDate.getDate() - startDate.getDay());

        const endDate = new Date(lastDayOfMonth);
        endDate.setDate(endDate.getDate() + (6 - endDate.getDay()));
        
        const days = [];
        let day = new Date(startDate);

        while (day <= endDate) {
            days.push(new Date(day));
            day.setDate(day.getDate() + 1);
        }
        return days;
    }, [currentDate]);

    const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

    return (
        <div className="bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-white/10 p-4 rounded-xl shadow-lg h-full flex flex-col">
            <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Daily Performance</h3>
                 <div className="flex items-center gap-1">
                    <button onClick={() => changeMonth(-1)} className="p-1 rounded-full hover:bg-slate-200 dark:hover:bg-slate-700"><ChevronLeftIcon/></button>
                    <span className="text-sm font-medium w-28 text-center">{currentDate.toLocaleString('default', { month: 'long', year: 'numeric' })}</span>
                    <button onClick={() => changeMonth(1)} className="p-1 rounded-full hover:bg-slate-200 dark:hover:bg-slate-700"><ChevronRightIcon/></button>
                </div>
            </div>
            
            <div className="flex-grow grid grid-cols-7 border-t border-l border-slate-200 dark:border-slate-700">
                {weekDays.map(day => (
                    <div key={day} className="text-center text-xs font-medium text-slate-500 dark:text-slate-400 py-2 border-b border-r border-slate-200 dark:border-slate-700">
                        {day}
                    </div>
                ))}
                {calendarGrid.map(day => {
                    const dateString = day.toISOString().split('T')[0];
                    const dayData = data[dateString];
                    const isCurrentMonth = day.getMonth() === currentDate.getMonth();
                    
                    let cellClasses = 'relative p-1 border-b border-r border-slate-200 dark:border-slate-700 flex flex-col justify-between h-16 transition-colors';
                    let dateTextClasses = 'text-xs';

                    if (!isCurrentMonth) {
                        cellClasses += ' bg-slate-50 dark:bg-slate-800/20';
                        dateTextClasses += ' text-slate-400 dark:text-slate-600';
                    } else {
                        if (!dayData) {
                            cellClasses += ' hover:bg-slate-100 dark:hover:bg-slate-800';
                        }
                        dateTextClasses += ' text-slate-700 dark:text-slate-300';
                    }

                    if (dayData) {
                        cellClasses += ' cursor-pointer';
                        if (dayData.pnl > 0) cellClasses += ' bg-green-100 dark:bg-green-500/30 hover:bg-green-200 dark:hover:bg-green-500/50';
                        else if (dayData.pnl < 0) cellClasses += ' bg-red-100 dark:bg-red-500/30 hover:bg-red-200 dark:hover:bg-red-500/50';
                        else cellClasses += ' bg-slate-100 dark:bg-slate-500/30 hover:bg-slate-200 dark:hover:bg-slate-500/50';
                    }

                    return (
                        <div key={dateString} className={cellClasses} onClick={() => dayData && onDayClick(day)}>
                            <span className={dateTextClasses}>{day.getDate()}</span>
                            {dayData && (
                                <p className={`text-right text-[10px] font-bold ${dayData.pnl > 0 ? 'text-green-700 dark:text-green-300' : dayData.pnl < 0 ? 'text-red-700 dark:text-red-300' : 'text-slate-700 dark:text-slate-300'}`}>
                                    ${Math.abs(dayData.pnl).toFixed(0)}
                                </p>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

const DataAnalysisCard: React.FC<{ metrics: any }> = ({ metrics }) => {
    const metricItems = [
        { label: "Total Trades", value: metrics.totalTrades },
        { label: "Net P/L", value: `$${metrics.netPnl.toFixed(2)}`, className: metrics.netPnl >= 0 ? 'text-accent-400' : 'text-red-500' },
        { label: "Avg P/L per Trade", value: `$${metrics.avgPnlPerTrade.toFixed(2)}` },
        { label: "Average Win", value: `$${metrics.avgWin.toFixed(2)}` },
        { label: "Average Loss", value: `$${metrics.avgLoss.toFixed(2)}` },
        { label: "Profit Factor", value: isFinite(metrics.profitFactor) ? metrics.profitFactor.toFixed(2) : '∞' },
        { label: "Win Rate", value: `${metrics.winRate.toFixed(1)}%` },
        { label: "Avg Hold Time", value: metrics.avgHoldTime },
        { label: "Max Drawdown", value: `$${metrics.maxDrawdown.toFixed(2)}` },
        { label: "Sharpe Ratio", value: isFinite(metrics.sharpeRatio) ? metrics.sharpeRatio.toFixed(2) : 'N/A' },
        { label: "Std. Deviation (P/L)", value: `$${metrics.stdDeviation.toFixed(2)}` },
    ];

    return (
        <div className="bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-white/10 p-6 rounded-xl shadow-lg">
            <h3 className="text-lg font-semibold mb-4 text-slate-900 dark:text-white">Data Analysis</h3>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {metricItems.map(item => (
                    <div key={item.label} className="p-3 bg-slate-100 dark:bg-slate-800/50 rounded-lg">
                        <p className="text-sm text-slate-500 dark:text-slate-400">{item.label}</p>
                        <p className={`text-lg font-bold text-slate-900 dark:text-white ${item.className || ''}`}>{item.value}</p>
                    </div>
                ))}
            </div>
        </div>
    );
};


const AnalyticsOverview: React.FC = () => {
    const { trades, accounts, theme } = useAppContext();
    const [selectedAccountId, setSelectedAccountId] = useState('all');
    const [selectedDateForModal, setSelectedDateForModal] = useState<Date | null>(null);

    const filteredTrades = useMemo(() => {
        const actualTrades = trades.filter(t => t.trade_taken);
        if (selectedAccountId === 'all') return actualTrades;
        return actualTrades.filter(t => t.account_id === selectedAccountId);
    }, [trades, selectedAccountId]);

    const tradesForSelectedDate = useMemo(() => {
        if (!selectedDateForModal) return [];
        
        const dateString = selectedDateForModal.toISOString().split('T')[0];
        
        return filteredTrades.filter(trade => {
            const tradeDateString = new Date(trade.exit_timestamp).toISOString().split('T')[0];
            return tradeDateString === dateString;
        }).sort((a,b) => new Date(b.exit_timestamp).getTime() - new Date(a.exit_timestamp).getTime());

    }, [selectedDateForModal, filteredTrades]);

    const handleDayClick = (date: Date) => {
        setSelectedDateForModal(date);
    };

    const dailyData = useMemo(() => {
        const data: { [key: string]: { pnl: number, trades: number } } = {};
        [...filteredTrades].forEach(trade => {
            const dateStr = trade.exit_timestamp.toISOString().split('T')[0];
            if (!data[dateStr]) {
                data[dateStr] = { pnl: 0, trades: 0 };
            }
            data[dateStr].pnl += trade.pnl;
            data[dateStr].trades++;
        });
        return data;
    }, [filteredTrades]);

    const chartData = useMemo(() => {
        const sortedDates = Object.keys(dailyData).sort((a,b) => new Date(a).getTime() - new Date(b).getTime());
        let cumulativePnl = 0;
        return sortedDates.map(date => {
            cumulativePnl += dailyData[date].pnl;
            return {
                date: new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
                pnl: dailyData[date].pnl,
                cumulativePnl,
            };
        });
    }, [dailyData]);
    
    const gradientOffset = useMemo(() => {
        if (!chartData || chartData.length === 0) return 0.5;

        const dataMax = Math.max(...chartData.map((d) => d.cumulativePnl));
        const dataMin = Math.min(...chartData.map((d) => d.cumulativePnl));
        
        if (dataMin >= 0 || dataMax <= 0) return 0.5; 
        
        return dataMax / (dataMax - dataMin);
    }, [chartData]);

    const { fillUrl, strokeColor } = useMemo(() => {
        if (!chartData || chartData.length === 0) {
            return { fillUrl: 'url(#gradientPositiveAnalytics)', strokeColor: '#22c55e' };
        }

        const dataMax = Math.max(...chartData.map((d) => d.cumulativePnl));
        const dataMin = Math.min(...chartData.map((d) => d.cumulativePnl));
        const finalPnl = chartData.length > 0 ? chartData[chartData.length - 1].cumulativePnl : 0;
        
        if (dataMin >= 0) {
            return { fillUrl: 'url(#gradientPositiveAnalytics)', strokeColor: '#22c55e' };
        }
        if (dataMax <= 0) {
            return { fillUrl: 'url(#gradientNegativeAnalytics)', strokeColor: '#ef4444' };
        }
        
        return { fillUrl: 'url(#splitGradientAnalytics)', strokeColor: finalPnl >= 0 ? '#22c55e' : '#ef4444' };

    }, [chartData]);

    const performanceMetrics = useMemo(() => {
        const totalTrades = filteredTrades.length;
        if (totalTrades === 0) {
            return { 
                totalTrades: 0,
                netPnl: 0, 
                avgPnlPerTrade: 0,
                avgWin: 0,
                avgLoss: 0,
                winRate: 0, 
                profitFactor: 0, 
                expectancy: 0, 
                avgRR: 0,
                avgHoldTime: 'N/A',
                maxDrawdown: 0,
                sharpeRatio: 0,
                stdDeviation: 0,
            };
        }
        
        const winningTrades = filteredTrades.filter(t => t.pnl > 0);
        const losingTrades = filteredTrades.filter(t => t.pnl <= 0);
        const netPnl = filteredTrades.reduce((sum, t) => sum + t.pnl, 0);
        const avgPnlPerTrade = netPnl / totalTrades;
        const winRate = (winningTrades.length / totalTrades) * 100;
        const lossRate = 100 - winRate;
        
        const totalGains = winningTrades.reduce((sum, t) => sum + t.pnl, 0);
        const totalLosses = Math.abs(losingTrades.reduce((sum, t) => sum + t.pnl, 0));
        
        const avgWin = winningTrades.length > 0 ? totalGains / winningTrades.length : 0;
        const avgLoss = losingTrades.length > 0 ? totalLosses / losingTrades.length : 0;
        
        const profitFactor = totalLosses > 0 ? totalGains / totalLosses : Infinity;
        const avgRR = avgLoss > 0 ? avgWin / avgLoss : Infinity;
        const expectancy = (winRate / 100 * avgWin) - (lossRate / 100 * avgLoss);

        const totalHoldTimeMs = filteredTrades.reduce((sum, t) => {
            if (t.entry_timestamp && t.exit_timestamp) {
                return sum + (new Date(t.exit_timestamp).getTime() - new Date(t.entry_timestamp).getTime());
            }
            return sum;
        }, 0);
        const avgHoldTimeMs = totalTrades > 0 ? totalHoldTimeMs / totalTrades : 0;
        
        const formatDuration = (ms: number) => {
            if (ms <= 0) return '0m';
            const seconds = Math.floor(ms / 1000);
            const minutes = Math.floor(seconds / 60);
            const hours = Math.floor(minutes / 60);
            const days = Math.floor(hours / 24);

            if (days > 0) return `${days}d ${hours % 24}h`;
            if (hours > 0) return `${hours}h ${minutes % 60}m`;
            if (minutes > 0) return `${minutes}m`;
            return `${seconds}s`;
        };
        const avgHoldTime = formatDuration(avgHoldTimeMs);
        
        let cumulativePnl = 0;
        let peakPnl = 0;
        let maxDrawdown = 0;
        const sortedTrades = [...filteredTrades].sort((a,b) => new Date(a.exit_timestamp).getTime() - new Date(b.exit_timestamp).getTime());
        sortedTrades.forEach(trade => {
            cumulativePnl += trade.pnl;
            if (cumulativePnl > peakPnl) {
                peakPnl = cumulativePnl;
            }
            const drawdown = peakPnl - cumulativePnl;
            if (drawdown > maxDrawdown) {
                maxDrawdown = drawdown;
            }
        });

        const pnlValues = filteredTrades.map(t => t.pnl);
        const meanPnl = avgPnlPerTrade;
        const squaredDifferences = pnlValues.map(pnl => Math.pow(pnl - meanPnl, 2));
        const variance = squaredDifferences.length > 1 ? squaredDifferences.reduce((sum, val) => sum + val, 0) / (totalTrades - 1) : 0;
        const stdDeviation = Math.sqrt(variance);
        const sharpeRatio = stdDeviation > 0 ? meanPnl / stdDeviation : 0;

        return { 
            totalTrades,
            netPnl, 
            avgPnlPerTrade,
            avgWin,
            avgLoss,
            winRate, 
            profitFactor, 
            expectancy, 
            avgRR,
            avgHoldTime,
            maxDrawdown,
            sharpeRatio,
            stdDeviation,
        };
    }, [filteredTrades]);
    
    const pnlColorClass = performanceMetrics.netPnl >= 0 ? 'text-accent-400' : 'text-red-500';

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
                 <select 
                    value={selectedAccountId} 
                    onChange={e => setSelectedAccountId(e.target.value)}
                    className="bg-white dark:bg-slate-800 border border-slate-300 dark:border-white/10 rounded-md px-3 py-2 text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-accent-500 focus:border-accent-500"
                >
                    <option value="all">All Accounts</option>
                    {accounts.map(acc => <option key={acc.id} value={acc.id}>{acc.name}</option>)}
                </select>
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6">
                <StatCard 
                    title="Net P/L" 
                    value={`$${performanceMetrics.netPnl.toFixed(2)}`} 
                    icon={<DashboardIcon />}
                    valueClassName={pnlColorClass}
                />
                <StatCard title="Win Rate" value={`${performanceMetrics.winRate.toFixed(1)}%`} icon={<PerformanceBreakdownIcon />} />
                <StatCard title="Profit Factor" value={isFinite(performanceMetrics.profitFactor) ? performanceMetrics.profitFactor.toFixed(2) : '∞'} icon={<ProfitFactorIcon />} />
                <StatCard title="Expectancy" value={`$${performanceMetrics.expectancy.toFixed(2)}`} icon={<ExpectancyIcon />} />
                <StatCard title="Avg Win/Loss" value={isFinite(performanceMetrics.avgRR) ? `${performanceMetrics.avgRR.toFixed(2)}:1` : '∞'} icon={<BalanceIcon />} />
                <TradiaScoreStatCard winRate={performanceMetrics.winRate} profitFactor={performanceMetrics.profitFactor} avgRR={performanceMetrics.avgRR} />
            </div>

            <div className="grid grid-cols-1 gap-6">
                <div className="bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-white/10 p-4 sm:p-6 rounded-xl shadow-lg h-[26rem]">
                    <h3 className="text-lg font-semibold mb-4 text-slate-900 dark:text-white">Cumulative Net P/L</h3>
                    <ResponsiveContainer width="100%" height="90%">
                        <AreaChart data={chartData} margin={{ top: 5, right: 20, left: -15, bottom: 0 }}>
                            <defs>
                                <linearGradient id="gradientPositiveAnalytics" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#22c55e" stopOpacity={0.4}/>
                                    <stop offset="95%" stopColor="#22c55e" stopOpacity={0}/>
                                </linearGradient>
                                <linearGradient id="gradientNegativeAnalytics" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#ef4444" stopOpacity={0.4}/>
                                    <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
                                </linearGradient>
                                <linearGradient id="splitGradientAnalytics" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset={0} stopColor="#22c55e" stopOpacity={0.4}/>
                                    <stop offset={gradientOffset} stopColor="#22c55e" stopOpacity={0.0}/>
                                    <stop offset={gradientOffset} stopColor="#ef4444" stopOpacity={0.0}/>
                                    <stop offset={1} stopColor="#ef4444" stopOpacity={0.4}/>
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" stroke={theme === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)'} />
                            <XAxis dataKey="date" stroke={theme === 'dark' ? '#94a3b8' : '#64748b'} tick={{fontSize: 12}} />
                            <YAxis stroke={theme === 'dark' ? '#94a3b8' : '#64748b'} tick={{fontSize: 12}} />
                            <Tooltip 
                                contentStyle={theme === 'dark' ? { backgroundColor: 'rgba(15, 23, 42, 0.8)', border: '1px solid rgba(255,255,255,0.2)' } : {}}
                                formatter={(value: number) => `$${value.toFixed(2)}`}
                            />
                            <Area type="monotone" dataKey="cumulativePnl" name="CPnL" stroke={strokeColor} strokeWidth={2} fillOpacity={1} fill={fillUrl} />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                 <div className="h-[26rem]">
                    <PerformanceCalendar data={dailyData} onDayClick={handleDayClick} />
                 </div>
                 <div className="bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-white/10 p-4 sm:p-6 rounded-xl shadow-lg h-[26rem]">
                    <h3 className="text-lg font-semibold mb-4 text-slate-900 dark:text-white">Daily Net P/L</h3>
                    <ResponsiveContainer width="100%" height="90%">
                        <BarChart data={chartData} margin={{ top: 5, right: 5, left: -25, bottom: 0 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke={theme === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)'} />
                            <XAxis dataKey="date" stroke={theme === 'dark' ? '#94a3b8' : '#64748b'} tick={{fontSize: 10}} />
                            <YAxis stroke={theme === 'dark' ? '#94a3b8' : '#64748b'} tick={{fontSize: 10}}/>
                            <Tooltip 
                                contentStyle={theme === 'dark' ? { backgroundColor: 'rgba(15, 23, 42, 0.8)', border: '1px solid rgba(255,255,255,0.2)'} : {}} 
                                cursor={{fill: theme === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)'}}
                                formatter={(value: number) => {
                                    const color = value >= 0 ? '#22c55e' : '#ef4444';
                                    return [<span style={{ color, fontWeight: 'bold' }}>{`$${value.toFixed(2)}`}</span>, 'Net P/L'];
                                }}
                            />
                            <Bar dataKey="pnl">
                                {chartData.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={entry.pnl >= 0 ? '#22c55e' : '#ef4444'} />
                                ))}
                            </Bar>
                        </BarChart>
                    </ResponsiveContainer>
                 </div>
                 <div className="bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-white/10 p-4 sm:p-6 rounded-xl shadow-lg h-[26rem]">
                    <h3 className="text-lg font-semibold mb-4 text-slate-900 dark:text-white">Recent Trades</h3>
                    <div className="space-y-1 overflow-y-auto h-[calc(100%-2.5rem)] pr-2">
                        <div className="grid grid-cols-3 gap-2 items-center px-2 text-xs font-semibold text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-700 pb-2 mb-2">
                            <span>Close Date</span>
                            <span>Symbol</span>
                            <span className="text-right">Net P/L</span>
                        </div>
                        {[...filteredTrades].sort((a, b) => b.exit_timestamp.getTime() - a.exit_timestamp.getTime()).slice(0, 20).map(trade => {
                             const isProfit = trade.pnl >= 0;
                            return (
                                <div key={trade.id} className="grid grid-cols-3 gap-2 items-center p-2 hover:bg-slate-100 dark:hover:bg-white/5 rounded-md text-sm">
                                    <span className="text-slate-500 dark:text-slate-400">{trade.exit_timestamp.toLocaleDateString()}</span>
                                    <span className="font-semibold text-slate-800 dark:text-slate-200">{trade.instrument}</span>
                                    <span className={`font-semibold text-right ${isProfit ? 'text-accent-400' : 'text-red-500'}`}>
                                        {isProfit ? '+' : ''}${trade.pnl.toFixed(2)}
                                    </span>
                                </div>
                            )
                        })}
                    </div>
                 </div>
            </div>
            <DataAnalysisCard metrics={performanceMetrics} />

            {selectedDateForModal && (
                <DayTradesModal 
                    date={selectedDateForModal}
                    trades={tradesForSelectedDate}
                    onClose={() => setSelectedDateForModal(null)}
                />
            )}
        </div>
    );
};

export default AnalyticsOverview;