import React, { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Trade } from '../types';
import Papa from 'papaparse';
import { useAppContext } from '../context';
import { LightbulbIcon, XMarkIcon, UploadIcon, TrashIcon, StrategyInsightsIcon } from './Icons';
import { EMOTIONS, TRADE_QUALITY_COLORS } from '../constants';

export const AINoteDisplay: React.FC<{note: Trade['ai_note']}> = ({note}) => {
    if (!note) return null;
    return (
        <div className="mt-4 p-4 bg-yellow-500/10 border-l-4 border-yellow-400 text-yellow-800 dark:text-yellow-200 rounded-r-lg">
            <p className="font-semibold text-yellow-900 dark:text-yellow-300">
                <LightbulbIcon className="inline-block w-5 h-5 mr-2" />
                AI Analysis: <span className="font-normal italic">{note.summary}</span>
            </p>
            {note.strength && <p className="mt-2 text-sm"><span className="font-bold text-green-700 dark:text-green-400">Strength:</span> {note.strength}</p>}
            {note.weakness && <p className="mt-2 text-sm"><span className="font-bold text-red-600 dark:text-red-400">Weakness:</span> {note.weakness}</p>}
            {note.suggestion && <p className="mt-2 text-sm"><span className="font-bold text-blue-600 dark:text-blue-400">Suggestion:</span> {note.suggestion}</p>}
        </div>
    )
}

const EmotionDisplay: React.FC<{label: string, emotionName?: string}> = ({ label, emotionName }) => {
    if (!emotionName) return null;
    const emotion = EMOTIONS.find(e => e.name === emotionName);
    if (!emotion) return null;

    return (
        <div className="flex items-center gap-2">
            <span className="text-slate-500 dark:text-slate-400">{label}:</span>
            <div className="flex items-center gap-2 px-2 py-1 rounded-full bg-slate-100 dark:bg-slate-700">
                <span className="text-lg">{emotion.emoji}</span>
                <span className="text-sm font-medium text-slate-800 dark:text-slate-200">{emotion.name}</span>
            </div>
        </div>
    );
};

const InfoItem: React.FC<{label: string; children: React.ReactNode; className?: string}> = ({label, children, className}) => (
    <div className={`bg-slate-100 dark:bg-slate-800/50 p-3 rounded-lg ${className}`}>
        <p className="text-xs text-slate-500 dark:text-slate-400">{label}</p>
        <p className="font-semibold text-slate-800 dark:text-slate-200">{children}</p>
    </div>
);


export const TradeDetailModal: React.FC<{trade: Trade; onClose: () => void}> = ({ trade, onClose }) => {
    const { deleteTrade, strategies } = useAppContext();
    const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
    const [portalContainer, setPortalContainer] = useState<Element | null>(null);

    useEffect(() => {
        setPortalContainer(document.getElementById('modal-portal'));
    }, []);

    const isProfit = trade.pnl >= 0;

    const strategy = useMemo(() => {
        return strategies.find(s => s.id === trade.strategy_id);
    }, [strategies, trade.strategy_id]);

    const handleDelete = async () => {
        await deleteTrade(trade.id);
        setIsDeleteConfirmOpen(false);
        onClose();
    };

    const modalContent = (
        <>
            <div 
                className="fixed inset-0 bg-black bg-opacity-70 backdrop-blur-sm grid place-items-center z-50 p-4 animate-fade-in"
                onClick={(e: React.MouseEvent<HTMLDivElement>) => {
                    if (e.target === e.currentTarget) {
                        onClose();
                    }
                }}
            >
                <div className="bg-white dark:bg-slate-800 rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6 relative border border-slate-200 dark:border-slate-700 animate-fade-in-up">
                    <button onClick={onClose} className="absolute top-4 right-4 p-1 rounded-full text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-700"><XMarkIcon /></button>
                    <div className="flex items-center gap-4 mb-4">
                        <h2 className="text-2xl font-bold text-slate-900 dark:text-white">{trade.instrument}</h2>
                        {trade.trade_taken ? (
                            <span className={`px-2.5 py-1 text-xs font-bold rounded-full ${isProfit ? 'bg-accent-500/20 text-accent-400' : 'bg-red-500/20 text-red-400'}`}>
                                {isProfit ? 'WIN' : 'LOSS'}
                            </span>
                        ) : (
                            <span className="px-2.5 py-1 text-xs font-bold rounded-full bg-blue-500/20 text-blue-400">
                                OBSERVATION
                            </span>
                        )}
                    </div>
                    {trade.trade_taken && (
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm mb-4">
                            <InfoItem label="P/L"><span className={isProfit ? 'text-accent-500' : 'text-red-500'}>${trade.pnl.toFixed(2)}</span></InfoItem>
                            <InfoItem label="R/R Multiple">{trade.rr.toFixed(2)}R</InfoItem>
                            <InfoItem label="Entry">{trade.entry}</InfoItem>
                            <InfoItem label="Exit">{trade.exit}</InfoItem>
                            {typeof trade.followed_plan === 'boolean' && (
                                <InfoItem label="Followed Plan">
                                    <span className={trade.followed_plan ? 'text-green-500' : 'text-red-500'}>
                                        {trade.followed_plan ? 'Yes' : 'No'}
                                    </span>
                                </InfoItem>
                            )}
                            {trade.trade_quality && (
                                <InfoItem label="Quality">
                                    <span className={`inline-block text-center font-bold text-xs rounded-full h-5 w-5 leading-5 ${TRADE_QUALITY_COLORS[trade.trade_quality]}`}>
                                        {trade.trade_quality}
                                    </span>
                                </InfoItem>
                            )}
                        </div>
                    )}

                    {strategy && (
                        <div className="mb-4">
                             <InfoItem label="Strategy Playbook" className="!bg-accent-500/10">
                                 <div className="flex items-center gap-2 text-accent-700 dark:text-accent-300">
                                    <StrategyInsightsIcon className="w-4 h-4" />
                                    <span>{strategy.name}</span>
                                 </div>
                            </InfoItem>
                        </div>
                    )}
                    
                    {trade.notes && <div className="mb-4"><p className="text-slate-500 dark:text-slate-400 mb-1">Notes:</p><p className="bg-slate-100 dark:bg-slate-700/50 p-3 rounded-md prose prose-sm dark:prose-invert max-w-none">{trade.notes}</p></div>}
                    
                    {trade.audio_note_url && (
                        <div className="mb-4">
                            <p className="text-slate-500 dark:text-slate-400 mb-2">Audio Note:</p>
                            <audio controls src={trade.audio_note_url} className="w-full">
                                Your browser does not support the audio element.
                            </audio>
                        </div>
                    )}
                    
                    {(trade.emotion_during_trade || trade.emotion_after_trade) && (
                        <div className="mb-4 space-y-2">
                            <p className="text-slate-500 dark:text-slate-400">Emotions:</p>
                            <div className="flex flex-wrap gap-4">
                            <EmotionDisplay label="During" emotionName={trade.emotion_during_trade} />
                            <EmotionDisplay label="After" emotionName={trade.emotion_after_trade} />
                            </div>
                        </div>
                    )}

                    {trade.tags.length > 0 && <div className="flex flex-wrap gap-2 mb-4">
                        {trade.tags.map(tag => <span key={tag} className="px-2.5 py-1 text-xs font-medium bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-full">{tag}</span>)}
                    </div>}
                    
                    <AINoteDisplay note={trade.ai_note} />

                    {trade.screenshot_url && (
                        <div className="mt-4">
                            <h4 className="text-slate-500 dark:text-slate-400 mb-2">Screenshot:</h4>
                            <img src={trade.screenshot_url} alt="Trade screenshot" className="rounded-lg max-w-full h-auto border border-slate-200 dark:border-slate-700" />
                        </div>
                    )}

                    {/* Action buttons at the end */}
                    <div className="mt-6 pt-4 border-t border-slate-200 dark:border-slate-700 flex justify-between items-center">
                        <button
                            onClick={() => setIsDeleteConfirmOpen(true)}
                            className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-red-600 dark:text-red-500 rounded-md hover:bg-red-500/10 transition-colors"
                        >
                            <TrashIcon className="w-4 h-4" />
                            Delete Entry
                        </button>
                    </div>

                </div>
            </div>
            
            {isDeleteConfirmOpen && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-[60] p-4 animate-fade-in" onClick={() => setIsDeleteConfirmOpen(false)}>
                    <div className="bg-white dark:bg-slate-800 rounded-lg shadow-xl w-full max-w-sm p-6 text-center animate-fade-in-up" onClick={e => e.stopPropagation()}>
                        <h3 className="text-xl font-bold text-slate-900 dark:text-white">Delete Entry?</h3>
                        <p className="text-sm text-slate-500 dark:text-slate-400 my-4">Are you sure you want to permanently delete this journal entry? This action cannot be undone.</p>
                        <div className="flex justify-center gap-4">
                            <button onClick={() => setIsDeleteConfirmOpen(false)} className="px-6 py-2 rounded-md bg-slate-200 dark:bg-slate-600 hover:bg-slate-300 dark:hover:bg-slate-500 font-semibold">
                                Cancel
                            </button>
                            <button onClick={handleDelete} className="px-6 py-2 rounded-md bg-red-600 text-white hover:bg-red-700 font-semibold">
                                Confirm Delete
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );

    if (!portalContainer) {
        return null;
    }

    return createPortal(modalContent, portalContainer);
};

type CSVRow = { [key: string]: string };
type MappedField = keyof Omit<Trade, 'id' | 'tags' | 'custom_tags' | 'ai_note'>;
type ColumnMap = { [key in MappedField]?: string };

const REQUIRED_FIELDS: MappedField[] = ['instrument', 'pnl', 'exit_timestamp', 'entry_timestamp', 'entry', 'exit'];

const parseCurrency = (value: string | undefined): number => {
    if (typeof value !== 'string' || value.trim() === '') {
        return NaN;
    }

    let cleanValue = value.trim();
    const isNegativeParentheses = cleanValue.startsWith('(') && cleanValue.endsWith(')');

    // Remove anything that's not a digit, comma, dot, or minus sign
    cleanValue = cleanValue.replace(/[^0-9.,-]/g, "");

    const lastComma = cleanValue.lastIndexOf(',');
    const lastDot = cleanValue.lastIndexOf('.');

    // Determine decimal separator and remove thousand separators
    if (lastComma > lastDot) {
        // Comma is the decimal separator (e.g., "1.234,56")
        cleanValue = cleanValue.replace(/\./g, '').replace(',', '.');
    } else {
        // Dot is the decimal separator or no separator exists (e.g., "1,234.56" or "1234")
        cleanValue = cleanValue.replace(/,/g, '');
    }

    const number = parseFloat(cleanValue);

    if (isNaN(number)) {
        return NaN;
    }
    
    if (isNegativeParentheses && number > 0) {
        return -number;
    }

    return number;
};

const parseDateString = (value: string | undefined): Date | null => {
    if (!value || typeof value !== 'string' || value.trim() === '') {
        return null;
    }

    const trimmedValue = value.trim();

    // Try to parse MT5 format "YYYY.MM.DD HH:mm:ss" or "YYYY-MM-DD HH:mm:ss"
    const mt5Match = trimmedValue.match(/^(\d{4})[.-](\d{2})[.-](\d{2})\s(\d{2}):(\d{2}):(\d{2})$/);
    if (mt5Match) {
        const [, year, month, day, hour, minute, second] = mt5Match.map(Number);
        // Date.UTC treats parameters as UTC, preventing timezone shifts during parsing. JS months are 0-indexed.
        const date = new Date(Date.UTC(year, month - 1, day, hour, minute, second));
        if (!isNaN(date.getTime())) {
            return date;
        }
    }

    // Fallback for other common formats that new Date() can handle, like ISO 8601
    const genericDate = new Date(trimmedValue);
    if (!isNaN(genericDate.getTime())) {
        return genericDate;
    }

    return null; // Return null if no valid date could be parsed
};


export const TradeImportModal: React.FC<{ onClose: () => void }> = ({ onClose }) => {
    const { addMultipleTrades, accounts } = useAppContext();
    
    const [step, setStep] = useState(1);
    const [file, setFile] = useState<File | null>(null);
    const [headers, setHeaders] = useState<string[]>([]);
    const [data, setData] = useState<CSVRow[]>([]);
    const [columnMap, setColumnMap] = useState<ColumnMap>({});
    const [isLoading, setIsLoading] = useState(false);
    const [isImporting, setIsImporting] = useState(false);
    const [importError, setImportError] = useState('');
    const [selectedAccountId, setSelectedAccountId] = useState<string>('');
    const [importProgress, setImportProgress] = useState(0);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const selectedFile = e.target.files?.[0];
        if (selectedFile) {
            setFile(selectedFile);
            setIsLoading(true);
            Papa.parse(selectedFile, {
                header: true,
                skipEmptyLines: true,
                complete: (results) => {
                    const fields = results.meta.fields || [];
                    setHeaders(fields);
                    setData(results.data as CSVRow[]);
                    
                    const newMap: ColumnMap = {};
                    fields.forEach(header => {
                        const h = header.toLowerCase().replace(/\s+/g, '');
                        if (h === 'symbol') newMap.instrument = header;
                        if (h === 'profit') newMap.pnl = header;
                        if (h === 'closetime') newMap.exit_timestamp = header;
                        if (h === 'time') newMap.entry_timestamp = header;
                        if (h === 'price') newMap.entry = header;
                        if (h === 'closeprice') newMap.exit = header;
                        if (h === 'volume') newMap.lot_size = header;
                        if (h === 'commission') newMap.commission = header;
                        if (h === 'swap') newMap.swap = header;
                        if (h === 'sl') newMap.stop_loss = header;
                        if (h === 'tp') newMap.take_profit = header;
                        if (h === 'deal') newMap.deal_id = header;
                        if (h === 'order') newMap.order_id = header;
                    });
                    setColumnMap(newMap);
                    setStep(2);
                    setIsLoading(false);
                }
            });
        }
    };

    const validatedTrades = useMemo(() => {
        if (step < 2) return [];
        return data.map(row => {
            let isValid = true;
            let errors: string[] = [];

            const parsedData: { [key: string]: any } = {};
            const fields: MappedField[] = ['instrument', 'pnl', 'exit_timestamp', 'entry_timestamp', 'entry', 'exit', 'lot_size', 'commission', 'swap', 'stop_loss', 'take_profit', 'deal_id', 'order_id'];

            fields.forEach(field => {
                const mappedHeader = columnMap[field];
                if (!mappedHeader) return;
                
                const value = row[mappedHeader];
                
                if (['pnl', 'entry', 'exit', 'lot_size', 'commission', 'swap', 'stop_loss', 'take_profit'].includes(field)) {
                    const numValue = parseCurrency(value);
                    if (!isNaN(numValue)) parsedData[field] = numValue;
                } else if (['entry_timestamp', 'exit_timestamp'].includes(field)) {
                    const dateValue = parseDateString(value);
                    if (dateValue) {
                        parsedData[field] = dateValue;
                    }
                } else {
                    parsedData[field] = value;
                }
            });

            REQUIRED_FIELDS.forEach(field => {
                if (parsedData[field] === undefined || parsedData[field] === null || (typeof parsedData[field] === 'number' && isNaN(parsedData[field]))) {
                    isValid = false;
                    errors.push(`${field} is missing or invalid.`);
                }
            });

            return { data: parsedData, isValid, errors };
        });
    }, [columnMap, data, step]);
    
    const canProceedToPreview = useMemo(() => {
        return REQUIRED_FIELDS.every(field => columnMap[field] && headers.includes(columnMap[field]!));
    }, [columnMap, headers]);

    const handleImport = async () => {
        setIsImporting(true);
        setImportError('');
        setImportProgress(0);
        
        const tradesToImport = validatedTrades
            .filter(t => t.isValid)
            .map(t => {
                const d = t.data;

                let rr = d.pnl > 0 ? 1 : (d.pnl < 0 ? -1 : 0); // Default placeholder
                if (d.entry && d.stop_loss && d.exit && d.pnl !== 0) {
                    const riskPerUnit = Math.abs(d.entry - d.stop_loss);
                    if (riskPerUnit > 0) {
                        const pnlPerUnit = Math.abs(d.exit - d.entry);
                        const calculatedRR = pnlPerUnit / riskPerUnit;
                        // Use PNL sign as the source of truth for win/loss
                        rr = d.pnl > 0 ? calculatedRR : -calculatedRR;
                    }
                }

                const tradeObject: Omit<Trade, 'id' | 'ai_note' | 'user_id'> = {
                    account_id: selectedAccountId,
                    instrument: d.instrument,
                    pnl: d.pnl,
                    entry_timestamp: d.entry_timestamp,
                    exit_timestamp: d.exit_timestamp,
                    entry: d.entry,
                    exit: d.exit,
                    rr: rr,
                    trade_taken: true,
                    notes: 'Imported via MT5 CSV.',
                    tags: ['CSV Import', 'MT5'],
                    // Include optional fields only if they exist and are valid
                    ...(d.lot_size !== undefined && { lot_size: d.lot_size }),
                    ...(d.commission !== undefined && { commission: d.commission }),
                    ...(d.swap !== undefined && { swap: d.swap }),
                    ...(d.stop_loss !== undefined && { stop_loss: d.stop_loss }),
                    ...(d.take_profit !== undefined && { take_profit: d.take_profit }),
                    ...(d.deal_id !== undefined && { deal_id: d.deal_id }),
                    ...(d.order_id !== undefined && { order_id: d.order_id }),
                };
                return tradeObject;
            });
            
        try {
            await addMultipleTrades(tradesToImport, (progress) => {
                setImportProgress(progress);
            });
            onClose();
        } catch (err: any) {
            console.error("Failed to import trades:", err);
            setImportError(err.message || 'An unknown error occurred during import. Please check the console for details.');
            setIsImporting(false);
            setImportProgress(0);
        }
    };
    
    const downloadTemplate = () => {
        const csvHeader = "Deal,Order,Time,Type,Direction,Volume,Symbol,Price,SL,TP,Close Time,Close Price,Commission,Swap,Profit\n";
        const csvExampleWin = "123456,789012,2024.01.01 10:00:00,buy,buy,0.10,EURUSD,1.10123,1.10000,1.10500,2024.01.01 15:30:00,1.10523,-1.50,0.00,40.00\n";
        const csvExampleLoss = "123457,789013,2024.01.02 09:00:00,sell,sell,0.05,GBPUSD,1.27500,1.27800,1.27000,2024.01.02 11:00:00,1.27800,-0.75,-0.25,-15.00\n";
        const csvContent = "data:text/csv;charset=utf-8," + csvHeader + csvExampleWin + csvExampleLoss;
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", "mt5_trade_template.csv");
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const renderStepContent = () => {
        switch (step) {
            case 1:
                return (
                    <div className="text-center p-8">
                        <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-4">Upload Your Trades CSV</h3>
                        <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">Import your trading history from your broker (MT5 compatible) or another platform.</p>
                        <label className="w-full max-w-sm mx-auto cursor-pointer bg-slate-100 dark:bg-slate-700/50 border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-lg p-8 flex flex-col items-center justify-center hover:border-accent-500 transition-colors">
                           <UploadIcon className="w-10 h-10 text-slate-400 dark:text-slate-500 mb-2"/>
                           <span className="text-accent-500 font-semibold">Click to upload a file</span>
                           <span className="text-xs text-slate-400 dark:text-slate-500 mt-1">or drag and drop</span>
                           <input type="file" accept=".csv" onChange={handleFileChange} className="hidden" />
                        </label>
                        <button onClick={downloadTemplate} className="text-sm text-accent-500 hover:underline mt-4">Download MT5 template.csv</button>
                    </div>
                );
            case 2:
                const mappableFields: {key: MappedField, label: string, required: boolean}[] = [
                    { key: 'instrument', label: 'Instrument (Symbol)', required: true },
                    { key: 'pnl', label: 'Profit', required: true },
                    { key: 'exit_timestamp', label: 'Close Time', required: true },
                    { key: 'entry_timestamp', label: 'Entry Time', required: true },
                    { key: 'entry', label: 'Entry Price', required: true },
                    { key: 'exit', label: 'Close Price', required: true },
                    { key: 'lot_size', label: 'Volume/Lot Size', required: false },
                    { key: 'commission', label: 'Commission', required: false },
                    { key: 'swap', label: 'Swap', required: false },
                    { key: 'stop_loss', label: 'Stop Loss (SL)', required: false },
                    { key: 'take_profit', label: 'Take Profit (TP)', required: false },
                    { key: 'deal_id', label: 'Deal ID', required: false },
                    { key: 'order_id', label: 'Order ID', required: false },
                ];
                return (
                    <div>
                        <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Map Columns</h3>
                        <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">Match the columns from your MT5 file to the required trade fields. Required fields are marked with *</p>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {mappableFields.map(({key, label, required}) => (
                                <div key={key}>
                                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">{label}{required && '*'}</label>
                                    <select
                                        value={columnMap[key] || ''}
                                        onChange={e => setColumnMap(prev => ({...prev, [key]: e.target.value }))}
                                        className="w-full bg-slate-100 dark:bg-slate-700/50 p-2 rounded-lg border border-slate-300 dark:border-slate-700"
                                    >
                                        <option value="">-- Select Column --</option>
                                        {headers.map(h => <option key={h} value={h}>{h}</option>)}
                                    </select>
                                </div>
                            ))}
                        </div>
                    </div>
                );
            case 3:
                const validCount = validatedTrades.filter(t => t.isValid).length;
                return (
                    <div>
                        <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Preview & Confirm</h3>
                        <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">Review the first few rows. We found <strong className="text-accent-500">{validCount} valid trades</strong> out of {data.length}. Only valid trades will be imported.</p>
                        
                        <div className="mb-4">
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Import to Account*</label>
                            <select
                                value={selectedAccountId}
                                onChange={e => setSelectedAccountId(e.target.value)}
                                className="w-full bg-slate-100 dark:bg-slate-700/50 p-2 rounded-lg border border-slate-300 dark:border-slate-700"
                                required
                            >
                                <option value="" disabled>-- Select an account --</option>
                                {accounts.map(acc => <option key={acc.id} value={acc.id}>{acc.name}</option>)}
                            </select>
                        </div>
                        
                        <div className="max-h-64 overflow-y-auto border border-slate-200 dark:border-slate-700 rounded-lg">
                            <table className="w-full text-sm text-left">
                                <thead className="sticky top-0 bg-slate-100 dark:bg-slate-800">
                                    <tr>
                                        <th className="p-2">Status</th>
                                        <th className="p-2">Instrument</th>
                                        <th className="p-2">P/L</th>
                                        <th className="p-2">Exit Date</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {validatedTrades.slice(0, 10).map((trade, i) => (
                                        <tr key={i} className="border-t border-slate-200 dark:border-slate-700">
                                            <td className="p-2">
                                                {trade.isValid ? <span className="px-2 py-0.5 text-xs bg-green-500/20 text-green-400 rounded-full">Valid</span> 
                                                : <span className="px-2 py-0.5 text-xs bg-red-500/20 text-red-400" title={trade.errors.join(' ')}>Invalid</span>}
                                            </td>
                                            <td className="p-2">{trade.data.instrument}</td>
                                            <td className={`p-2 font-semibold ${trade.data.pnl >= 0 ? 'text-green-500' : 'text-red-500'}`}>{typeof trade.data.pnl === 'number' ? trade.data.pnl.toFixed(2) : 'N/A'}</td>
                                            <td className="p-2">{trade.data.exit_timestamp?.toLocaleDateString()}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                        {importError && (
                            <div className="mt-4 p-3 bg-red-500/10 text-red-500 text-sm rounded-md text-center">
                                <strong>Import Failed:</strong> {importError}
                            </div>
                        )}
                    </div>
                );
            default:
                return null;
        }
    };

    return (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in" onClick={onClose}>
            <div className="bg-white dark:bg-slate-800 rounded-lg shadow-xl w-full max-w-2xl flex flex-col max-h-[90vh] animate-fade-in-up" onClick={e => e.stopPropagation()}>
                <div className="flex-shrink-0 flex items-center justify-between p-4 border-b border-slate-200 dark:border-slate-800">
                    <h2 className="text-lg font-bold text-slate-900 dark:text-white">Import Trades from CSV</h2>
                    <button onClick={onClose} className="p-1 rounded-full text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-700"><XMarkIcon /></button>
                </div>
                <div className="flex-grow p-6 overflow-y-auto">
                    {isLoading ? <div className="flex justify-center items-center h-48">Loading file...</div> : renderStepContent()}
                </div>
                <div className="flex-shrink-0 flex justify-between items-center p-4 border-t border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 sm:rounded-b-lg">
                    <button onClick={step === 2 ? () => setStep(1) : onClose} className="px-4 py-2 rounded-md bg-slate-200 dark:bg-slate-600 hover:bg-slate-300 dark:hover:bg-slate-500 font-semibold">
                       {step === 1 ? 'Cancel' : 'Back'}
                    </button>
                    {step === 2 && <button onClick={() => setStep(3)} disabled={!canProceedToPreview} className="px-4 py-2 rounded-md bg-accent-600 text-white hover:bg-accent-700 disabled:bg-accent-800/50 font-semibold">Preview</button>}
                    {step === 3 && (
                        <button onClick={handleImport} disabled={isImporting || !selectedAccountId} className="px-4 py-2 rounded-md bg-accent-600 text-white hover:bg-accent-700 font-semibold disabled:opacity-50 disabled:cursor-wait">
                            {isImporting ? `Importing... ${importProgress.toFixed(0)}%` : `Import ${validatedTrades.filter(t=>t.isValid).length} Trades`}
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};
