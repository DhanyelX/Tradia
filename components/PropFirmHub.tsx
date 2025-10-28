import React, { useState, useMemo, useEffect } from 'react';
import { useAppContext } from '../context';
import { Account } from '../types';
import { BriefcaseIcon, CheckCircleIcon, LightbulbIcon, TrendingUpIcon, TrendingDownIcon, FlagIcon } from './Icons';
import { getPropFirmCopilotInsight } from '../services/geminiService';

const isToday = (someDate: Date) => {
    const today = new Date();
    return someDate.getDate() === today.getDate() &&
        someDate.getMonth() === today.getMonth() &&
        someDate.getFullYear() === today.getFullYear();
};

const SingleAccountView: React.FC<{ account: Account, trades: any[] }> = ({ account, trades }) => {
    const { theme } = useAppContext();
    const [aiInsight, setAiInsight] = useState<string | null>(null);
    const [isLoadingInsight, setIsLoadingInsight] = useState(true);

    const metrics = useMemo(() => {
        if (!account.rules) return null;

        const { balance, initial_balance, rules } = account;
        
        const overallDrawdownLimit = initial_balance * (rules.max_overall_drawdown / 100);
        const currentOverallDrawdown = Math.max(0, initial_balance - balance);
        const overallDrawdownPercent = overallDrawdownLimit > 0 ? (currentOverallDrawdown / overallDrawdownLimit) * 100 : 0;

        const accountTradesToday = trades.filter(t => t.account_id === account.id && t.trade_taken && isToday(new Date(t.exit_timestamp)));
        const pnlToday = accountTradesToday.reduce((sum, t) => sum + t.pnl, 0);
        const dailyDrawdownLimit = initial_balance * (rules.max_daily_drawdown / 100);
        const currentDailyDrawdown = pnlToday < 0 ? Math.abs(pnlToday) : 0;
        const dailyDrawdownPercent = dailyDrawdownLimit > 0 ? (currentDailyDrawdown / dailyDrawdownLimit) * 100 : 0;

        const profitMade = Math.max(0, balance - initial_balance);
        const profitTargetAmount = rules.profit_target - initial_balance;
        const profitTargetProgress = profitTargetAmount > 0 ? (profitMade / profitTargetAmount) * 100 : (profitMade > 0 ? 100 : 0);

        const uniqueTradingDays = new Set(trades.filter(t => t.account_id === account.id && t.trade_taken).map(t => new Date(t.exit_timestamp).toDateString())).size;
        
        return {
            overallDrawdownLimit, currentOverallDrawdown, overallDrawdownPercent: Math.min(100, overallDrawdownPercent),
            dailyDrawdownLimit, currentDailyDrawdown, dailyDrawdownPercent: Math.min(100, dailyDrawdownPercent),
            profitMade, profitTargetAmount, profitTargetProgress: Math.min(100, profitTargetProgress),
            uniqueTradingDays,
        };
    }, [account, trades]);

    const dailyRisks = useMemo(() => {
        const risks: string[] = [];
        if(metrics){
            if (metrics.dailyDrawdownPercent > 70 && metrics.dailyDrawdownPercent < 100) {
                risks.push(`Approaching daily drawdown limit (${metrics.dailyDrawdownPercent.toFixed(0)}% used).`);
            }
            if (metrics.overallDrawdownPercent > 70 && metrics.overallDrawdownPercent < 100) {
                risks.push(`Approaching max drawdown limit (${metrics.overallDrawdownPercent.toFixed(0)}% used).`);
            }
        }
        return risks;
    }, [metrics]);

    useEffect(() => {
        const fetchInsight = async () => {
            setIsLoadingInsight(true);
            try {
                const insight = await getPropFirmCopilotInsight(account, trades);
                setAiInsight(insight);
            } catch (error) {
                console.error("Failed to fetch prop firm insight", error);
                setAiInsight("Could not load AI Co-pilot feed.");
            }
            setIsLoadingInsight(false);
        };
        fetchInsight();
    }, [account, trades]);
    
    if (!metrics) return null;

    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
                <div className="bg-white/80 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 p-5 rounded-xl shadow-lg">
                    <h3 className="font-semibold text-lg text-slate-900 dark:text-white mb-3 font-mono">SYSTEM.RISK_MONITOR:</h3>
                    <div className="space-y-2">
                       {dailyRisks.length > 0 ? dailyRisks.map((risk, i) => (
                           <div key={i} className="flex items-start gap-3 bg-yellow-500/10 dark:bg-yellow-900/50 border border-yellow-500/20 dark:border-yellow-500/30 text-yellow-700 dark:text-yellow-300 p-3 rounded-md text-sm">
                               <span className="font-bold text-yellow-600 dark:text-yellow-400 pt-0.5">⚠️</span>
                               <span className="font-mono">{risk}</span>
                           </div>
                       )) : (
                           <div className="flex items-start gap-3 bg-green-500/10 dark:bg-green-900/50 border border-green-500/20 dark:border-green-500/30 text-green-700 dark:text-green-300 p-3 rounded-md text-sm">
                               <span className="font-bold text-green-600 dark:text-green-400 pt-0.5">✅</span>
                               <span className="font-mono">No major risks detected. All systems nominal. Trade your plan.</span>
                           </div>
                       )}
                    </div>
                </div>
                 <div className="bg-white/80 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 p-5 rounded-xl shadow-lg">
                    <h3 className="font-semibold text-lg text-slate-900 dark:text-white mb-3 flex items-center gap-2 font-mono"><LightbulbIcon/> A.I. COPILOT_FEED:</h3>
                     {isLoadingInsight ? (
                        <div className="space-y-3 p-4">
                            <div className="h-4 w-full rounded bg-slate-200 dark:bg-slate-700/50 animate-pulse"></div>
                            <div className="h-4 w-3/4 rounded bg-slate-200 dark:bg-slate-700/50 animate-pulse"></div>
                            <div className="h-4 w-full rounded bg-slate-200 dark:bg-slate-700/50 animate-pulse"></div>
                        </div>
                    ) : (
                        <div className="prose prose-sm dark:prose-invert prose-p:font-mono" dangerouslySetInnerHTML={{ __html: aiInsight?.replace(/\n/g, '<br />') || ''}}></div>
                    )}
                </div>
            </div>
            <div className="bg-white/80 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 p-5 rounded-xl shadow-lg">
                <h3 className="font-semibold text-lg text-slate-900 dark:text-white mb-4 font-mono">OBJECTIVES_TRACKING:</h3>
                <div className="space-y-5">
                    <RuleItem 
                        label="Profit Target"
                        isMet={metrics.profitTargetProgress >= 100}
                        value={`$${(account.rules.profit_target - account.initial_balance).toLocaleString()}`}
                        progress={metrics.profitTargetProgress}
                        progressText={`$${metrics.profitMade.toLocaleString()}`}
                    />
                     <RuleItem 
                        label="Max Daily DD"
                        isMet={metrics.dailyDrawdownPercent < 100}
                        value={`${account.rules.max_daily_drawdown}% ($${metrics.dailyDrawdownLimit.toLocaleString()})`}
                        progress={metrics.dailyDrawdownPercent}
                        progressText={`$${metrics.currentDailyDrawdown.toLocaleString()}`}
                        isLoss
                    />
                     <RuleItem 
                        label="Max Overall DD"
                        isMet={metrics.overallDrawdownPercent < 100}
                        value={`${account.rules.max_overall_drawdown}% ($${metrics.overallDrawdownLimit.toLocaleString()})`}
                        progress={metrics.overallDrawdownPercent}
                        progressText={`$${metrics.currentOverallDrawdown.toLocaleString()}`}
                        isLoss
                    />
                     <RuleItem 
                        label="Min. Trading Days"
                        isMet={metrics.uniqueTradingDays >= account.rules.min_trading_days}
                        value={`${account.rules.min_trading_days} days`}
                        progress={(metrics.uniqueTradingDays / account.rules.min_trading_days) * 100}
                        progressText={`${metrics.uniqueTradingDays} days`}
                    />
                    {account.rules.max_trading_days && (
                        <RuleItem
                            label="Max. Trading Days"
                            isMet={metrics.uniqueTradingDays <= account.rules.max_trading_days}
                            value={`${account.rules.max_trading_days} days`}
                            progress={(metrics.uniqueTradingDays / account.rules.max_trading_days) * 100}
                            progressText={`${metrics.uniqueTradingDays} days`}
                            isLoss
                        />
                    )}
                </div>
            </div>
        </div>
    );
};

const AllAccountsOverview: React.FC<{ accounts: Account[], trades: any[] }> = ({ accounts, trades }) => {
    const { totalBalance, totalPnl } = useMemo(() => {
        let totalBalance = 0;
        let totalInitialBalance = 0;
        accounts.forEach(acc => {
            totalBalance += acc.balance;
            totalInitialBalance += acc.initial_balance;
        });
        const totalPnl = totalBalance - totalInitialBalance;
        return { totalBalance, totalPnl };
    }, [accounts]);

    return (
        <div className="space-y-6">
             <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-white/80 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 p-5 rounded-xl shadow-lg">
                    <h3 className="font-semibold text-slate-500 dark:text-slate-400">Total Prop Firm Equity</h3>
                    <p className="text-3xl font-bold font-mono text-slate-900 dark:text-white mt-2">${totalBalance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                </div>
                <div className="bg-white/80 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 p-5 rounded-xl shadow-lg">
                    <h3 className="font-semibold text-slate-500 dark:text-slate-400">Total Net P/L</h3>
                    <p className={`text-3xl font-bold font-mono mt-2 ${totalPnl >= 0 ? 'text-green-500' : 'text-red-500'}`}>{totalPnl >= 0 ? '+' : ''}${totalPnl.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {accounts.map(account => <AccountSummaryCard key={account.id} account={account} trades={trades} />)}
            </div>
        </div>
    );
};

const AccountSummaryCard: React.FC<{account: Account, trades: any[]}> = ({ account, trades }) => {
     const { balance, initial_balance, rules } = account;
     const profitMade = balance - initial_balance;
     const profitTargetAmount = rules ? rules.profit_target - initial_balance : 0;
     const profitTargetProgress = profitTargetAmount > 0 ? Math.min(100, (profitMade / profitTargetAmount) * 100) : (profitMade > 0 ? 100 : 0);
     
     const overallDrawdownLimit = rules ? initial_balance * (rules.max_overall_drawdown / 100) : 0;
     const currentOverallDrawdown = Math.max(0, initial_balance - balance);
     const overallDrawdownPercent = overallDrawdownLimit > 0 ? Math.min(100, (currentOverallDrawdown / overallDrawdownLimit) * 100) : 0;

    return (
        <div className="bg-white/80 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 p-4 rounded-xl shadow-lg">
            <h4 className="font-bold text-slate-900 dark:text-white">{account.name}</h4>
            <p className="text-xs text-slate-500 dark:text-slate-400">{account.prop_firm_name} - {account.stage} {account.phase || ''}</p>
            <p className="text-2xl font-mono font-bold text-slate-800 dark:text-slate-200 my-2">${balance.toLocaleString()}</p>
            <div className="space-y-2 text-xs">
                <div>
                    <div className="flex justify-between mb-1">
                        <span>Profit Target</span>
                        <span className="font-semibold">{profitTargetProgress.toFixed(1)}%</span>
                    </div>
                    <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2"><div className="bg-green-500 h-2 rounded-full" style={{width: `${profitTargetProgress}%`}}></div></div>
                </div>
                 <div>
                    <div className="flex justify-between mb-1">
                        <span>Max Drawdown Used</span>
                        <span className="font-semibold">{overallDrawdownPercent.toFixed(1)}%</span>
                    </div>
                    <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2"><div className="bg-red-500 h-2 rounded-full" style={{width: `${overallDrawdownPercent}%`}}></div></div>
                </div>
            </div>
        </div>
    );
};


const PropFirmHub: React.FC = () => {
    const { accounts, trades, theme } = useAppContext();
    const propFirmAccounts = useMemo(() => accounts.filter(acc => acc.type === 'Prop Firm' && acc.rules), [accounts]);
    const [selectedAccountId, setSelectedAccountId] = useState<string | 'all'>('all');

    useEffect(() => {
        // If the selected account ID is no longer in the list of prop firm accounts,
        // reset to the 'all' overview to prevent a blank screen.
        if (selectedAccountId !== 'all' && !propFirmAccounts.some(acc => acc.id === selectedAccountId)) {
            setSelectedAccountId('all');
        }
    }, [propFirmAccounts, selectedAccountId]);

    const selectedAccount = useMemo(() => propFirmAccounts.find(acc => acc.id === selectedAccountId), [propFirmAccounts, selectedAccountId]);

    const gridBgStyle = {
        backgroundImage: theme === 'dark'
            ? `radial-gradient(circle at 1px 1px, rgba(255,255,255,0.15) 1px, transparent 0)`
            : `radial-gradient(circle at 1px 1px, rgba(0,0,0,0.08) 1px, transparent 0)`,
        backgroundSize: `2rem 2rem`
    };

    if (propFirmAccounts.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center h-[60vh] text-center bg-white/50 dark:bg-slate-900/30 rounded-lg border-2 border-dashed border-slate-300 dark:border-slate-700">
                <BriefcaseIcon className="w-16 h-16 text-slate-400 dark:text-slate-500 mb-4" />
                <h2 className="text-2xl font-bold text-slate-700 dark:text-slate-300">No Prop Firm Accounts Found</h2>
                <p className="text-slate-500 dark:text-slate-400 mt-2 max-w-md">
                    Add a 'Prop Firm' type account in your profile to start using the hub.
                </p>
            </div>
        );
    }
    
    return (
        <div className="space-y-6 bg-slate-50 dark:bg-slate-950 p-4 sm:p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xl shadow-slate-200/50 dark:shadow-2xl dark:shadow-black/50" style={gridBgStyle}>
            <div className="bg-white/80 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 p-4 rounded-xl shadow-lg">
                <label htmlFor="account-selector" className="block text-sm font-medium text-slate-500 dark:text-slate-400 mb-2">Select Account View</label>
                <select 
                    id="account-selector"
                    value={selectedAccountId} 
                    onChange={e => setSelectedAccountId(e.target.value)}
                    className="w-full bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-white/10 rounded-md px-3 py-2 text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-accent-500 focus:border-accent-500 font-semibold"
                >
                    <option value="all">All Prop Accounts Overview</option>
                    {propFirmAccounts.map(acc => <option key={acc.id} value={acc.id}>{acc.name} ({acc.prop_firm_name})</option>)}
                </select>
            </div>
            
            {selectedAccountId === 'all' ? (
                <AllAccountsOverview accounts={propFirmAccounts} trades={trades} />
            ) : selectedAccount ? (
                <SingleAccountView account={selectedAccount} trades={trades} />
            ) : null}
        </div>
    );
};

const RuleItem: React.FC<{label: string, isMet: boolean, value: string, progress: number, progressText: string, isLoss?: boolean}> = 
({label, isMet, value, progress, progressText, isLoss}) => {
    const progressColor = isLoss ? 'bg-red-500' : 'bg-green-500';
    const Icon = isLoss ? TrendingDownIcon : FlagIcon;
    return (
        <div>
            <div className="flex justify-between items-center text-sm mb-1.5">
                <div className="flex items-center gap-2">
                     {isMet ? <CheckCircleIcon className="w-4 h-4 text-green-500 dark:text-green-400" /> : <Icon className="w-4 h-4 text-slate-500" />}
                    <span className="text-slate-700 dark:text-slate-300 font-semibold">{label}</span>
                </div>
                <span className="font-semibold text-slate-900 dark:text-white font-mono">{value}</span>
            </div>
            <div className="w-full bg-slate-200 dark:bg-slate-700/50 rounded-full h-4 relative border border-slate-300 dark:border-slate-700">
                <div className={`${progressColor} h-full rounded-full transition-all duration-500`} style={{width: `${Math.min(progress, 100)}%`}}></div>
                <span className="absolute inset-0 flex items-center justify-center text-[10px] font-bold text-white mix-blend-difference font-mono">{progressText} / {value}</span>
            </div>
        </div>
    );
};

export default PropFirmHub;