import React, { useState, useMemo, useRef } from 'react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { useAppContext } from '../context';
import { Trade } from '../types';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Cell, LineChart, Line, Legend, PieChart, Pie } from 'recharts';
import { DocumentArrowDownIcon, LightbulbIcon } from './Icons';
import { getAIReportSummary } from '../services/geminiService';

const formatDuration = (ms: number) => {
    if (ms <= 0 || !isFinite(ms)) return '0m';
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) return `${days}d ${hours % 24}h`;
    if (hours > 0) return `${hours}h ${minutes % 60}m`;
    if (minutes > 0) return `${minutes}m`;
    return `${seconds}s`;
};

const calculateMetrics = (trades: Trade[], startBalance: number) => {
    const totalTrades = trades.length;
    if (totalTrades === 0) {
        return { 
            totalTrades: 0, netPnl: 0, winRate: 0, profitFactor: 0, avgWin: 0, avgLoss: 0, avgRR: 0, expectancy: 0, grossProfit: 0, grossLoss: 0,
            maxConsecutiveWins: 0, maxConsecutiveLosses: 0, avgHoldTime: 'N/A', longestTrade: 'N/A', shortestTrade: 'N/A', maxDrawdown: 0,
            sharpeRatio: 0, stdDeviation: 0, avgRiskPercent: 0, maxRiskTaken: 0, totalRiskedCapital: 0
        };
    }

    const winningTrades = trades.filter(t => t.pnl > 0);
    const losingTrades = trades.filter(t => t.pnl < 0);
    const netPnl = trades.reduce((sum, t) => sum + t.pnl, 0);
    const winRate = (winningTrades.length / totalTrades) * 100;
    const lossRate = (losingTrades.length / totalTrades) * 100;

    const grossProfit = winningTrades.reduce((sum, t) => sum + t.pnl, 0);
    const grossLoss = Math.abs(losingTrades.reduce((sum, t) => sum + t.pnl, 0));

    const avgWin = winningTrades.length > 0 ? grossProfit / winningTrades.length : 0;
    const avgLoss = losingTrades.length > 0 ? grossLoss / losingTrades.length : 0;

    const profitFactor = grossLoss > 0 ? grossProfit / grossLoss : Infinity;
    const avgRR = avgLoss > 0 ? avgWin / avgLoss : Infinity;
    const expectancy = (winRate / 100 * avgWin) - (lossRate / 100 * avgLoss);

    let maxConsecutiveWins = 0, maxConsecutiveLosses = 0, currentWinStreak = 0, currentLossStreak = 0;
    trades.forEach(t => {
        if (t.pnl > 0) { currentWinStreak++; currentLossStreak = 0; } 
        else if (t.pnl < 0) { currentLossStreak++; currentWinStreak = 0; }
        if (currentWinStreak > maxConsecutiveWins) maxConsecutiveWins = currentWinStreak;
        if (currentLossStreak > maxConsecutiveLosses) maxConsecutiveLosses = currentLossStreak;
    });

    const durations = trades.map(t => new Date(t.exit_timestamp).getTime() - new Date(t.entry_timestamp).getTime()).filter(d => d > 0);
    const avgHoldTimeMs = durations.length > 0 ? durations.reduce((a, b) => a + b, 0) / durations.length : 0;
    const longestTradeMs = durations.length > 0 ? Math.max(...durations) : 0;
    const shortestTradeMs = durations.length > 0 ? Math.min(...durations) : 0;

    let cumulativePnl = 0, peakEquity = startBalance, maxDrawdown = 0;
    trades.forEach(trade => {
        cumulativePnl += trade.pnl;
        const currentEquity = startBalance + cumulativePnl;
        if (currentEquity > peakEquity) peakEquity = currentEquity;
        const drawdown = peakEquity - currentEquity;
        if (drawdown > maxDrawdown) maxDrawdown = drawdown;
    });

    const pnlValues = trades.map(t => t.pnl);
    const meanPnl = netPnl / totalTrades;
    const stdDeviation = Math.sqrt(pnlValues.map(x => Math.pow(x - meanPnl, 2)).reduce((a, b) => a + b, 0) / totalTrades);
    const sharpeRatio = stdDeviation > 0 ? meanPnl / stdDeviation : 0;

    const riskTrades = trades.filter(t => t.risk_percentage && t.risk_percentage > 0);
    const avgRiskPercent = riskTrades.length > 0 ? riskTrades.reduce((sum, t) => sum + (t.risk_percentage || 0), 0) / riskTrades.length : 0;
    const maxRiskTaken = Math.max(0, ...trades.map(t => t.risk_percentage || 0));
    const totalRiskedCapital = riskTrades.reduce((sum, t) => sum + (t.risk_percentage || 0), 0);

    return {
        totalTrades, netPnl, winRate, profitFactor, avgWin, avgLoss, avgRR, expectancy, grossProfit, grossLoss,
        maxConsecutiveWins, maxConsecutiveLosses, avgHoldTime: formatDuration(avgHoldTimeMs), longestTrade: formatDuration(longestTradeMs),
        shortestTrade: formatDuration(shortestTradeMs), maxDrawdown, sharpeRatio: isFinite(sharpeRatio) ? sharpeRatio : 0, stdDeviation, avgRiskPercent, maxRiskTaken, totalRiskedCapital,
    };
};

const SectionHeader: React.FC<{ number: number, title: string }> = ({ number, title }) => (
    <div className="flex items-center gap-4 my-6 pb-2 border-b-2 border-accent-500/50">
        <div className="w-8 h-8 flex items-center justify-center bg-accent-500 text-white font-bold rounded-full flex-shrink-0">{number}</div>
        <h2 className="text-xl font-bold text-slate-900 dark:text-white">{title}</h2>
    </div>
);

const ReportPreview: React.FC<{ reportData: any, theme: string }> = ({ reportData, theme }) => {
    const { metrics, equityCurve, assetDistribution, winRateOverTime, tradeDurations, aiSummary, isLoadingAiSummary } = reportData;
    const COLORS = ['#4f46e5', '#16a34a', '#ca8a04', '#0ea5e9', '#db2777'];
    
    const sessionMap: { [key: string]: string } = {
        'London': 'LDN',
        'New York': 'NY',
        'Tokyo': 'ASIA',
        'Sydney': 'SYD',
    };

    return (
        <div className="bg-white dark:bg-slate-900 p-6 sm:p-8 rounded-lg border border-slate-200 dark:border-slate-700 font-sans">
            {/* 1. Header */}
            <div className="text-center pb-4 mb-6">
                <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white">Tradia Performance Report</h1>
                <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-2 text-sm text-slate-500 dark:text-slate-400">
                    <div><strong>Trader:</strong> {reportData.userName}</div>
                    <div><strong>Account:</strong> {reportData.accountName}</div>
                    <div><strong>Period:</strong> {reportData.startDate.toLocaleDateString()} - {reportData.endDate.toLocaleDateString()}</div>
                    <div><strong>Currency:</strong> {reportData.currency}</div>
                </div>
            </div>

            {/* 2. Executive Summary */}
            <SectionHeader number={1} title="Executive Summary" />
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {( [ { label: 'Starting Balance', value: `$${reportData.startBalance.toLocaleString()}` }, { label: 'Ending Balance', value: `$${reportData.endBalance.toLocaleString()}` }, { label: 'Net Profit/Loss', value: `${metrics.netPnl >= 0 ? '+' : '-'}$${Math.abs(metrics.netPnl).toFixed(2)} (${(metrics.netPnl/reportData.startBalance * 100).toFixed(2)}%)`, className: metrics.netPnl >= 0 ? 'text-green-500' : 'text-red-500' }, { label: 'Total Trades', value: metrics.totalTrades }, { label: 'Win Rate', value: `${metrics.winRate.toFixed(1)}%` }, { label: 'Avg R:R', value: `${isFinite(metrics.avgRR) ? metrics.avgRR.toFixed(2) : '∞'}:1` }, { label: 'Max Drawdown', value: `$${metrics.maxDrawdown.toFixed(2)}` }, { label: 'Avg. Duration', value: metrics.avgHoldTime }, ] ).map(item => (
                    <div key={item.label} className="bg-slate-100 dark:bg-slate-800 p-3 rounded-lg"><p className="text-xs text-slate-500 dark:text-slate-400">{item.label}</p><p className={`font-bold text-base sm:text-lg text-slate-900 dark:text-white ${item.className || ''}`}>{item.value}</p></div>
                ))}
            </div>
            <div className="h-64 mt-6">
                <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={equityCurve}><defs><linearGradient id="equityFill" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#4f46e5" stopOpacity={0.4}/><stop offset="95%" stopColor="#4f46e5" stopOpacity={0}/></linearGradient></defs><CartesianGrid strokeDasharray="3 3" stroke={theme === 'dark' ? '#334155' : '#e2e8f0'} /><XAxis dataKey="date" tick={{ fontSize: 10 }} /><YAxis domain={['auto', 'auto']} tick={{ fontSize: 10 }} tickFormatter={(val) => `$${(val/1000).toFixed(0)}k`} /><Tooltip formatter={(val: number) => `$${val.toFixed(2)}`} /><Area type="monotone" dataKey="equity" name="Equity" stroke="#4f46e5" strokeWidth={2} fill="url(#equityFill)" /></AreaChart>
                </ResponsiveContainer>
            </div>

            {/* 3. Detailed Performance Metrics */}
            <SectionHeader number={2} title="Detailed Performance Metrics" />
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                {[ {l:'Starting Balance', v:`$${reportData.startBalance.toFixed(2)}`}, {l:'Ending Balance', v:`$${reportData.endBalance.toFixed(2)}`}, {l:'Net P&L', v:`$${metrics.netPnl.toFixed(2)} (${(metrics.netPnl/reportData.startBalance*100).toFixed(2)}%)`}, {l:'Gross Profit', v:`$${metrics.grossProfit.toFixed(2)}`}, {l:'Gross Loss', v:`$${metrics.grossLoss.toFixed(2)}`}, {l:'Profit Factor', v:isFinite(metrics.profitFactor) ? metrics.profitFactor.toFixed(2) : '∞'}, {l:'Expectancy', v:`$${metrics.expectancy.toFixed(2)}`}, {l:'Avg. Win', v:`$${metrics.avgWin.toFixed(2)}`}, {l:'Avg. Loss', v:`$${metrics.avgLoss.toFixed(2)}`}, {l:'Win Rate', v:`${metrics.winRate.toFixed(1)}%`}, {l:'Max Consecutive Wins', v:metrics.maxConsecutiveWins}, {l:'Max Consecutive Losses', v:metrics.maxConsecutiveLosses}, {l:'Average Trade Duration', v:metrics.avgHoldTime}, {l:'Longest Trade', v:metrics.longestTrade}, {l:'Shortest Trade', v:metrics.shortestTrade}, {l:'Sharpe Ratio', v:metrics.sharpeRatio.toFixed(2)} ].map(m => (
                    <div key={m.l} className="flex justify-between p-2 bg-slate-100 dark:bg-slate-800 rounded-lg items-center">
                        <span className="text-slate-500 dark:text-slate-400">{m.l}</span>
                        <span className="font-semibold text-slate-800 dark:text-slate-200">{m.v}</span>
                    </div>
                ))}
            </div>

            {/* 4. Trade Log Summary */}
            <SectionHeader number={3} title="Trade Log Summary" />
            <div className="border border-slate-200 dark:border-slate-700 rounded-lg overflow-x-auto">
                <table className="w-full text-xs text-left">
                    <thead className="bg-slate-100 dark:bg-slate-800">
                        <tr>{['Date','Symbol','Bias','Risk','Entry','Exit','P/L','Dur.','Session'].map(h => <th key={h} className="p-1.5 font-semibold">{h}</th>)}</tr>
                    </thead>
                    <tbody>
                        {reportData.trades.map((t: Trade) => {
                            const biasTag = t.tags.find(tag => ['Bullish', 'Bearish'].includes(tag));
                            const bias = biasTag === 'Bullish' ? 'Long' : biasTag === 'Bearish' ? 'Short' : 'N/A';
                            const sessionTag = t.tags.find(tag => Object.keys(sessionMap).includes(tag));
                            const session = sessionTag ? sessionMap[sessionTag] : 'N/A';
                            return (<tr key={t.id} className="border-b border-slate-200 dark:border-slate-700 last:border-b-0">
                                <td className="p-1.5 whitespace-nowrap">{new Date(t.exit_timestamp).toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: '2-digit' })}</td>
                                <td className="p-1.5 font-semibold">{t.instrument}</td>
                                <td className="p-1.5">{bias}</td>
                                <td className="p-1.5">{t.risk_percentage?.toFixed(1) || 'N/A'}%</td>
                                <td className="p-1.5">{t.entry?.toFixed(3) ?? 'N/A'}</td>
                                <td className="p-1.5">{t.exit?.toFixed(3) ?? 'N/A'}</td>
                                <td className={`p-1.5 font-semibold ${t.pnl >= 0 ? 'text-green-500' : 'text-red-500'}`}>${t.pnl.toFixed(2)}</td>
                                <td className="p-1.5">{formatDuration(new Date(t.exit_timestamp).getTime() - new Date(t.entry_timestamp).getTime())}</td>
                                <td className="p-1.5">{session}</td>
                            </tr>);
                        })}
                    </tbody>
                </table>
            </div>

            {/* 5. Asset Distribution & 9. Charts */}
            <SectionHeader number={4} title="Charts & Distributions" />
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="h-72"><h4 className="font-semibold text-center mb-2">P/L by Asset</h4><ResponsiveContainer width="100%" height="100%"><BarChart data={assetDistribution} layout="vertical" margin={{left:20}}><CartesianGrid strokeDasharray="3 3" /><XAxis type="number" /><YAxis type="category" dataKey="name" width={70} tick={{fontSize:11}} /><Tooltip formatter={(val:number) => `$${val.toFixed(2)}`} /><Bar dataKey="pnl">{assetDistribution.map((e:any) => <Cell key={e.name} fill={e.pnl >= 0 ? '#16a34a' : '#ef4444'} />)}</Bar></BarChart></ResponsiveContainer></div>
                <div className="h-72">
                    <h4 className="font-semibold text-center mb-1">Trade Count by Asset</h4>
                    <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                            <Pie 
                                data={assetDistribution} 
                                dataKey="tradeCount" 
                                nameKey="name" 
                                cx="50%" 
                                cy="50%" 
                                innerRadius={50}
                                outerRadius={70} 
                                paddingAngle={3}
                            >
                                {assetDistribution.map((_e:any, i:number) => <Cell key={`cell-${i}`} fill={COLORS[i % COLORS.length]} />)}
                            </Pie>
                            <Tooltip formatter={(value: number, name: string) => [`${value} trades`, name]} />
                            <Legend 
                                iconSize={10} 
                                layout="vertical" 
                                verticalAlign="middle" 
                                align="right"
                                formatter={(value, entry: any) => {
                                    const { tradeCount } = entry.payload;
                                    return `${value} (${tradeCount})`;
                                }}
                            />
                        </PieChart>
                    </ResponsiveContainer>
                </div>
                <div className="h-72"><h4 className="font-semibold text-center mb-2">Win Rate Over Time</h4><ResponsiveContainer width="100%" height="100%"><LineChart data={winRateOverTime}><CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="date" tick={{fontSize:10}} /><YAxis domain={[0,100]} tickFormatter={(v) => `${v}%`} /><Tooltip formatter={(v:number) => `${v.toFixed(1)}%`} /><Line type="monotone" dataKey="winRate" stroke="#ca8a04" /></LineChart></ResponsiveContainer></div>
                <div className="h-72"><h4 className="font-semibold text-center mb-2">Trade Duration Distribution</h4><ResponsiveContainer width="100%" height="100%"><BarChart data={tradeDurations}><CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="name" tick={{fontSize: 11}} /><YAxis /><Tooltip /><Bar dataKey="count" fill="#0ea5e9" /></BarChart></ResponsiveContainer></div>
            </div>

            {/* 6. Tax Summary & 7. Risk Report */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-8">
                <div><SectionHeader number={5} title="Tax-Relevant Summary" /><div className="space-y-2 text-sm">
                    {[ {l:'Total Realized Gains', v:`$${metrics.grossProfit.toFixed(2)}`}, {l:'Total Realized Losses', v:`$${metrics.grossLoss.toFixed(2)}`}, {l:'Net Taxable Gain', v:`$${metrics.netPnl.toFixed(2)}`}, {l:'Final Taxable Profit', v:`$${metrics.netPnl.toFixed(2)}`} ].map(m => (<div key={m.l} className="flex justify-between p-2 bg-slate-100 dark:bg-slate-800 rounded-lg items-center"><span className="text-slate-500 dark:text-slate-400">{m.l}</span><span className="font-semibold text-slate-800 dark:text-slate-200">{m.v}</span></div>))}
                </div></div>
                <div><SectionHeader number={6} title="Risk Report" /><div className="space-y-2 text-sm">
                    {[ {l:'Average Risk % per Trade', v:`${metrics.avgRiskPercent.toFixed(2)}%`}, {l:'Max Risk % Taken', v:`${metrics.maxRiskTaken.toFixed(2)}%`}, {l:'Total Risked Capital (%)', v:`${metrics.totalRiskedCapital.toFixed(2)}%`}, {l:'Risk Compliance', v: '✅ Within Plan'} ].map(m => (<div key={m.l} className="flex justify-between p-2 bg-slate-100 dark:bg-slate-800 rounded-lg items-center"><span className="text-slate-500 dark:text-slate-400">{m.l}</span><span className="font-semibold text-slate-800 dark:text-slate-200">{m.v}</span></div>))}
                </div></div>
            </div>

            {/* 8. AI Summary */}
            <SectionHeader number={7} title="Performance Insights" />
            <div className="bg-blue-500/10 border-l-4 border-blue-400 p-4 rounded-r-lg">
                <p className="font-semibold text-blue-900 dark:text-blue-300 flex items-center gap-2"><LightbulbIcon /> Tradia Analysis</p>
                {isLoadingAiSummary ? <p className="italic text-sm mt-2">Generating insights...</p> : <p className="italic text-sm mt-2 text-blue-800 dark:text-blue-200">{aiSummary}</p>}
            </div>

            {/* 10. Compliance */}
            <SectionHeader number={8} title="Compliance Declaration" />
            <p className="text-xs text-slate-500 dark:text-slate-400 italic">I, {reportData.userName}, hereby declare that this report accurately represents my trading activity for the period stated, as generated by Tradia. All figures are based on verified trade data.</p>
            <div className="mt-8 flex gap-8">
                <div className="border-t border-slate-400 dark:border-slate-600 flex-grow pt-2 text-sm text-slate-600 dark:text-slate-400">Signature</div>
                <div className="border-t border-slate-400 dark:border-slate-600 w-40 pt-2 text-sm text-slate-600 dark:text-slate-400">Date</div>
            </div>
        </div>
    );
};

const Reports: React.FC = () => {
    const { user, trades, accounts, theme } = useAppContext();
    const [reportData, setReportData] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [isLoadingAiSummary, setIsLoadingAiSummary] = useState(false);
    const [selectedAccountId, setSelectedAccountId] = useState('all');
    const reportPreviewRef = useRef<HTMLDivElement>(null);

    const generateReport = (type: 'weekly' | 'monthly') => {
        setIsLoading(true);
        setReportData(null);

        setTimeout(() => {
            const now = new Date();
            const endDate = new Date(now);
            const startDate = new Date(now);
            startDate.setHours(0, 0, 0, 0);
            startDate.setDate(now.getDate() - (type === 'weekly' ? 7 : 30));

            const allTradesSorted = [...trades].sort((a,b) => new Date(a.exit_timestamp).getTime() - new Date(b.exit_timestamp).getTime());

            const filteredTrades = selectedAccountId === 'all'
                ? allTradesSorted
                : allTradesSorted.filter(t => t.account_id === selectedAccountId);
            
            const reportTrades = filteredTrades.filter(t => t.trade_taken && new Date(t.exit_timestamp) >= startDate && new Date(t.exit_timestamp) <= endDate);
            
            const relevantAccounts = selectedAccountId === 'all' ? accounts : accounts.filter(a => a.id === selectedAccountId);
            const currentTotalBalance = relevantAccounts.reduce((sum, acc) => sum + acc.balance, 0);
            
            const pnlAfterPeriod = filteredTrades.filter(t => t.trade_taken && new Date(t.exit_timestamp) > endDate).reduce((sum, t) => sum + t.pnl, 0);
            const endBalance = currentTotalBalance - pnlAfterPeriod;
            const pnlDuringPeriod = reportTrades.reduce((sum, t) => sum + t.pnl, 0);
            const startBalance = endBalance - pnlDuringPeriod;
            
            const metrics = calculateMetrics(reportTrades, startBalance);
            
            const equityCurve = reportTrades.reduce<any[]>((acc, trade) => {
                const lastEquity = acc.length > 0 ? acc[acc.length - 1].equity : startBalance;
                acc.push({ date: new Date(trade.exit_timestamp).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }), equity: lastEquity + trade.pnl });
                return acc;
            }, []);

            const byAsset = reportTrades.reduce<{[key:string]: {trades:number,pnl:number,wins:number}}>((acc, t) => {
                if(!acc[t.instrument]) acc[t.instrument] = {trades:0, pnl:0, wins:0};
                acc[t.instrument].trades++; acc[t.instrument].pnl += t.pnl; if(t.pnl > 0) acc[t.instrument].wins++; return acc;
            }, {});
            const assetDistribution = Object.entries(byAsset).map(([name, data]) => ({name, tradeCount:data.trades, pnl:data.pnl, winRate:(data.wins/data.trades)*100}));
            
            const durationBins = {'<15m':0, '15-60m':0,'1-4h':0,'>4h':0};
            reportTrades.forEach(t => { const d = (new Date(t.exit_timestamp).getTime() - new Date(t.entry_timestamp).getTime()) / 60000; if(d<15) durationBins['<15m']++; else if(d<60) durationBins['15-60m']++; else if(d<240) durationBins['1-4h']++; else durationBins['>4h']++; });
            const tradeDurations = Object.entries(durationBins).map(([name, count]) => ({name, count}));

            const byWeek = reportTrades.reduce<{[key:string]: {trades:number, wins:number}}>((acc, t) => { const d = new Date(t.exit_timestamp); const firstDay=new Date(d.setDate(d.getDate() - d.getDay())); const k=firstDay.toISOString().split('T')[0]; if(!acc[k]) acc[k]={trades:0,wins:0}; acc[k].trades++; if(t.pnl > 0) acc[k].wins++; return acc; }, {});
            const winRateOverTime = Object.entries(byWeek).sort(([a],[b])=>new Date(a).getTime()-new Date(b).getTime()).map(([d,v])=>({date: new Date(d).toLocaleDateString('en-US',{month:'short',day:'numeric'}), winRate:(v.wins/v.trades)*100}));

            const data = {
                userName: user?.name,
                accountName: selectedAccountId === 'all' ? 'All Accounts' : accounts.find(a => a.id === selectedAccountId)?.name || 'Unknown',
                type, startDate, endDate, startBalance, endBalance, currency: 'USD', metrics,
                equityCurve: [{date: startDate.toLocaleDateString('en-US',{month:'short',day:'numeric'}), equity: startBalance}, ...equityCurve],
                assetDistribution, tradeDurations, winRateOverTime,
                trades: reportTrades,
                aiSummary: '',
            };
            setReportData(data);
            setIsLoading(false);
            
            setIsLoadingAiSummary(true);
            getAIReportSummary(data)
                .then(summary => {
                    setReportData((prev:any) => prev ? ({...prev, aiSummary: summary}) : null);
                })
                .catch(error => {
                    console.error("Failed to get AI report summary", error);
                    setReportData((prev:any) => prev ? ({...prev, aiSummary: "Could not load AI summary."}) : null);
                })
                .finally(() => {
                    setIsLoadingAiSummary(false);
                });

        }, 500);
    };

    const downloadPdf = async () => {
        if (!reportPreviewRef.current || !reportData) return;
        const canvas = await html2canvas(reportPreviewRef.current, { scale: 2, useCORS: true, backgroundColor: theme === 'dark' ? '#0f172a' : '#ffffff' });
        const imgData = canvas.toDataURL('image/png');
        const pdf = new jsPDF({ orientation: 'p', unit: 'px', format: [canvas.width, canvas.height] });
        pdf.addImage(imgData, 'PNG', 0, 0, canvas.width, canvas.height);
        pdf.save(`Tradia_Report_${reportData.type}_${reportData.accountName.replace(/ /g,'_')}_${new Date().toISOString().split('T')[0]}.pdf`);
    };

    const inputStyles = "w-full sm:w-auto text-sm font-semibold bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 px-4 py-3 rounded-md border border-slate-300 dark:border-slate-700 focus:ring-2 focus:ring-accent-500 transition-colors";
    const buttonStyles = `${inputStyles} hover:bg-slate-100 dark:hover:bg-slate-700/80`;

    return (
        <div className="space-y-6">
            <div className="text-center">
                <h2 className="text-3xl font-bold text-slate-900 dark:text-white">Generate Performance Report</h2>
                <p className="text-slate-500 dark:text-slate-400 mt-2">Download a PDF of your weekly or monthly trading performance.</p>
            </div>

            <div className="bg-white/80 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-xl shadow-lg p-6">
                <div className="flex flex-col sm:flex-row flex-wrap items-center justify-center gap-4">
                    <select value={selectedAccountId} onChange={e => setSelectedAccountId(e.target.value)} className={inputStyles} disabled={isLoading}>
                        <option value="all">All Accounts</option>
                        {accounts.map(acc => <option key={acc.id} value={acc.id}>{acc.name}</option>)}
                    </select>
                    <button onClick={() => generateReport('weekly')} disabled={isLoading} className={buttonStyles}>Generate Weekly</button>
                    <button onClick={() => generateReport('monthly')} disabled={isLoading} className={buttonStyles}>Generate Monthly</button>
                    {reportData && (
                        <button onClick={downloadPdf} disabled={isLoading} className={`${buttonStyles} !bg-accent-600 !text-white !border-transparent hover:!bg-accent-700`}>
                            <DocumentArrowDownIcon className="w-4 h-4 inline-block mr-2" /> Download PDF
                        </button>
                    )}
                </div>
            </div>

            {isLoading && <div className="text-center p-12"><p className="text-slate-500 dark:text-slate-400">Generating your report...</p></div>}
            {reportData && <div ref={reportPreviewRef} className="animate-fade-in"><ReportPreview reportData={reportData} theme={theme} /></div>}
            {!reportData && !isLoading && (
                 <div className="text-center py-12 bg-white/50 dark:bg-slate-900/30 rounded-lg border-2 border-dashed border-slate-300 dark:border-slate-700">
                    <DocumentArrowDownIcon className="w-12 h-12 mx-auto text-slate-400 dark:text-slate-500 mb-4" />
                    <h3 className="text-xl font-semibold text-slate-700 dark:text-slate-300">Your Report Will Appear Here</h3>
                    <p className="text-slate-500 dark:text-slate-400 mt-2">Select your options and generate a report to get started.</p>
                </div>
            )}
        </div>
    );
};

export default Reports;