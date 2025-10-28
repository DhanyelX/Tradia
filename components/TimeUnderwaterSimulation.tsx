import React, { useState, useMemo } from 'react';
import { ComposedChart, Area, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ReferenceArea } from 'recharts';
import { useAppContext } from '../context';
import { Trade } from '../types';
import { TrendingDownIcon } from './Icons';

// Helper function to format duration from milliseconds
const formatDuration = (ms: number): string => {
    if (ms <= 0 || !isFinite(ms)) return '0 days';
    const totalSeconds = Math.floor(ms / 1000);
    const days = Math.floor(totalSeconds / (3600 * 24));
    const hours = Math.floor((totalSeconds % (3600 * 24)) / 3600);
    if (days > 0) return `${days}d ${hours}h`;
    if (hours > 0) return `${hours}h ${Math.floor((totalSeconds % 3600) / 60)}m`;
    const minutes = Math.floor(totalSeconds / 60);
    if (minutes > 0) return `${minutes}m`;
    return `${totalSeconds}s`;
};

const StatCard: React.FC<{ title: string; value: string | number; subtext?: string; valueClassName?: string; }> = ({ title, value, subtext, valueClassName }) => (
    <div className="bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-white/10 p-4 rounded-xl shadow-lg">
        <h3 className="text-sm font-medium text-slate-500 dark:text-slate-400">{title}</h3>
        <p className={`text-2xl font-bold mt-2 ${valueClassName || 'text-slate-900 dark:text-white'}`}>{value}</p>
        {subtext && <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">{subtext}</p>}
    </div>
);

const TimeUnderwaterSimulation: React.FC = () => {
    const { trades, accounts, theme } = useAppContext();
    const [selectedAccountId, setSelectedAccountId] = useState<string>('all');

    const simulationData = useMemo(() => {
        const filteredTrades = trades
            .filter(t => t.trade_taken && (selectedAccountId === 'all' || t.account_id === selectedAccountId))
            .sort((a, b) => new Date(a.exit_timestamp).getTime() - new Date(b.exit_timestamp).getTime());

        if (filteredTrades.length < 2) {
            return { error: "Not enough historical data. At least 2 trades are needed for this analysis." };
        }

        const relevantAccounts = selectedAccountId === 'all' ? accounts : accounts.filter(a => a.id === selectedAccountId);
        const startCapital = relevantAccounts.reduce((sum, acc) => sum + acc.initial_balance, 0);

        // 1. Calculate Equity Curve
        let cumulativePnl = 0;
        const equityCurve = [
            { tradeIndex: 0, date: new Date(filteredTrades[0].entry_timestamp), equity: startCapital, peakEquity: startCapital }
        ];
        
        filteredTrades.forEach((trade, index) => {
            cumulativePnl += trade.pnl;
            const currentEquity = startCapital + cumulativePnl;
            const prevPeak = equityCurve[equityCurve.length - 1].peakEquity;
            equityCurve.push({
                tradeIndex: index + 1,
                date: new Date(trade.exit_timestamp),
                equity: currentEquity,
                peakEquity: Math.max(prevPeak, currentEquity),
            });
        });

        // 2. Identify Drawdowns
        const drawdowns: any[] = [];
        let inDrawdown = false;
        let currentDrawdown: any = {};

        for (let i = 1; i < equityCurve.length; i++) {
            const point = equityCurve[i];
            const prevPoint = equityCurve[i - 1];

            if (point.equity < prevPoint.peakEquity && !inDrawdown) {
                // Start of a new drawdown
                inDrawdown = true;
                currentDrawdown = {
                    startTradeIndex: prevPoint.tradeIndex,
                    startDate: prevPoint.date,
                    peakEquity: prevPoint.peakEquity,
                    troughEquity: point.equity,
                    troughDate: point.date,
                };
            } else if (point.equity < currentDrawdown.peakEquity && inDrawdown) {
                // Continuing a drawdown
                if (point.equity < currentDrawdown.troughEquity) {
                    currentDrawdown.troughEquity = point.equity;
                    currentDrawdown.troughDate = point.date;
                }
            } else if (point.equity >= currentDrawdown.peakEquity && inDrawdown) {
                // End of a drawdown
                inDrawdown = false;
                currentDrawdown.endTradeIndex = point.tradeIndex;
                currentDrawdown.endDate = point.date;
                currentDrawdown.durationMs = point.date.getTime() - currentDrawdown.startDate.getTime();
                currentDrawdown.maxDrawdown = currentDrawdown.peakEquity - currentDrawdown.troughEquity;
                currentDrawdown.maxDrawdownPercent = (currentDrawdown.maxDrawdown / currentDrawdown.peakEquity) * 100;
                currentDrawdown.tradesToRecover = currentDrawdown.endTradeIndex - currentDrawdown.startTradeIndex;
                drawdowns.push(currentDrawdown);
                currentDrawdown = {};
            }
        }

        // 3. Calculate Overall Stats
        const totalDurationMs = equityCurve[equityCurve.length - 1].date.getTime() - equityCurve[0].date.getTime();
        const totalUnderwaterMs = drawdowns.reduce((sum, dd) => sum + dd.durationMs, 0);

        const stats = {
            longestDrawdown: drawdowns.length > 0 ? Math.max(...drawdowns.map(dd => dd.durationMs)) : 0,
            deepestDrawdownValue: drawdowns.length > 0 ? Math.max(...drawdowns.map(dd => dd.maxDrawdown)) : 0,
            deepestDrawdownPercent: drawdowns.length > 0 ? Math.max(...drawdowns.map(dd => dd.maxDrawdownPercent)) : 0,
            avgDrawdownDuration: drawdowns.length > 0 ? totalUnderwaterMs / drawdowns.length : 0,
            percentTimeUnderwater: totalDurationMs > 0 ? (totalUnderwaterMs / totalDurationMs) * 100 : 0,
        };

        return { equityCurve, drawdowns, stats, error: null };
    }, [selectedAccountId, trades, accounts]);

    const inputStyles = "w-full bg-slate-100 dark:bg-slate-700/50 text-slate-900 dark:text-white p-3 rounded-lg border border-slate-300 dark:border-slate-700 focus:ring-2 focus:ring-accent-500 focus:border-accent-500 text-base transition-colors";

    return (
        <div className="space-y-6">
            <div className="text-center">
                <h2 className="text-3xl font-bold text-slate-900 dark:text-white flex items-center justify-center gap-3">
                    <TrendingDownIcon className="w-8 h-8 text-accent-500" />
                    Time Under Water Analysis
                </h2>
                <p className="text-slate-500 dark:text-slate-400 mt-2 max-w-2xl mx-auto">
                    Analyze the duration and depth of historical drawdowns to build the psychological resilience needed for your strategy.
                </p>
            </div>

            <div className="bg-white/80 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-xl shadow-lg p-6 max-w-lg mx-auto">
                <label htmlFor="account-selector" className="block text-sm font-medium text-slate-500 dark:text-slate-400 mb-2">Select Data Source</label>
                <select id="account-selector" value={selectedAccountId} onChange={e => setSelectedAccountId(e.target.value)} className={inputStyles}>
                    <option value="all">All Accounts</option>
                    {accounts.map(acc => <option key={acc.id} value={acc.id}>{acc.name}</option>)}
                </select>
            </div>

            {simulationData?.error && (
                <div className="text-center py-12 bg-white/50 dark:bg-slate-900/30 rounded-lg border-2 border-dashed border-slate-300 dark:border-slate-700">
                    <p className="text-slate-500 dark:text-slate-400">{simulationData.error}</p>
                </div>
            )}

            {simulationData && !simulationData.error && (
                 <div className="space-y-6 animate-fade-in">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <StatCard title="Longest Drawdown" value={formatDuration(simulationData.stats.longestDrawdown)} />
                        <StatCard title="Deepest Drawdown" value={`-$${simulationData.stats.deepestDrawdownValue.toFixed(2)}`} subtext={`${simulationData.stats.deepestDrawdownPercent.toFixed(1)}%`} valueClassName="text-red-500" />
                        <StatCard title="Avg. DD Duration" value={formatDuration(simulationData.stats.avgDrawdownDuration)} />
                        <StatCard title="% Time Underwater" value={`${simulationData.stats.percentTimeUnderwater.toFixed(1)}%`} />
                    </div>

                    <div className="bg-white/80 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-xl shadow-lg p-6 h-[28rem]">
                        <h3 className="text-lg font-semibold mb-4 text-slate-900 dark:text-white">Equity Curve & Drawdowns</h3>
                        <ResponsiveContainer width="100%" height="90%">
                            <ComposedChart data={simulationData.equityCurve} margin={{ top: 5, right: 20, left: -15, bottom: 0 }}>
                                <defs>
                                    <linearGradient id="equityFill" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.4}/>
                                        <stop offset="95%" stopColor="#4f46e5" stopOpacity={0}/>
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" stroke={theme === 'dark' ? '#334155' : '#e2e8f0'} />
                                <XAxis dataKey="tradeIndex" name="Trade #" tick={{ fontSize: 12 }} />
                                <YAxis domain={['auto', 'auto']} tickFormatter={(val) => `$${(val/1000).toFixed(0)}k`} tick={{ fontSize: 12 }} />
                                <Tooltip formatter={(value: any) => typeof value === 'number' ? `$${value.toLocaleString(undefined, { maximumFractionDigits: 0 })}` : value} contentStyle={theme === 'dark' ? { backgroundColor: 'rgba(15, 23, 42, 0.9)', border: '1px solid #334155' } : {}} />
                                <Legend />

                                {simulationData.drawdowns.map((dd: any, index: number) => (
                                    <ReferenceArea
                                        key={index}
                                        x1={dd.startTradeIndex}
                                        x2={dd.endTradeIndex}
                                        y1={0}
                                        y2={dd.peakEquity}
                                        stroke="none"
                                        fill="#ef4444"
                                        fillOpacity={0.1}
                                    />
                                ))}

                                <Line type="monotone" dataKey="peakEquity" name="High Water Mark" stroke="#4ade80" strokeWidth={2} dot={false} strokeDasharray="5 5" />
                                <Area type="monotone" dataKey="equity" name="Equity" stroke="#4f46e5" strokeWidth={2} fill="url(#equityFill)" />
                            </ComposedChart>
                        </ResponsiveContainer>
                    </div>

                    <div className="bg-white/80 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-xl shadow-lg p-6">
                        <h3 className="text-lg font-semibold mb-4 text-slate-900 dark:text-white">Drawdown History</h3>
                        <div className="overflow-x-auto max-h-96">
                             <table className="w-full text-sm text-left">
                                <thead className="sticky top-0 bg-white dark:bg-slate-900">
                                    <tr className="border-b border-slate-200 dark:border-slate-700">
                                        <th className="p-2">Start Date</th>
                                        <th className="p-2">End Date</th>
                                        <th className="p-2">Duration</th>
                                        <th className="p-2">Max DD ($)</th>
                                        <th className="p-2">Max DD (%)</th>
                                        <th className="p-2">Trades to Recover</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {simulationData.drawdowns.map((dd: any, index: number) => (
                                        <tr key={index} className="border-b border-slate-100 dark:border-slate-800">
                                            <td className="p-2">{dd.startDate.toLocaleDateString()}</td>
                                            <td className="p-2">{dd.endDate.toLocaleDateString()}</td>
                                            <td className="p-2">{formatDuration(dd.durationMs)}</td>
                                            <td className="p-2 text-red-500 font-semibold">-${dd.maxDrawdown.toFixed(2)}</td>
                                            <td className="p-2">{dd.maxDrawdownPercent.toFixed(1)}%</td>
                                            <td className="p-2 text-center">{dd.tradesToRecover}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default TimeUnderwaterSimulation;
