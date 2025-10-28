

import React from 'react';
import { useAppContext } from '../context';

export const TradesTable: React.FC = () => {
    const { trades, setSelectedTrade } = useAppContext();

    return (
        <div className="bg-white/80 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-xl shadow-lg shadow-slate-200/20 dark:shadow-black/20 p-6">
            <h2 className="text-2xl font-bold mb-4 text-slate-900 dark:text-white">All Trades</h2>
            <div className="overflow-x-auto">
                <table className="w-full text-left">
                    <thead>
                        <tr className="border-b border-slate-200 dark:border-slate-800 text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                            <th className="p-4">Instrument</th>
                            <th className="p-4">P/L</th>
                            <th className="p-4 hidden md:table-cell">Date</th>
                            <th className="p-4 hidden sm:table-cell">Tags</th>
                        </tr>
                    </thead>
                    <tbody>
                        {trades.map((trade, index) => {
                            const isProfit = trade.pnl >= 0;
                            return (
                                <tr 
                                    key={trade.id} 
                                    onClick={() => setSelectedTrade(trade)} 
                                    className="border-b border-slate-200 dark:border-slate-800 hover:bg-slate-100/50 dark:hover:bg-slate-800/50 cursor-pointer transition-colors duration-200 animate-fade-in-up"
                                    style={{ animationDelay: `${index * 30}ms` }}
                                >
                                    <td className="p-4 font-semibold text-slate-900 dark:text-white">{trade.instrument}</td>
                                    <td className={`p-4 font-semibold ${isProfit ? 'text-accent-500' : 'text-red-500'}`}>
                                        <div className="flex items-center gap-2">
                                            <div className={`w-2 h-2 rounded-full ${isProfit ? 'bg-accent-500' : 'bg-red-500'}`}></div>
                                            <span>{isProfit ? '+' : ''}${trade.pnl.toFixed(2)}</span>
                                        </div>
                                    </td>
                                    <td className="p-4 text-sm text-slate-500 dark:text-slate-400 hidden md:table-cell">{trade.exit_timestamp.toLocaleDateString()}</td>
                                    <td className="p-4 hidden sm:table-cell">
                                        <div className="flex flex-wrap gap-1.5">
                                            {trade.tags.slice(0, 2).map(tag => (
                                                <span key={tag} className="px-2.5 py-0.5 text-xs font-medium bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-full">{tag}</span>
                                            ))}
                                        </div>
                                    </td>
                                </tr>
                            )
                        })}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export const TradeManagement: React.FC = () => {
    return <TradesTable />;
};