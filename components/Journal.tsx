import React, { useState, useMemo } from 'react';
import { useAppContext } from '../context';
import { Trade } from '../types';
import { TradeImportModal } from './TradeComponents';
import { MicrophoneIcon, SmileyIcon, UploadIcon } from './Icons';

const JournalEntryCard: React.FC<{ trade: Trade; onClick: () => void, className?: string; style?: React.CSSProperties; }> = ({ trade, onClick, className, style }) => {
    const isProfit = trade.pnl >= 0;

    const biasTag = trade.tags.find(tag => tag === 'Bullish' || tag === 'Bearish');
    
    const pnlColorClass = trade.trade_taken ? (isProfit ? 'border-accent-500' : 'border-red-500') : 'border-blue-500';

    return (
        <div 
            className={`bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-xl shadow-lg shadow-slate-200/20 dark:shadow-black/20 p-4 cursor-pointer hover:shadow-xl hover:border-accent-500/50 transition-all relative border-l-4 transform hover:-translate-y-1 ${pnlColorClass} ${className}`}
            onClick={onClick}
            style={style}
            aria-label={`View details for ${trade.instrument} entry`}
        >
            <div className="flex justify-between items-start">
                <div>
                    <p className="font-bold text-lg text-slate-900 dark:text-white flex items-center gap-2">
                        {trade.instrument}
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">{trade.exit_timestamp.toLocaleDateString()}</p>
                </div>
                <div className="text-right flex flex-col items-end gap-1">
                    {trade.trade_taken ? (
                        <p className={`font-semibold text-lg ${isProfit ? 'text-accent-500' : 'text-red-500'}`}>
                            {isProfit ? '+' : ''}${trade.pnl.toFixed(2)}
                        </p>
                    ) : (
                        <span className="px-2 py-1 text-xs font-bold rounded-full bg-blue-500 text-white">
                            OBSERVATION
                        </span>
                    )}
                    {trade.trade_taken && biasTag && <span className={`px-2 py-0.5 text-xs rounded-full ${biasTag === 'Bullish' ? 'bg-green-500/20 text-green-300' : 'bg-red-500/20 text-red-300'}`}>{biasTag}</span>}
                </div>
            </div>
            <div className="mt-4">
                <p className="text-sm text-slate-600 dark:text-slate-300 line-clamp-2">
                    {trade.notes || <span className="italic text-slate-400 dark:text-slate-500">No notes for this entry.</span>}
                </p>
            </div>
            <div className="flex items-center justify-between mt-4">
                <div className="flex flex-wrap gap-1.5">
                    {trade.tags.slice(0, 3).map(tag => (
                        <span key={tag} className="px-2.5 py-0.5 text-xs font-medium bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-full">{tag}</span>
                    ))}
                </div>
                 <div className="flex items-center gap-2">
                    {trade.audio_note_url && <MicrophoneIcon className="w-4 h-4 text-slate-400" aria-label="Audio note attached" />}
                    {trade.emotion_during_trade && <SmileyIcon className="w-4 h-4 text-slate-400" aria-label="Emotion logged" />}
                </div>
            </div>
        </div>
    );
};


const Journal: React.FC = () => {
    const { trades, setSelectedTrade } = useAppContext();
    const [isImportModalOpen, setIsImportModalOpen] = useState(false);

    const sortedTrades = [...trades].sort((a, b) => b.exit_timestamp.getTime() - a.exit_timestamp.getTime());

    const actualTradesCount = useMemo(() => trades.filter(t => t.trade_taken).length, [trades]);
    const observationsCount = useMemo(() => trades.filter(t => !t.trade_taken).length, [trades]);


    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
                <div>
                    <h2 className="text-3xl font-bold text-slate-900 dark:text-white">
                        My Journal
                    </h2>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                        {actualTradesCount} {actualTradesCount === 1 ? 'Trade' : 'Trades'} &bull; {observationsCount} {observationsCount === 1 ? 'Observation' : 'Observations'}
                    </p>
                </div>
                <button 
                    onClick={() => setIsImportModalOpen(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-md text-sm font-semibold text-slate-800 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700/80 self-start sm:self-center transition-colors"
                >
                    <UploadIcon className="w-4 h-4"/>
                    Import Trades
                </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {sortedTrades.map((trade, index) => (
                    <JournalEntryCard 
                        key={trade.id}
                        trade={trade}
                        onClick={() => setSelectedTrade(trade)}
                        className="animate-fade-in-up"
                        style={{ animationDelay: `${index * 50}ms` }}
                    />
                ))}
            </div>
            {isImportModalOpen && <TradeImportModal onClose={() => setIsImportModalOpen(false)} />}
        </div>
    );
};

export default Journal;