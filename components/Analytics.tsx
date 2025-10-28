import React, { useState, useMemo, useEffect, useRef } from 'react';
import { View, Trade, Strategy } from '../types';
import { useAppContext } from '../context';
import { XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Cell, AreaChart, Area, Line } from 'recharts';
import { getAIInsight, getBehavioralAnalysis, BehavioralInsights } from '../services/geminiService';
import AnalyticsOverview from './AnalyticsOverview';
import { 
    SendIcon, DisciplineIcon, WinningStreakIcon,
    LightbulbIcon, PsychologyBehaviorIcon, ClockIcon, BrainCircuitIcon, TagIcon
} from './Icons';
import { SESSIONS, EMOTIONS, EMOTION_CATEGORIES } from '../constants';

const StatCard: React.FC<{ title: string; value: string | number; icon: React.ReactNode; }> = ({ title, value, icon }) => (
    <div className="bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-white/10 p-5 rounded-xl shadow-lg">
        <div className="flex justify-between items-center">
            <h3 className="text-sm font-medium text-slate-500 dark:text-slate-400">{title}</h3>
            <div className="text-slate-400 dark:text-slate-500">{icon}</div>
        </div>
        <p className="text-3xl font-bold text-slate-900 dark:text-white mt-2">{value}</p>
    </div>
);

interface BreakdownCardProps {
    title: string;
    data: any[];
    dataKeyName: string;
}

const BreakdownCard: React.FC<BreakdownCardProps> = ({ title, data, dataKeyName }) => {
    const { theme } = useAppContext();
    return (
        <div className="bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-white/10 p-4 sm:p-6 rounded-xl shadow-lg h-[28rem] flex flex-col">
            <h3 className="text-lg font-semibold mb-4 text-slate-900 dark:text-white flex-shrink-0">{title}</h3>
            <div className="flex-grow h-1/2">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={data} margin={{ top: 5, right: 5, left: -25, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke={theme === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)'} />
                        <XAxis dataKey="name" stroke={theme === 'dark' ? '#94a3b8' : '#64748b'} tick={{fontSize: 10}} />
                        <YAxis stroke={theme === 'dark' ? '#94a3b8' : '#64748b'} tick={{fontSize: 10}}/>
                        <Tooltip contentStyle={theme === 'dark' ? { backgroundColor: 'rgba(15, 23, 42, 0.8)', border: '1px solid rgba(255,255,255,0.2)'} : {}} cursor={{fill: theme === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)'}}/>
                        <Bar dataKey="pnl">
                            {data.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={entry.pnl >= 0 ? '#22c55e' : '#ef4444'} />
                            ))}
                        </Bar>
                    </BarChart>
                </ResponsiveContainer>
            </div>
            <div className="flex-grow overflow-y-auto mt-4 h-1/2">
                <table className="w-full text-left text-sm">
                    <thead>
                        <tr className="border-b border-slate-200 dark:border-white/10 text-xs text-slate-500 dark:text-slate-400 uppercase">
                            <th className="p-2">{dataKeyName}</th>
                            <th className="p-2 text-right">Net P/L</th>
                            <th className="p-2 text-right">Win Rate</th>
                            <th className="p-2 text-right">Trades</th>
                        </tr>
                    </thead>
                    <tbody>
                        {data.map(item => (
                            <tr key={item.name} className="border-b border-slate-200 dark:border-white/10">
                                <td className="p-2 font-medium text-slate-800 dark:text-slate-200">{item.name}</td>
                                <td className={`p-2 text-right font-semibold ${item.pnl >= 0 ? 'text-accent-500' : 'text-red-500'}`}>{item.pnl.toFixed(2)}</td>
                                <td className="p-2 text-right text-slate-500 dark:text-slate-400">{item.winRate.toFixed(1)}%</td>
                                <td className="p-2 text-right text-slate-500 dark:text-slate-400">{item.totalTrades}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

const PerformanceBreakdown: React.FC = () => {
    const { trades, accounts, strategies } = useAppContext();
    const [selectedAccountId, setSelectedAccountId] = useState('all');
    const [timeframe, setTimeframe] = useState('all');
    
    const filteredTrades = useMemo(() => {
        let actualTrades = trades.filter(t => t.trade_taken);
        let dateFiltered = actualTrades;
        if (timeframe !== 'all') {
            const days = parseInt(timeframe);
            const cutoffDate = new Date(new Date().setDate(new Date().getDate() - days));
            dateFiltered = actualTrades.filter(t => t.exit_timestamp >= cutoffDate);
        }
        if (selectedAccountId === 'all') return dateFiltered;
        return dateFiltered.filter(t => t.account_id === selectedAccountId);
    }, [trades, selectedAccountId, timeframe]);

    const instrumentData = useMemo(() => {
        const byInstrument: {[key: string]: {pnl: number; wins: number; total: number}} = {};
        filteredTrades.forEach(t => {
            if (!byInstrument[t.instrument]) byInstrument[t.instrument] = { pnl: 0, wins: 0, total: 0 };
            byInstrument[t.instrument].pnl += t.pnl;
            byInstrument[t.instrument].total++;
            if (t.pnl > 0) byInstrument[t.instrument].wins++;
        });
        return Object.entries(byInstrument).map(([name, data]) => ({ name, pnl: data.pnl, winRate: data.total > 0 ? (data.wins / data.total) * 100 : 0, totalTrades: data.total })).sort((a, b) => b.totalTrades - a.totalTrades);
    }, [filteredTrades]);

    const dayData = useMemo(() => {
        const dayOrder = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
        const byDay: {[key: string]: {pnl: number; wins: number; total: number}} = {};
        dayOrder.forEach(day => byDay[day] = { pnl: 0, wins: 0, total: 0 });
        
        filteredTrades.forEach(t => {
            const dayName = t.exit_timestamp.toLocaleString('en-US', { weekday: 'long' });
            if (dayName in byDay) {
                const dayStats = byDay[dayName];
                dayStats.pnl += t.pnl;
                dayStats.total++;
                if (t.pnl > 0) dayStats.wins++;
            }
        });
        return Object.entries(byDay).map(([name, data]) => ({ name, pnl: data.pnl, winRate: data.total > 0 ? (data.wins / data.total) * 100 : 0, totalTrades: data.total })).filter(d => d.totalTrades > 0).sort((a,b) => dayOrder.indexOf(a.name) - dayOrder.indexOf(b.name));
    }, [filteredTrades]);
    
    const sessionData = useMemo(() => {
        const bySession: {[key: string]: {pnl: number; wins: number; total: number}} = {};
        SESSIONS.forEach(session => bySession[session] = { pnl: 0, wins: 0, total: 0 });

        filteredTrades.forEach(trade => {
            const sessionTag = SESSIONS.find(s => trade.tags.includes(s));
            if (sessionTag) {
                bySession[sessionTag].pnl += trade.pnl;
                bySession[sessionTag].total++;
                if (trade.pnl > 0) bySession[sessionTag].wins++;
            }
        });
        return Object.entries(bySession).map(([name, data]) => ({ name, pnl: data.pnl, winRate: data.total > 0 ? (data.wins / data.total) * 100 : 0, totalTrades: data.total })).filter(d => d.totalTrades > 0);
    }, [filteredTrades]);

    const strategyData = useMemo(() => {
        const byStrategy: {[key: string]: {pnl: number; wins: number; total: number; name: string}} = {};
        const strategyMap = new Map(strategies.map(s => [s.id, s.name]));
        
        filteredTrades.forEach(t => {
            const strategyId = t.strategy_id || 'uncategorized';
            const foundName = strategyMap.get(t.strategy_id || '');
            const strategyName = typeof foundName === 'string' ? foundName : 'Uncategorized';
            
            if (!byStrategy[strategyId]) {
                byStrategy[strategyId] = { pnl: 0, wins: 0, total: 0, name: strategyName };
            }
            byStrategy[strategyId].pnl += t.pnl;
            byStrategy[strategyId].total++;
            if (t.pnl > 0) byStrategy[strategyId].wins++;
        });
        
        return Object.values(byStrategy).map(data => ({ name: data.name, pnl: data.pnl, winRate: data.total > 0 ? (data.wins / data.total) * 100 : 0, totalTrades: data.total })).sort((a, b) => b.totalTrades - a.totalTrades);
    }, [filteredTrades, strategies]);

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
                <div className="flex items-center gap-2 bg-slate-200 dark:bg-slate-800 p-1 rounded-md">
                    {['all', '90', '30'].map(t => (
                        <button key={t} onClick={() => setTimeframe(t)} className={`px-3 py-1 text-sm font-medium rounded ${timeframe === t ? 'bg-white dark:bg-slate-700 shadow text-slate-900 dark:text-white' : 'text-slate-500 dark:text-slate-400'}`}>
                            {t === 'all' ? 'All Time' : `Last ${t} Days`}
                        </button>
                    ))}
                </div>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <BreakdownCard title="Performance by Instrument" data={instrumentData} dataKeyName="Instrument" />
                <BreakdownCard title="Performance by Strategy" data={strategyData} dataKeyName="Strategy" />
                <BreakdownCard title="Performance by Day" data={dayData} dataKeyName="Day" />
                <BreakdownCard title="Performance by Session" data={sessionData} dataKeyName="Session" />
            </div>
        </div>
    );
};

const ScoreCard: React.FC<{ score: number; label: string; icon: React.ReactNode; description: string }> = ({ score, label, icon, description }) => {
    const getScoreColor = (s: number) => {
        if (s >= 75) return 'text-accent-500';
        if (s >= 50) return 'text-yellow-500';
        return 'text-red-500';
    };

    const color = getScoreColor(score);
    const size = 120;
    const strokeWidth = 10;
    const center = size / 2;
    const radius = center - strokeWidth;
    const circumference = 2 * Math.PI * radius;
    const offset = circumference - (score / 100) * circumference;

    return (
        <div className="bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-white/10 p-4 rounded-xl shadow-lg h-full flex flex-col items-center text-center">
            <div className="relative" style={{ width: size, height: size }}>
                <svg className="w-full h-full" viewBox={`0 0 ${size} ${size}`}>
                    <circle className="text-slate-200 dark:text-slate-700" stroke="currentColor" strokeWidth={strokeWidth} fill="transparent" r={radius} cx={center} cy={center} />
                    <circle className={`${color} transition-all duration-1000 ease-in-out`} stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" fill="transparent" r={radius} cx={center} cy={center} style={{ strokeDasharray: circumference, strokeDashoffset: offset, transform: 'rotate(-90deg)', transformOrigin: '50% 50%' }} />
                </svg>
                <div className={`absolute inset-0 flex items-center justify-center text-3xl font-bold ${color}`}>
                    {Math.round(score)}
                </div>
            </div>
            <div className="flex items-center gap-2 text-md font-semibold text-slate-800 dark:text-slate-200 mt-3">
                {icon}
                <span>{label}</span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 flex-grow">{description}</p>
        </div>
    );
};

const DisciplineImpactCard: React.FC<{
    followedStats: { winRate: number, avgPnl: number, total: number };
    notFollowedStats: { winRate: number, avgPnl: number, total: number };
}> = ({ followedStats, notFollowedStats }) => {

    const StatDisplay: React.FC<{title:string, value:string|number, isGood: boolean}> = ({title, value, isGood}) => (
        <div className={`p-3 rounded-md text-center ${isGood ? 'bg-green-500/10' : 'bg-red-500/10'}`}>
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400">{title}</p>
            <p className={`text-xl font-bold ${isGood ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>{value}</p>
        </div>
    )

    return (
        <div className="bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-white/10 p-6 rounded-xl shadow-lg">
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">The Impact of Discipline</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                    <h4 className="font-semibold text-center mb-2 text-green-600 dark:text-green-400">Following Plan ({followedStats.total} Trades)</h4>
                    <div className="space-y-2">
                        <StatDisplay title="Win Rate" value={`${followedStats.winRate.toFixed(1)}%`} isGood />
                        <StatDisplay title="Average P/L" value={`$${followedStats.avgPnl.toFixed(2)}`} isGood />
                    </div>
                </div>
                 <div>
                    <h4 className="font-semibold text-center mb-2 text-red-600 dark:text-red-400">Breaking Plan ({notFollowedStats.total} Trades)</h4>
                    <div className="space-y-2">
                        <StatDisplay title="Win Rate" value={`${notFollowedStats.winRate.toFixed(1)}%`} isGood={false} />
                        <StatDisplay title="Average P/L" value={`$${notFollowedStats.avgPnl.toFixed(2)}`} isGood={false} />
                    </div>
                </div>
            </div>
        </div>
    );
};


const PsychologyBehavior: React.FC = () => {
    const { trades } = useAppContext();
    const [aiInsights, setAiInsights] = useState<BehavioralInsights | null>(null);
    const [isLoadingAI, setIsLoadingAI] = useState(true);

    useEffect(() => {
        const fetchAnalysis = async () => {
            if (trades.filter(t=>t.trade_taken).length > 9) {
                setIsLoadingAI(true);
                try {
                    const insights = await getBehavioralAnalysis(trades);
                    setAiInsights(insights);
                } catch(e) {
                    console.error("AI analysis failed:", e);
                    setAiInsights(null);
                } finally {
                    setIsLoadingAI(false);
                }
            } else {
                setAiInsights([]);
                setIsLoadingAI(false);
            }
        };
        fetchAnalysis();
    }, [trades]);

    const { 
        disciplineScore, 
        emotionalBalanceScore, 
        patienceScore,
        planFollowedStats,
        planNotFollowedStats,
        performanceByEmotion
     } = useMemo(() => {
        const actualTrades = trades.filter(t => t.trade_taken);
        if (actualTrades.length === 0) return { disciplineScore: 0, emotionalBalanceScore: 0, patienceScore: 0, planFollowedStats: {winRate:0, avgPnl:0, total:0}, planNotFollowedStats: {winRate:0, avgPnl:0, total:0}, performanceByEmotion: [] };

        // Discipline Score
        const disciplineScores = actualTrades.map(trade => {
            let score = 100;
            if (trade.followed_plan === false) score -= 50;
            const negativeTags = ['FOMO', 'Revenge Trade', 'Impulsive', 'Over-leveraged'];
            const foundNegativeTags = (trade.tags || []).filter(tag => negativeTags.includes(tag));
            score -= foundNegativeTags.length * 20;
            return Math.max(0, score);
        });
        const disciplineScore = disciplineScores.reduce((a, b) => a + b, 0) / disciplineScores.length;

        // Emotional Balance Score
        const emotionScores = actualTrades.map(trade => {
            const emotions = [trade.emotion_during_trade, trade.emotion_after_trade].filter(Boolean);
            if (emotions.length === 0) return 75; // Neutral score if not logged
            let score = 0;
            emotions.forEach(emotion => {
                if (EMOTION_CATEGORIES.positive.includes(emotion!)) score += 100;
                else if (EMOTION_CATEGORIES.negative.includes(emotion!)) score += 10;
                else score += 75;
            });
            return score / emotions.length;
        });
        const emotionalBalanceScore = emotionScores.reduce((a, b) => a + b, 0) / emotionScores.length;

        // Patience Score
        const winDurations = actualTrades.filter(t => t.pnl > 0).map(t => new Date(t.exit_timestamp).getTime() - new Date(t.entry_timestamp).getTime()).filter(d => d > 0);
        const lossDurations = actualTrades.filter(t => t.pnl <= 0).map(t => new Date(t.exit_timestamp).getTime() - new Date(t.entry_timestamp).getTime()).filter(d => d > 0);
        const avgWinDuration = winDurations.length > 0 ? winDurations.reduce((a, b) => a + b, 0) / winDurations.length : 0;
        const avgLossDuration = lossDurations.length > 0 ? lossDurations.reduce((a, b) => a + b, 0) / lossDurations.length : 0;
        const patienceRatio = avgLossDuration > 0 ? avgWinDuration / avgLossDuration : 2.5; // Default to a good ratio if no losses
        const patienceScore = Math.min(100, (patienceRatio / 2.5) * 100); // Normalize score where 2.5 ratio is 100%

        // Discipline Stats
        const followed = actualTrades.filter(t => t.followed_plan);
        const notFollowed = actualTrades.filter(t => t.followed_plan === false);
        const planFollowedStats = {
            winRate: followed.length > 0 ? (followed.filter(t=>t.pnl>0).length / followed.length) * 100 : 0,
            avgPnl: followed.length > 0 ? followed.reduce((s,t)=>s+t.pnl, 0) / followed.length : 0,
            total: followed.length
        };
        const planNotFollowedStats = {
            winRate: notFollowed.length > 0 ? (notFollowed.filter(t=>t.pnl>0).length / notFollowed.length) * 100 : 0,
            avgPnl: notFollowed.length > 0 ? notFollowed.reduce((s,t)=>s+t.pnl, 0) / notFollowed.length : 0,
            total: notFollowed.length
        };

        // Emotion Performance
        const byEmotion: { [key: string]: { pnl: number; wins: number; total: number } } = {};
        EMOTIONS.forEach(e => byEmotion[e.name] = { pnl: 0, wins: 0, total: 0 });
        actualTrades.forEach(trade => {
            const uniqueEmotions = [...new Set([trade.emotion_during_trade, trade.emotion_after_trade])].filter(Boolean);
            uniqueEmotions.forEach(emotion => {
                if (byEmotion[emotion!]) {
                    byEmotion[emotion!].pnl += trade.pnl;
                    byEmotion[emotion!].total++;
                    if (trade.pnl > 0) byEmotion[emotion!].wins++;
                }
            });
        });
        const performanceByEmotion = Object.entries(byEmotion).map(([name, data]) => ({ name, pnl: data.pnl, totalTrades: data.total, winRate: data.total > 0 ? (data.wins / data.total) * 100 : 0 })).filter(d => d.totalTrades > 0).sort((a, b) => b.totalTrades - a.totalTrades);

        return { disciplineScore, emotionalBalanceScore, patienceScore, planFollowedStats, planNotFollowedStats, performanceByEmotion };

    }, [trades]);

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <ScoreCard score={disciplineScore} label="Discipline Score" icon={<DisciplineIcon />} description="How well you adhere to your predefined trading plan and quality rules." />
                <ScoreCard score={patienceScore} label="Patience Score" icon={<ClockIcon />} description="Measures your ability to let winners run versus cutting losers short. A higher score is better." />
                <ScoreCard score={emotionalBalanceScore} label="Emotional Control" icon={<PsychologyBehaviorIcon />} description="Your ability to maintain a neutral, objective state of mind during trading." />
            </div>

            <div className="bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-white/10 p-6 rounded-xl shadow-lg">
                <h3 className="text-lg font-semibold text-slate-900 dark:text-white flex items-center gap-2"><BrainCircuitIcon /> AI Behavioral Pattern Detector</h3>
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Our AI analyzes your journal for common cognitive biases and costly habits.</p>
                 {isLoadingAI ? (
                     <div className="mt-4 text-center text-slate-500">Scanning for patterns...</div>
                ) : aiInsights && aiInsights.length > 0 ? (
                    <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                        {aiInsights.map(insight => (
                            <div key={insight.name} className="bg-slate-100 dark:bg-slate-800/50 p-4 rounded-lg border border-slate-200 dark:border-slate-700">
                                <p className="font-semibold text-slate-800 dark:text-slate-200">{insight.name}</p>
                                <div className="flex items-baseline gap-4 mt-1">
                                    <p className="text-2xl font-bold text-red-500">{`$${insight.pnlImpact.toFixed(2)}`}</p>
                                    <p className="text-xs text-slate-500 dark:text-slate-400">across {insight.count} trades</p>
                                </div>
                                <p className="text-xs text-slate-600 dark:text-slate-300 italic mt-2">"{insight.insight}"</p>
                            </div>
                        ))}
                    </div>
                ) : (
                     <p className="mt-4 text-center text-sm text-slate-500 dark:text-slate-400">No significant negative patterns detected, or not enough data to analyze. Keep journaling!</p>
                )}
            </div>

            {(planFollowedStats.total > 0 || planNotFollowedStats.total > 0) &&
                <DisciplineImpactCard followedStats={planFollowedStats} notFollowedStats={planNotFollowedStats} />
            }
            
            {performanceByEmotion.length > 0 &&
                <BreakdownCard title="Performance by Emotion" data={performanceByEmotion} dataKeyName="Emotion" />
            }
        </div>
    );
};

const AIInsights: React.FC = () => {
    const { trades } = useAppContext();
    const [question, setQuestion] = useState('');
    const [insight, setInsight] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const insightEndRef = useRef<HTMLDivElement>(null);

    const presetQuestions = [
        "What are my biggest strengths?",
        "What's my most common mistake?",
        "When is my best time to trade?",
        "Which instrument am I best at trading?",
    ];

    const handleAskQuestion = async (q: string) => {
        if (!q.trim() || isLoading) return;
        setQuestion(q);
        setIsLoading(true);
        setError('');
        setInsight(null);
        try {
            const result = await getAIInsight(q, trades);
            setInsight(result);
        } catch (err: unknown) {
            if (err instanceof Error) {
                setError(err.message);
            } else {
                setError('An unknown error occurred while fetching insights.');
            }
        } finally {
            setIsLoading(false);
        }
    };
    
    useEffect(() => {
        if(insight || error){
            insightEndRef.current?.scrollIntoView({ behavior: 'smooth' });
        }
    }, [insight, error]);

    return (
        <div className="bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-white/10 p-6 rounded-xl shadow-lg max-w-3xl mx-auto">
            <div className="text-center">
                <LightbulbIcon className="w-12 h-12 text-accent-500 mx-auto" />
                <h2 className="text-2xl font-bold mt-4 text-slate-900 dark:text-white">AI-Powered Insights</h2>
                <p className="text-slate-500 dark:text-slate-400 mt-2">Ask anything about your trading performance. The AI will analyze your journal data to find patterns and provide actionable feedback.</p>
            </div>

            <div className="mt-6 space-y-4">
                <div className="flex flex-wrap justify-center gap-2">
                    {presetQuestions.map(q => (
                        <button key={q} onClick={() => handleAskQuestion(q)} className="px-3 py-1.5 text-sm bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-full hover:bg-slate-300 dark:hover:bg-slate-600 transition-colors">
                            {q}
                        </button>
                    ))}
                </div>
                <form onSubmit={(e) => { e.preventDefault(); handleAskQuestion(question); }} className="flex items-center gap-2">
                    <input
                        type="text"
                        value={question}
                        onChange={e => setQuestion(e.target.value)}
                        placeholder="Or ask your own question..."
                        className="w-full bg-slate-100 dark:bg-slate-700/50 p-3 rounded-lg border border-slate-300 dark:border-white/10 focus:ring-2 focus:ring-accent-500"
                    />
                    <button type="submit" disabled={isLoading} className="p-3 bg-accent-600 text-white rounded-lg hover:bg-accent-700 disabled:opacity-50">
                        <SendIcon />
                    </button>
                </form>
            </div>

            {(isLoading || insight || error) && (
                <div className="mt-6 pt-6 border-t border-slate-200 dark:border-white/10">
                    {isLoading && <div className="text-center">Analyzing your data...</div>}
                    {error && <div className="text-red-500 bg-red-500/10 p-3 rounded-md">{error}</div>}
                    {insight && (
                        <div className="prose prose-sm dark:prose-invert max-w-none" dangerouslySetInnerHTML={{ __html: insight.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>').replace(/\n/g, '<br />') }}></div>
                    )}
                    <div ref={insightEndRef} />
                </div>
            )}
        </div>
    );
};

const CostAnalysis: React.FC = () => {
    const { trades, accounts, theme } = useAppContext();
    const [selectedAccountId, setSelectedAccountId] = useState('all');
    const [timeframe, setTimeframe] = useState('all');

    const filteredTrades = useMemo(() => {
        let actualTrades = trades
            .filter(t => t.trade_taken)
            .sort((a,b) => new Date(a.exit_timestamp).getTime() - new Date(b.exit_timestamp).getTime());
            
        let dateFiltered = actualTrades;
        if (timeframe !== 'all') {
            const days = parseInt(timeframe);
            const cutoffDate = new Date(new Date().setDate(new Date().getDate() - days));
            dateFiltered = actualTrades.filter(t => t.exit_timestamp >= cutoffDate);
        }
        if (selectedAccountId === 'all') return dateFiltered;
        return dateFiltered.filter(t => t.account_id === selectedAccountId);
    }, [trades, selectedAccountId, timeframe]);

    const costData = useMemo(() => {
        let cumulativeGrossPnl = 0;
        let cumulativeNetPnl = 0;
        const equityCurve = filteredTrades.map(trade => {
            const costs = (trade.commission || 0) + (trade.swap || 0);
            const grossPnl = trade.pnl + costs;
            cumulativeGrossPnl += grossPnl;
            cumulativeNetPnl += trade.pnl;
            return {
                date: new Date(trade.exit_timestamp).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
                cumulativeGrossPnl,
                cumulativeNetPnl,
            };
        });

        const byInstrument: {[key: string]: { trades: number, commissions: number, swaps: number, grossPnl: number, netPnl: number }} = {};
        filteredTrades.forEach(t => {
            if (!byInstrument[t.instrument]) byInstrument[t.instrument] = { trades: 0, commissions: 0, swaps: 0, grossPnl: 0, netPnl: 0 };
            const costs = (t.commission || 0) + (t.swap || 0);
            byInstrument[t.instrument].trades++;
            byInstrument[t.instrument].commissions += (t.commission || 0);
            byInstrument[t.instrument].swaps += (t.swap || 0);
            byInstrument[t.instrument].grossPnl += t.pnl + costs;
            byInstrument[t.instrument].netPnl += t.pnl;
        });
        
        const costByInstrument = Object.entries(byInstrument).map(([name, data]) => ({
            name,
            trades: data.trades,
            commissions: data.commissions,
            swaps: data.swaps,
            totalCosts: data.commissions + data.swaps,
            grossPnl: data.grossPnl,
            netPnl: data.netPnl
        })).sort((a,b) => b.totalCosts - a.totalCosts);

        const totalGrossPnl = cumulativeGrossPnl;
        const totalNetPnl = cumulativeNetPnl;
        const totalCosts = totalGrossPnl - totalNetPnl;
        
        return { equityCurve, costByInstrument, totalGrossPnl, totalNetPnl, totalCosts };
    }, [filteredTrades]);
    
    const netPnlStroke = costData.totalNetPnl >= 0 ? '#22c55e' : '#ef4444';

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
                <div className="flex items-center gap-2 bg-slate-200 dark:bg-slate-800 p-1 rounded-md">
                    {['all', '90', '30'].map(t => (
                        <button key={t} onClick={() => setTimeframe(t)} className={`px-3 py-1 text-sm font-medium rounded ${timeframe === t ? 'bg-white dark:bg-slate-700 shadow text-slate-900 dark:text-white' : 'text-slate-500 dark:text-slate-400'}`}>
                            {t === 'all' ? 'All Time' : `Last ${t} Days`}
                        </button>
                    ))}
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <StatCard title="Gross P/L" value={`$${costData.totalGrossPnl.toFixed(2)}`} icon={<div />} />
                <StatCard title="Total Costs" value={`-$${costData.totalCosts.toFixed(2)}`} icon={<TagIcon />} />
                <StatCard title="Net P/L" value={`$${costData.totalNetPnl.toFixed(2)}`} icon={<div />} />
            </div>

            <div className="bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-white/10 p-4 sm:p-6 rounded-xl shadow-lg h-[26rem]">
                <h3 className="text-lg font-semibold mb-4 text-slate-900 dark:text-white">Gross vs. Net Equity Curve</h3>
                <ResponsiveContainer width="100%" height="90%">
                    <AreaChart data={costData.equityCurve} margin={{ top: 5, right: 20, left: -15, bottom: 0 }}>
                         <defs>
                            <linearGradient id="grossFill" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.4}/>
                                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                            </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke={theme === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)'} />
                        <XAxis dataKey="date" stroke={theme === 'dark' ? '#94a3b8' : '#64748b'} tick={{fontSize: 12}} />
                        <YAxis stroke={theme === 'dark' ? '#94a3b8' : '#64748b'} tick={{fontSize: 12}} />
                        <Tooltip contentStyle={theme === 'dark' ? { backgroundColor: 'rgba(15, 23, 42, 0.8)', border: '1px solid rgba(255,255,255,0.2)' } : {}} formatter={(value: number) => `$${value.toFixed(2)}`} />
                        <Area type="monotone" dataKey="cumulativeGrossPnl" name="Gross P/L" stroke="#3b82f6" strokeWidth={2} fillOpacity={1} fill="url(#grossFill)" />
                        <Line type="monotone" dataKey="cumulativeNetPnl" name="Net P/L" stroke={netPnlStroke} strokeWidth={2.5} dot={false} />
                    </AreaChart>
                </ResponsiveContainer>
            </div>
            
             <div className="bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-white/10 p-4 sm:p-6 rounded-xl shadow-lg">
                <h3 className="text-lg font-semibold mb-4 text-slate-900 dark:text-white">Cost Breakdown by Instrument</h3>
                 <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                        <thead>
                            <tr className="border-b border-slate-200 dark:border-white/10 text-xs text-slate-500 dark:text-slate-400 uppercase">
                                <th className="p-2">Instrument</th>
                                <th className="p-2 text-right">Trades</th>
                                <th className="p-2 text-right">Commissions</th>
                                <th className="p-2 text-right">Swaps</th>
                                <th className="p-2 text-right">Total Costs</th>
                                <th className="p-2 text-right">Net P/L</th>
                            </tr>
                        </thead>
                        <tbody>
                            {costData.costByInstrument.map(item => (
                                <tr key={item.name} className="border-b border-slate-200 dark:border-white/10">
                                    <td className="p-2 font-medium text-slate-800 dark:text-slate-200">{item.name}</td>
                                    <td className="p-2 text-right text-slate-500 dark:text-slate-400">{item.trades}</td>
                                    <td className="p-2 text-right text-slate-500 dark:text-slate-400">-${item.commissions.toFixed(2)}</td>
                                    <td className="p-2 text-right text-slate-500 dark:text-slate-400">-${item.swaps.toFixed(2)}</td>
                                    <td className="p-2 text-right font-semibold text-orange-500">-${item.totalCosts.toFixed(2)}</td>
                                    <td className={`p-2 text-right font-semibold ${item.netPnl >= 0 ? 'text-accent-500' : 'text-red-500'}`}>{item.netPnl.toFixed(2)}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                 </div>
            </div>
        </div>
    );
};


const Analytics: React.FC<{ activeSubView: View }> = ({ activeSubView }) => {
    
    const renderContent = () => {
        switch (activeSubView) {
            case 'analytics-overview':
                return <AnalyticsOverview />;
            case 'analytics-performance-breakdown':
                return <PerformanceBreakdown />;
            case 'analytics-psychology-behavior':
                return <PsychologyBehavior />;
            case 'analytics-ai-insights':
                return <AIInsights />;
            case 'analytics-cost-analysis':
                return <CostAnalysis />;
            default:
                return <AnalyticsOverview />;
        }
    };

    return (
        <div>
            {renderContent()}
        </div>
    );
};

export default Analytics;