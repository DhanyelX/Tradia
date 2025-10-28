
import React, { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import { useAppContext } from '../context';
import { Trade } from '../types';
import { getAIFeedback } from '../services/geminiService';
import { 
    XMarkIcon, JournalIcon, UploadIcon, ArrowUpIcon, ArrowDownIcon, 
    MicrophoneIcon, StopCircleIcon, EditIcon, EyeIcon 
} from './Icons';
import { EMOTIONS, SETUP_QUALITY_TAGS, TRADE_QUALITY_COLORS } from '../constants';

const ProgressIndicator: React.FC<{ currentStep: number; steps: string[] }> = ({ currentStep, steps }) => {
    return (
        <div className="w-full px-4 sm:px-8">
            {/* Title for smaller screens */}
            <div className="sm:hidden text-center mb-4">
                <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                    Step {currentStep} of {steps.length}: <span className="text-accent-500">{steps[currentStep - 1]}</span>
                </p>
            </div>
            <div className="flex items-start justify-center">
                {steps.map((label, index) => {
                    const step = index + 1;
                    const isCompleted = currentStep > step;
                    const isActive = currentStep === step;

                    return (
                        <React.Fragment key={step}>
                            <div className="flex flex-col items-center text-center">
                                <div className={`w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center transition-all duration-300 border-2 ${isActive ? 'bg-accent-500 border-accent-500 text-white' : isCompleted ? 'bg-accent-500/50 border-accent-500/50 text-white' : 'bg-slate-200 dark:bg-slate-700 border-transparent text-slate-500 dark:text-slate-400'}`}>
                                    {step}
                                </div>
                                {/* Label for larger screens */}
                                <p className={`hidden sm:block mt-2 text-xs w-20 font-medium transition-colors duration-300 ${isActive || isCompleted ? 'text-accent-500' : 'text-slate-500 dark:text-slate-400'}`}>{label}</p>
                            </div>
                            {step < steps.length && (
                                /* Connector line, mt-3.5 aligns it with the middle of the w-8/h-8 circle */
                                <div className="flex-1 h-1 mt-3.5 mx-1 sm:mx-2 rounded-full bg-slate-200 dark:bg-slate-700 relative">
                                    <div className={`absolute top-0 left-0 h-full rounded-full bg-gradient-to-r from-accent-500/50 to-accent-500 transition-all duration-500`} style={{ width: isCompleted ? '100%' : isActive ? '50%' : '0%'}}></div>
                                </div>
                            )}
                        </React.Fragment>
                    )
                })}
            </div>
        </div>
    );
};

const formatDateForInput = (date: Date): string => {
    if (!(date instanceof Date) || isNaN(date.getTime())) {
        return '';
    }
    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    return `${year}-${month}-${day}T${hours}:${minutes}`;
};

export const ImmersiveJournalEntry: React.FC<{ onClose: () => void }> = ({ onClose }) => {
    const { user, accounts, addMultipleTrades, updateTrade, trades, tradableInstruments, customTags, strategies } = useAppContext();
    const [entryType, setEntryType] = useState<'trade' | 'observation' | null>(null);
    const [currentStep, setCurrentStep] = useState(1);
    const [isClosing, setIsClosing] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [trade, setTrade] = useState<Partial<Trade> & { direction?: 'long' | 'short' }>({
        direction: 'long',
        tags: [],
        custom_tags: {},
        risk_percentage: 1,
        instrument: tradableInstruments.length > 0 ? tradableInstruments[0] : undefined,
        followed_plan: true,
        trade_quality: 'B',
        entry_timestamp: new Date(),
        exit_timestamp: new Date(),
        commission: 0,
        swap: 0,
    });
    const [screenshot, setScreenshot] = useState<string | null>(null);
    
    // Multi-account and risk state
    const [selectedAccountIds, setSelectedAccountIds] = useState<string[]>(accounts.length > 0 ? [accounts[0].id] : []);
    const [useSameRisk, setUseSameRisk] = useState(true);
    const [accountRisks, setAccountRisks] = useState<{ [key: string]: number | '' }>({});

    // Audio recording state
    const [isRecording, setIsRecording] = useState(false);
    const [audioURL, setAudioURL] = useState<string | null>(null);
    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const audioChunksRef = useRef<Blob[]>([]);

    const handleClose = useCallback(() => {
        setIsClosing(true);
        setTimeout(onClose, 300);
    }, [onClose]);

    const handleFieldChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        if (e.target.type === 'datetime-local' && value) {
            setTrade(prev => ({ ...prev, [name]: new Date(value) }));
            return;
        }
        if (e.target.type === 'number') {
            // For number inputs, parse to float or set to undefined if empty to avoid storing empty strings.
            // parseFloat will handle values like "5." or "0.5" correctly.
            setTrade(prev => ({ ...prev, [name]: value === '' ? undefined : parseFloat(value) }));
        } else {
            setTrade(prev => ({ ...prev, [name]: value }));
        }
    };
    
    const handleTagToggle = (tag: string) => {
        setTrade(prev => {
            const newTags = new Set(prev.tags || []);
            if (newTags.has(tag)) {
                newTags.delete(tag);
            } else {
                newTags.add(tag);
            }
            return { ...prev, tags: Array.from(newTags) };
        });
    };
    
    const handleCustomTagChange = (tagId: string, option: string) => {
        setTrade(prev => ({
            ...prev,
            custom_tags: {
                ...(prev.custom_tags || {}),
                [tagId]: option,
            }
        }));
    };
    
    const handleAccountToggle = (accountId: string) => {
        setSelectedAccountIds(prev => {
            const newSet = new Set(prev);
            if (newSet.has(accountId)) {
                newSet.delete(accountId);
            } else {
                newSet.add(accountId);
            }
            return Array.from(newSet);
        });
    };

    const handleAccountRiskChange = (accountId: string, value: string) => {
        const numValue = value === '' ? '' : parseFloat(value);
        if (numValue === '' || (!isNaN(numValue) && numValue >= 0)) {
            setAccountRisks(prev => ({ ...prev, [accountId]: numValue }));
        }
    };


    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const reader = new FileReader();
            reader.onloadend = () => setScreenshot(reader.result as string);
            reader.readAsDataURL(e.target.files[0]);
        }
    };

    // Auto-calculate RR when price levels are available
    useEffect(() => {
        if (entryType === 'trade' && trade.entry && trade.stop_loss && trade.exit) {
            const risk = Math.abs(trade.entry - trade.stop_loss);
            if (risk === 0) return;

            const isLong = trade.direction === 'long';
            const isWin = (isLong && trade.exit > trade.entry) || (!isLong && trade.exit < trade.entry);
            const pnlAmount = Math.abs(trade.exit - trade.entry);
            
            const rr = pnlAmount / risk;
            const finalRR = isWin ? rr : -rr;

            // Only update if the value is different to avoid re-renders and potential loops
            if (trade.rr?.toFixed(2) !== finalRR.toFixed(2)) {
                setTrade(prev => ({...prev, rr: parseFloat(finalRR.toFixed(2)) }));
            }
        }
    }, [trade.entry, trade.stop_loss, trade.exit, trade.direction, entryType, trade.rr]);
    
    const startRecording = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            mediaRecorderRef.current = new MediaRecorder(stream);
            audioChunksRef.current = [];
            
            mediaRecorderRef.current.ondataavailable = event => {
                audioChunksRef.current.push(event.data);
            };

            mediaRecorderRef.current.onstop = () => {
                const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
                const reader = new FileReader();
                reader.readAsDataURL(audioBlob);
                reader.onloadend = () => {
                    const base64String = reader.result as string;
                    setAudioURL(base64String);
                    setTrade(prev => ({...prev, audio_note_url: base64String}));
                };
            };

            mediaRecorderRef.current.start();
            setIsRecording(true);
        } catch (err) {
            console.error("Error starting recording:", err);
            alert("Microphone access was denied. Please allow microphone access in your browser settings to use this feature.");
        }
    };

    const stopRecording = () => {
        if (mediaRecorderRef.current) {
            mediaRecorderRef.current.stop();
            setIsRecording(false);
        }
    };
    
    const handleSaveTrade = async () => {
        setIsSaving(true);
        try {
            const customTagValues = Object.values(trade.custom_tags || {}).filter(Boolean);
            const combinedTags = Array.from(new Set([...(trade.tags || []), ...customTagValues]));
            
            let tradesToCreate: Omit<Trade, 'id' | 'ai_note' | 'user_id'>[] = [];

            if (entryType === 'observation') {
                 const observationData = {
                    trade_taken: false,
                    instrument: trade.instrument || 'Unknown',
                    pnl: 0,
                    rr: 0,
                    notes: trade.notes || '',
                    tags: combinedTags,
                    custom_tags: trade.custom_tags,
                    entry_timestamp: new Date(),
                    exit_timestamp: new Date(),
                    screenshot_url: screenshot || undefined,
                    audio_note_url: trade.audio_note_url,
                    emotion_during_trade: trade.emotion_during_trade,
                    emotion_after_trade: trade.emotion_after_trade,
                    followed_plan: trade.followed_plan,
                    trade_quality: trade.trade_quality,
                    strategy_id: trade.strategy_id
                };
                tradesToCreate.push(observationData as Omit<Trade, 'id' | 'ai_note' | 'user_id'>);
            } else {
                for (const accountId of selectedAccountIds) {
                    const account = accounts.find(a => a.id === accountId);
                    if (!account) continue;

                    const riskPercent = useSameRisk ? (trade.risk_percentage || 0) : (accountRisks[accountId] || 0);
                    
                    const riskCalculationBase = user?.risk_calculation_method === 'initialBalance'
                        ? account.initial_balance
                        : account.balance; // Default to current balance if not set

                    const riskAmount = riskCalculationBase * (Number(riskPercent) / 100);
                    const grossPnl = riskAmount * (trade.rr || 0);
                    const commission = trade.commission || 0;
                    const swap = trade.swap || 0;
                    const pnl = grossPnl - commission - swap;
                    
                    const finalTradeData: Omit<Trade, 'id' | 'ai_note' | 'user_id'> = {
                        trade_taken: true,
                        account_id: accountId,
                        instrument: trade.instrument || 'Unknown',
                        entry: trade.entry || 0,
                        exit: trade.exit || 0,
                        stop_loss: trade.stop_loss || 0,
                        take_profit: trade.take_profit || 0,
                        risk_percentage: Number(riskPercent),
                        rr: trade.rr || 0,
                        pnl,
                        commission,
                        swap,
                        notes: trade.notes || '',
                        tags: combinedTags,
                        custom_tags: trade.custom_tags,
                        entry_timestamp: trade.entry_timestamp || new Date(),
                        exit_timestamp: trade.exit_timestamp || new Date(),
                        screenshot_url: screenshot || undefined,
                        audio_note_url: trade.audio_note_url,
                        emotion_during_trade: trade.emotion_during_trade,
                        emotion_after_trade: trade.emotion_after_trade,
                        followed_plan: trade.followed_plan,
                        trade_quality: trade.trade_quality,
                        strategy_id: trade.strategy_id
                    };
                    tradesToCreate.push(finalTradeData);
                }
            }
            
            const createdTrades = await addMultipleTrades(tradesToCreate);

            if (createdTrades) {
                createdTrades.forEach(newTrade => {
                    // Fire-and-forget AI feedback process
                    getAIFeedback(newTrade, trades)
                        .then(ai_note => {
                            const updatedTrade = { ...newTrade, ai_note };
                            updateTrade(updatedTrade);
                        })
                        .catch(error => {
                            console.error("Failed to get AI feedback:", error);
                            const updatedTrade = { ...newTrade, ai_note: { summary: 'AI analysis failed to run.' } };
                            updateTrade(updatedTrade);
                        });
                });
            }
            
            handleClose();
        } catch (error) {
            console.error("Error saving trade entry:", error);
            // NOTE: A user-facing error could be added here in the future.
        } finally {
            setIsSaving(false);
        }
    };


    const tradeSteps = ['Setup', 'Levels', 'Outcome', 'Context', 'Emotions', 'Review'];
    const observationSteps = ['Setup', 'Context', 'Emotions', 'Review'];
    const steps = entryType === 'trade' ? tradeSteps : observationSteps;
    
    const nextStep = () => setCurrentStep(s => Math.min(s + 1, steps.length));
    const prevStep = () => setCurrentStep(s => Math.max(s - 1, 1));
    
    const inputStyles = "w-full bg-slate-100 dark:bg-slate-700/50 text-slate-900 dark:text-white p-3 rounded-lg border border-slate-300 dark:border-slate-700 focus:ring-2 focus:ring-accent-500 focus:border-accent-500 text-base transition-colors";
    const labelStyles = "block text-sm font-medium text-slate-500 dark:text-slate-400 mb-2";

    const isStep1Valid = useMemo(() => !!(trade.instrument && trade.instrument.trim() !== ''), [trade.instrument]);
    const isStep2Valid = useMemo(() => !!(trade.entry && trade.stop_loss && trade.take_profit && trade.entry_timestamp), [trade.entry, trade.stop_loss, trade.take_profit, trade.entry_timestamp]);
    const riskRewardRatio = useMemo(() => {
       if (!isStep2Valid || !trade.entry) return '0.00';
       const risk = Math.abs(trade.entry - (trade.stop_loss || 0));
       const reward = Math.abs((trade.take_profit || 0) - trade.entry);
       return risk > 0 && reward > 0 ? (reward / risk).toFixed(2) : '0.00';
   }, [trade.entry, trade.stop_loss, trade.take_profit, isStep2Valid]);

    const renderTradeSteps = () => {
        switch (currentStep) {
             case 1: // Setup
                return (
                    <div className="space-y-6">
                        <div>
                            <label className={labelStyles}>Instrument</label>
                            {tradableInstruments.length > 0 ? (
                                <select name="instrument" value={trade.instrument || ''} onChange={handleFieldChange} className={inputStyles}>
                                    {tradableInstruments.map(inst => <option key={inst} value={inst}>{inst}</option>)}
                                </select>
                            ) : (
                                <select className={inputStyles} disabled>
                                    <option>Please set instruments in Profile</option>
                                </select>
                            )}
                        </div>
                         <div>
                            <label className={labelStyles}>Strategy</label>
                            <select name="strategy_id" value={trade.strategy_id || ''} onChange={handleFieldChange} className={inputStyles}>
                                <option value="">No Strategy</option>
                                {strategies.map(strat => <option key={strat.id} value={strat.id}>{strat.name}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className={labelStyles}>Direction</label>
                            <div className="grid grid-cols-2 gap-4">
                               <button onClick={() => setTrade(t => ({...t, direction: 'long'}))} className={`p-4 rounded-lg flex items-center justify-center gap-2 font-semibold transition-all duration-200 border-2 ${trade.direction === 'long' ? 'bg-green-500/20 text-green-500 border-green-500 shadow-md' : 'bg-slate-100 dark:bg-slate-700/50 text-slate-600 dark:text-slate-300 border-transparent'}`}>
                                    <ArrowUpIcon /> Long
                                </button>
                                <button onClick={() => setTrade(t => ({...t, direction: 'short'}))} className={`p-4 rounded-lg flex items-center justify-center gap-2 font-semibold transition-all duration-200 border-2 ${trade.direction === 'short' ? 'bg-red-500/20 text-red-500 border-red-500 shadow-md' : 'bg-slate-100 dark:bg-slate-700/50 text-slate-600 dark:text-slate-300 border-transparent'}`}>
                                    <ArrowDownIcon /> Short
                                </button>
                            </div>
                        </div>
                        <div>
                            <label className={labelStyles}>Accounts & Risk</label>
                            <div className="space-y-3 p-3 bg-slate-100 dark:bg-slate-800/50 rounded-lg border border-slate-200 dark:border-slate-700/50">
                                {accounts.map(acc => (
                                    <div key={acc.id} className="flex items-center">
                                        <input
                                            type="checkbox"
                                            id={`acc-${acc.id}`}
                                            checked={selectedAccountIds.includes(acc.id)}
                                            onChange={() => handleAccountToggle(acc.id)}
                                            className="h-4 w-4 rounded border-gray-300 text-accent-600 focus:ring-accent-500 flex-shrink-0"
                                        />
                                        <label htmlFor={`acc-${acc.id}`} className="ml-3 block text-sm font-medium text-slate-800 dark:text-slate-200">
                                            {acc.name}
                                        </label>
                                    </div>
                                ))}
                                <hr className="border-slate-200 dark:border-slate-700/50"/>
                                <div className="flex items-center">
                                    <input type="checkbox" id="useSameRisk" checked={useSameRisk} onChange={e => setUseSameRisk(e.target.checked)} className="h-4 w-4 rounded border-gray-300 text-accent-600 focus:ring-accent-500" />
                                    <label htmlFor="useSameRisk" className="ml-3 block text-sm font-medium text-slate-800 dark:text-slate-200">Use same risk % for all accounts</label>
                                </div>
                                {useSameRisk ? (
                                    <input type="number" name="risk_percentage" value={trade.risk_percentage ?? ''} onChange={handleFieldChange} className={`${inputStyles} !p-2`} placeholder="Risk %" />
                                ) : (
                                    <div className="space-y-2 pt-2">
                                        {selectedAccountIds.map(id => {
                                            const acc = accounts.find(a => a.id === id);
                                            return (
                                                <div key={id} className="flex items-center justify-between gap-2">
                                                    <span className="text-sm text-slate-600 dark:text-slate-300">{acc?.name}</span>
                                                    <input type="number" placeholder="Risk %" value={accountRisks[id] ?? ''} onChange={e => handleAccountRiskChange(id, e.target.value)} className={`${inputStyles} !p-2 w-28`} />
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>
                        </div>

                    </div>
                );
            case 2: // Levels
                return (
                     <div className="space-y-6">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                           <div>
                                <label className={labelStyles}>Entry Price</label>
                                <input type="number" step="any" name="entry" value={trade.entry ?? ''} onChange={handleFieldChange} className={inputStyles} />
                           </div>
                           <div>
                                <label className={labelStyles}>Entry Timestamp</label>
                                <input type="datetime-local" name="entry_timestamp" value={trade.entry_timestamp ? formatDateForInput(new Date(trade.entry_timestamp)) : ''} onChange={handleFieldChange} className={inputStyles} />
                            </div>
                        </div>
                         <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                            <div>
                                <label className={labelStyles}>Stop Loss</label>
                                <input type="number" step="any" name="stop_loss" value={trade.stop_loss ?? ''} onChange={handleFieldChange} className={inputStyles} />
                            </div>
                            <div>
                                <label className={labelStyles}>Take Profit</label>
                                <input type="number" step="any" name="take_profit" value={trade.take_profit ?? ''} onChange={handleFieldChange} className={inputStyles} />
                            </div>
                        </div>
                        {isStep2Valid && (
                            <div className="text-center bg-slate-100 dark:bg-slate-700/50 p-4 rounded-lg">
                                <p className="text-sm text-slate-500 dark:text-slate-400">Calculated Risk to Reward Ratio</p>
                                <p className="text-2xl font-bold text-slate-900 dark:text-white">{riskRewardRatio}:1</p>
                            </div>
                        )}
                    </div>
                );
            case 3: { // Outcome
                const arePricesEntered = !!(trade.entry && trade.stop_loss && trade.exit);
                return (
                    <div className="space-y-6">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                            <div>
                                <label className={labelStyles}>Exit Price</label>
                                <input type="number" step="any" name="exit" value={trade.exit ?? ''} onChange={handleFieldChange} className={inputStyles} />
                            </div>
                             <div>
                                <label className={labelStyles}>Exit Timestamp</label>
                                <input type="datetime-local" name="exit_timestamp" value={trade.exit_timestamp ? formatDateForInput(new Date(trade.exit_timestamp)) : ''} onChange={handleFieldChange} className={inputStyles} />
                            </div>
                        </div>
                        <div>
                             <label className={labelStyles}>Risk/Reward (R) Multiple</label>
                             <input
                                type="number"
                                step="any"
                                name="rr"
                                value={trade.rr ?? ''}
                                onChange={handleFieldChange}
                                placeholder={arePricesEntered ? "Auto-calculated" : "e.g., 2.5 for a win, -1 for a loss"}
                                className={`${inputStyles} ${arePricesEntered ? 'bg-slate-200 dark:bg-slate-800' : ''}`}
                                readOnly={arePricesEntered}
                             />
                             {arePricesEntered && <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">This is calculated automatically from your entry, stop, and exit prices to ensure data consistency.</p>}
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                            <div>
                                <label className={labelStyles}>Commission ($)</label>
                                <input type="number" step="any" name="commission" value={trade.commission ?? ''} onChange={handleFieldChange} placeholder="0.00" className={inputStyles} />
                            </div>
                            <div>
                                <label className={labelStyles}>Swap ($)</label>
                                <input type="number" step="any" name="swap" value={trade.swap ?? ''} onChange={handleFieldChange} placeholder="0.00" className={inputStyles} />
                            </div>
                        </div>
                         <div>
                            <label className={labelStyles}>Notes on Outcome</label>
                            <textarea name="notes" value={trade.notes || ''} onChange={handleFieldChange} rows={5} placeholder="How did the trade play out? Was the exit well-managed? Any lessons learned?" className={inputStyles}></textarea>
                        </div>
                    </div>
                );
            }
            case 4: // Context
                return (
                    <div className="space-y-6">
                        <div>
                            <label className={labelStyles}>Trade Setup & Quality</label>
                            <div className="flex flex-wrap gap-2">
                                {SETUP_QUALITY_TAGS.map(tag => (
                                    <button key={tag} onClick={() => handleTagToggle(tag)} className={`px-3 py-1.5 text-sm rounded-full border transition-colors ${ (trade.tags || []).includes(tag) ? 'bg-accent-500 border-accent-600 text-white font-semibold' : 'bg-slate-100 dark:bg-slate-700 border-slate-200 dark:border-slate-600'}`}>
                                        {tag}
                                    </button>
                                ))}
                            </div>
                        </div>
                        {customTags.map(ct => (
                            <div key={ct.id}>
                                <label className={labelStyles}>{ct.name}</label>
                                <select onChange={(e) => handleCustomTagChange(ct.id, e.target.value)} value={trade.custom_tags?.[ct.id] || ''} className={inputStyles}>
                                    <option value="">-- Select --</option>
                                    {ct.options.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                                </select>
                            </div>
                        ))}
                    </div>
                );
            case 5: // Emotions
                 return (
                    <div className="space-y-6">
                        <div>
                            <label className={labelStyles}>Emotion During Trade/Observation</label>
                            <select name="emotion_during_trade" value={trade.emotion_during_trade || ''} onChange={handleFieldChange} className={inputStyles}>
                                <option value="">-- Select Emotion --</option>
                                {EMOTIONS.map(e => <option key={e.name} value={e.name}>{e.emoji} {e.name}</option>)}
                            </select>
                        </div>
                         <div>
                            <label className={labelStyles}>Emotion After Trade/Observation</label>
                            <select name="emotion_after_trade" value={trade.emotion_after_trade || ''} onChange={handleFieldChange} className={inputStyles}>
                                <option value="">-- Select Emotion --</option>
                                {EMOTIONS.map(e => <option key={e.name} value={e.name}>{e.emoji} {e.name}</option>)}
                            </select>
                        </div>
                    </div>
                );
            case 6: // Review
                return (
                    <div className="space-y-6">
                        {entryType === 'trade' &&
                        <>
                            <div>
                                <label className={labelStyles}>Did you follow your plan?</label>
                                <div className="flex gap-4">
                                    <button onClick={() => setTrade(t => ({...t, followed_plan: true}))} className={`w-full p-3 rounded-lg font-semibold border-2 transition-all duration-200 ${trade.followed_plan ? 'bg-green-500/20 border-green-500' : 'bg-slate-100 dark:bg-slate-700/50 border-transparent'}`}>Yes</button>
                                    <button onClick={() => setTrade(t => ({...t, followed_plan: false}))} className={`w-full p-3 rounded-lg font-semibold border-2 transition-all duration-200 ${!trade.followed_plan ? 'bg-red-500/20 border-red-500' : 'bg-slate-100 dark:bg-slate-700/50 border-transparent'}`}>No</button>
                                </div>
                            </div>
                            <div>
                                <label className={labelStyles}>Trade Quality</label>
                                <div className="flex gap-4">
                                    {(['A', 'B', 'C', 'D'] as const).map(q => (
                                        <button key={q} onClick={() => setTrade(t => ({...t, trade_quality: q}))} className={`w-full p-3 rounded-lg font-bold border-2 transition-all duration-200 ${trade.trade_quality === q ? `${TRADE_QUALITY_COLORS[q]} border-slate-800 dark:border-white` : 'bg-slate-100 dark:bg-slate-700/50 border-transparent'}`}>{q}</button>
                                    ))}
                                </div>
                            </div>
                        </>
                        }
                        <div>
                            <label className={labelStyles}>Screenshot</label>
                            <label className="w-full cursor-pointer bg-slate-100 dark:bg-slate-700/50 border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-lg p-6 flex flex-col items-center justify-center hover:border-accent-500 transition-colors">
                                {screenshot ? (
                                    <img src={screenshot} alt="Screenshot preview" className="max-h-32 rounded-md" />
                                ) : (
                                    <>
                                        <UploadIcon className="w-8 h-8 text-slate-400 dark:text-slate-500 mb-2"/>
                                        <span className="text-accent-500 font-semibold">Upload an image</span>
                                    </>
                                )}
                                <input type="file" accept="image/*" onChange={handleFileChange} className="hidden" />
                            </label>
                        </div>
                         <div>
                            <label className={labelStyles}>Audio Note</label>
                            <div className="bg-slate-100 dark:bg-slate-700/50 rounded-lg p-4 flex items-center justify-between">
                                {audioURL ? <audio controls src={audioURL} className="w-full h-10" /> : <p className="text-sm text-slate-500 dark:text-slate-400">Record a voice memo...</p>}
                                <button onClick={isRecording ? stopRecording : startRecording} className={`ml-4 p-3 rounded-full text-white transition-colors ${isRecording ? 'bg-red-500 animate-pulse' : 'bg-accent-500'}`}>
                                    {isRecording ? <StopCircleIcon /> : <MicrophoneIcon />}
                                </button>
                            </div>
                        </div>
                    </div>
                );
            default:
                return null;
        }
    }

    const renderObservationSteps = () => {
         switch (currentStep) {
             case 1: // Setup
                return (
                    <div className="space-y-6">
                        <div>
                            <label className={labelStyles}>Instrument Watched</label>
                             {tradableInstruments.length > 0 ? (
                                <select name="instrument" value={trade.instrument || ''} onChange={handleFieldChange} className={inputStyles}>
                                    {tradableInstruments.map(inst => <option key={inst} value={inst}>{inst}</option>)}
                                </select>
                            ) : (
                                 <select className={inputStyles} disabled><option>Please set instruments in Profile</option></select>
                            )}
                        </div>
                        <div>
                            <label className={labelStyles}>Strategy Followed</label>
                            <select name="strategy_id" value={trade.strategy_id || ''} onChange={handleFieldChange} className={inputStyles}>
                                <option value="">No Strategy</option>
                                {strategies.map(strat => <option key={strat.id} value={strat.id}>{strat.name}</option>)}
                            </select>
                        </div>
                         <div>
                            <label className={labelStyles}>Notes on Observation</label>
                            <textarea name="notes" value={trade.notes || ''} onChange={handleFieldChange} rows={8} placeholder="Why did you watch this instrument? What was your hypothesis? Why did you decide not to trade?" className={inputStyles}></textarea>
                        </div>
                    </div>
                );
            case 2: // Context
                return (
                     <div className="space-y-6">
                         <div>
                            <label className={labelStyles}>Market Bias & Context</label>
                            <div className="flex flex-wrap gap-2">
                                {['Bullish', 'Bearish', 'Ranging'].map(tag => (
                                    <button key={tag} onClick={() => handleTagToggle(tag)} className={`px-3 py-1.5 text-sm rounded-full border transition-colors ${ (trade.tags || []).includes(tag) ? 'bg-accent-500 border-accent-600 text-white font-semibold' : 'bg-slate-100 dark:bg-slate-700 border-slate-200 dark:border-slate-600'}`}>
                                        {tag}
                                    </button>
                                ))}
                            </div>
                        </div>
                        {customTags.map(ct => (
                            <div key={ct.id}>
                                <label className={labelStyles}>{ct.name}</label>
                                <select onChange={(e) => handleCustomTagChange(ct.id, e.target.value)} value={trade.custom_tags?.[ct.id] || ''} className={inputStyles}>
                                    <option value="">-- Select --</option>
                                    {ct.options.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                                </select>
                            </div>
                        ))}
                    </div>
                );
            case 3: // Emotions
                 return (
                     <div className="space-y-6">
                         <div>
                             <label className={labelStyles}>Emotion During Observation</label>
                            <select name="emotion_during_trade" value={trade.emotion_during_trade || ''} onChange={handleFieldChange} className={inputStyles}>
                                <option value="">-- Select Emotion --</option>
                                {EMOTIONS.map(e => <option key={e.name} value={e.name}>{e.emoji} {e.name}</option>)}
                            </select>
                        </div>
                         <div>
                             <label className={labelStyles}>Emotion After (Deciding Not to Trade)</label>
                            <select name="emotion_after_trade" value={trade.emotion_after_trade || ''} onChange={handleFieldChange} className={inputStyles}>
                                <option value="">-- Select Emotion --</option>
                                {EMOTIONS.map(e => <option key={e.name} value={e.name}>{e.emoji} {e.name}</option>)}
                            </select>
                        </div>
                    </div>
                 );
            case 4: // Review (same as trade step 6)
                 return (
                    <div className="space-y-6">
                        <div>
                            <label className={labelStyles}>Screenshot of the Setup</label>
                            <label className="w-full cursor-pointer bg-slate-100 dark:bg-slate-700/50 border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-lg p-6 flex flex-col items-center justify-center hover:border-accent-500 transition-colors">
                                {screenshot ? (
                                    <img src={screenshot} alt="Screenshot preview" className="max-h-32 rounded-md" />
                                ) : (
                                    <>
                                        <UploadIcon className="w-8 h-8 text-slate-400 dark:text-slate-500 mb-2"/>
                                        <span className="text-accent-500 font-semibold">Upload an image</span>
                                    </>
                                )}
                                <input type="file" accept="image/*" onChange={handleFileChange} className="hidden" />
                            </label>
                        </div>
                         <div>
                            <label className={labelStyles}>Audio Note</label>
                            <div className="bg-slate-100 dark:bg-slate-700/50 rounded-lg p-4 flex items-center justify-between">
                                {audioURL ? <audio controls src={audioURL} className="w-full h-10" /> : <p className="text-sm text-slate-500 dark:text-slate-400">Record a voice memo...</p>}
                                <button onClick={isRecording ? stopRecording : startRecording} className={`ml-4 p-3 rounded-full text-white transition-colors ${isRecording ? 'bg-red-500 animate-pulse' : 'bg-accent-500'}`}>
                                    {isRecording ? <StopCircleIcon /> : <MicrophoneIcon />}
                                </button>
                            </div>
                        </div>
                    </div>
                );
             default: return null;
         }
    }

    return (
         <div className={`fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-0 sm:p-4 transition-opacity duration-300 ease-in-out ${isClosing ? 'opacity-0' : 'opacity-100'}`} onClick={handleClose}>
            <div className={`bg-white dark:bg-slate-900 shadow-xl w-full h-full sm:h-auto sm:max-h-[90vh] sm:max-w-2xl flex flex-col sm:rounded-2xl transition-all duration-300 ease-in-out ${isClosing ? 'scale-95 opacity-0' : 'scale-100 opacity-100'}`} onClick={e => e.stopPropagation()}>
                <div className="flex-shrink-0 flex items-center justify-between p-4 border-b border-slate-200 dark:border-slate-800">
                    <h2 className="text-lg font-bold text-slate-900 dark:text-white">New Journal Entry</h2>
                    <button onClick={handleClose} className="p-1 rounded-full text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-700"><XMarkIcon /></button>
                </div>

                {entryType ? (
                    <>
                        <div className="flex-shrink-0 py-6 border-b border-slate-200 dark:border-slate-800">
                            <ProgressIndicator currentStep={currentStep} steps={steps} />
                        </div>
                        <div className="flex-grow p-6 overflow-y-auto">
                            {entryType === 'trade' ? renderTradeSteps() : renderObservationSteps()}
                        </div>
                        <div className="flex-shrink-0 flex justify-between items-center p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 sm:rounded-b-2xl">
                            <button onClick={prevStep} disabled={currentStep === 1} className="px-4 py-2 rounded-md bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 disabled:opacity-50 font-semibold">Back</button>
                            {currentStep < steps.length ?
                                <button onClick={nextStep} className="px-6 py-2 rounded-md bg-gradient-to-br from-accent-500 to-accent-600 text-white hover:from-accent-600 hover:to-accent-700 font-semibold">Next</button>
                                : <button onClick={handleSaveTrade} disabled={isSaving} className="px-6 py-2 rounded-md bg-gradient-to-br from-accent-500 to-accent-600 text-white hover:from-accent-600 hover:to-accent-700 font-semibold disabled:opacity-50">{isSaving ? 'Saving...' : 'Save Entry'}</button>
                            }
                        </div>
                    </>
                ) : (
                    <div className="flex-grow p-6 flex flex-col items-center justify-center text-center animate-fade-in-up">
                        <JournalIcon className="w-16 h-16 text-accent-500 mb-4" />
                        <h3 className="text-xl font-bold text-slate-900 dark:text-white">What would you like to journal?</h3>
                        <p className="text-slate-500 dark:text-slate-400 mt-2 max-w-sm">Choose an option below to get started. You can log a trade you've taken or simply an observation you made in the market.</p>
                        <div className="flex flex-col sm:flex-row gap-4 mt-8">
                            <button onClick={() => setEntryType('trade')} className="w-64 flex items-center justify-center gap-2 px-6 py-4 bg-white dark:bg-slate-800 border-2 border-slate-300 dark:border-slate-700 rounded-lg font-semibold hover:border-accent-500 hover:text-accent-500 transition-all duration-200 transform hover:-translate-y-1">
                                <EditIcon /> Log a Completed Trade
                            </button>
                             <button onClick={() => setEntryType('observation')} className="w-64 flex items-center justify-center gap-2 px-6 py-4 bg-white dark:bg-slate-800 border-2 border-slate-300 dark:border-slate-700 rounded-lg font-semibold hover:border-accent-500 hover:text-accent-500 transition-all duration-200 transform hover:-translate-y-1">
                                <EyeIcon /> Journal an Observation
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};
