import React, { useState, useMemo, useEffect } from 'react';
import { useAppContext } from '../context';
import { getInstrumentSpec } from '../constants';
import { Account } from '../types';
import { BalanceIcon, CalculatorIcon } from './Icons';

const InfoCard: React.FC<{ title: string; value: string; subtext?: string; isPrimary?: boolean }> = ({ title, value, subtext, isPrimary = false }) => {
    const primaryStyles = "bg-accent-500/10 dark:bg-accent-900/50 border-accent-500/50";
    const defaultStyles = "bg-slate-100 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700/50";
    const primaryText = "text-accent-600 dark:text-accent-300";
    const defaultText = "text-slate-900 dark:text-white";

    return (
        <div className={`p-4 rounded-xl border ${isPrimary ? primaryStyles : defaultStyles} transition-all`}>
            <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">{title}</p>
            <p className={`text-3xl font-bold mt-1 ${isPrimary ? primaryText : defaultText}`}>{value}</p>
            {subtext && <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">{subtext}</p>}
        </div>
    );
};


const PositionSizeCalculator: React.FC = () => {
    const { accounts, tradableInstruments } = useAppContext();
    
    // Core Inputs
    const [selectedAccountId, setSelectedAccountId] = useState<string>(accounts.length > 0 ? accounts[0].id : 'manual');
    const [accountBalance, setAccountBalance] = useState<string>(accounts.length > 0 ? accounts[0].balance.toString() : '');
    const [riskPercentage, setRiskPercentage] = useState<string>('1');
    const [instrument, setInstrument] = useState<string>(tradableInstruments.length > 0 ? tradableInstruments[0] : 'EUR/USD');

    // Mode-specific inputs
    const [calcMode, setCalcMode] = useState<'pips' | 'price'>('pips');
    const [stopLossPips, setStopLossPips] = useState<string>('20');
    const [entryPrice, setEntryPrice] = useState<string>('');
    const [stopLossPrice, setStopLossPrice] = useState<string>('');

    useEffect(() => {
        if (selectedAccountId === 'manual') {
            setAccountBalance('');
        } else {
            const selectedAccount = accounts.find(acc => acc.id === selectedAccountId);
            if (selectedAccount) {
                setAccountBalance(selectedAccount.balance.toString());
            }
        }
    }, [selectedAccountId, accounts]);

    const { results, instrumentSpec } = useMemo(() => {
        const balance = parseFloat(accountBalance);
        const risk = parseFloat(riskPercentage);
        const spec = getInstrumentSpec(instrument);
        
        let slInPips: number;
        
        if (calcMode === 'pips') {
            slInPips = parseFloat(stopLossPips);
        } else {
            const entry = parseFloat(entryPrice);
            const sl = parseFloat(stopLossPrice);
            if (isNaN(entry) || isNaN(sl) || entry <= 0 || sl <= 0 || spec.pipPointSize <= 0) {
                 return { results: null, instrumentSpec: spec };
            }
            const priceDifference = Math.abs(entry - sl);
            slInPips = priceDifference / spec.pipPointSize;
        }

        if (isNaN(balance) || isNaN(risk) || isNaN(slInPips) || balance <= 0 || risk <= 0 || slInPips <= 0) {
            return { results: null, instrumentSpec: spec };
        }

        const riskAmount = balance * (risk / 100);
        const valueOfStopPerLotOrUnit = slInPips * spec.pipPointValue;
        
        if (valueOfStopPerLotOrUnit <= 0) {
             return { results: null, instrumentSpec: spec };
        }
        
        const positionSizeLots = riskAmount / valueOfStopPerLotOrUnit;
        const positionSizeUnits = positionSizeLots * spec.lotSize;

        return {
            results: {
                riskAmount,
                positionSizeLots,
                positionSizeUnits,
                pipPointValue: spec.pipPointValue,
                stopLossInPips: slInPips,
            },
            instrumentSpec: spec
        };
    }, [accountBalance, riskPercentage, instrument, calcMode, stopLossPips, entryPrice, stopLossPrice]);
    
    const handleReset = () => {
        const defaultAccountId = accounts.length > 0 ? accounts[0].id : 'manual';
        setSelectedAccountId(defaultAccountId);
        setAccountBalance(accounts.length > 0 ? accounts[0].balance.toString() : '');
        setRiskPercentage('1');
        setStopLossPips('20');
        setInstrument(tradableInstruments.length > 0 ? tradableInstruments[0] : 'EUR/USD');
        setEntryPrice('');
        setStopLossPrice('');
        setCalcMode('pips');
    };

    const inputStyles = "w-full bg-slate-100 dark:bg-slate-700/50 text-slate-900 dark:text-white p-3 rounded-lg border border-slate-300 dark:border-slate-700 focus:ring-2 focus:ring-accent-500 focus:border-accent-500 text-base transition-colors";
    const labelStyles = "block text-sm font-medium text-slate-500 dark:text-slate-400 mb-2";

    return (
        <div className="max-w-4xl mx-auto space-y-6">
            <div className="text-center">
                 <h2 className="text-3xl font-bold text-slate-900 dark:text-white flex items-center justify-center gap-3">
                    <CalculatorIcon className="w-8 h-8 text-accent-500" />
                    Position Size Calculator
                </h2>
                <p className="text-slate-500 dark:text-slate-400 mt-2">Calculate your position size accurately based on account balance, risk tolerance, and trade parameters.</p>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Input Section */}
                <div className="bg-white/80 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-xl shadow-lg p-6 space-y-4">
                    <h3 className="text-xl font-semibold text-slate-900 dark:text-white">Trade Parameters</h3>
                    <div>
                        <label htmlFor="account-select" className={labelStyles}>Account</label>
                        <select 
                            id="account-select"
                            value={selectedAccountId} 
                            onChange={e => setSelectedAccountId(e.target.value)}
                            className={inputStyles}
                        >
                            {accounts.map(acc => <option key={acc.id} value={acc.id}>{acc.name} (${acc.balance.toLocaleString()})</option>)}
                            <option value="manual">Enter Manually</option>
                        </select>
                    </div>
                     <div>
                        <label htmlFor="account-balance" className={labelStyles}>Account Balance ($)</label>
                        <input 
                            id="account-balance"
                            type="number"
                            value={accountBalance}
                            onChange={e => setAccountBalance(e.target.value)}
                            placeholder="e.g., 10000"
                            className={inputStyles}
                            disabled={selectedAccountId !== 'manual'}
                        />
                    </div>
                     <div>
                        <label htmlFor="risk-percent" className={labelStyles}>Risk per Trade (%)</label>
                        <input 
                            id="risk-percent"
                            type="number"
                            value={riskPercentage}
                            onChange={e => setRiskPercentage(e.target.value)}
                            placeholder="e.g., 1"
                            className={inputStyles}
                        />
                    </div>
                     <div>
                        <label htmlFor="instrument-select" className={labelStyles}>Instrument</label>
                        <select
                            id="instrument-select"
                            value={instrument}
                            onChange={e => setInstrument(e.target.value)}
                            className={inputStyles}
                        >
                             {tradableInstruments.map(inst => <option key={inst} value={inst}>{inst}</option>)}
                        </select>
                    </div>
                     <div>
                        <label className={labelStyles}>Calculate using</label>
                         <div className="flex items-center gap-2 bg-slate-200 dark:bg-slate-800 p-1 rounded-lg">
                            <button onClick={() => setCalcMode('pips')} className={`w-full px-3 py-1.5 text-sm font-medium rounded-md transition-all ${calcMode === 'pips' ? 'bg-white dark:bg-slate-700 shadow text-slate-900 dark:text-white' : 'text-slate-500 dark:text-slate-400'}`}>
                                Pips / Points
                            </button>
                            <button onClick={() => setCalcMode('price')} className={`w-full px-3 py-1.5 text-sm font-medium rounded-md transition-all ${calcMode === 'price' ? 'bg-white dark:bg-slate-700 shadow text-slate-900 dark:text-white' : 'text-slate-500 dark:text-slate-400'}`}>
                                Price Levels
                            </button>
                        </div>
                    </div>
                    
                    {calcMode === 'pips' ? (
                        <div>
                            <label htmlFor="stop-loss-pips" className={labelStyles}>Stop Loss ({instrumentSpec.unitName})</label>
                            <input id="stop-loss-pips" type="number" value={stopLossPips} onChange={e => setStopLossPips(e.target.value)} placeholder="e.g., 20" className={inputStyles} />
                        </div>
                    ) : (
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label htmlFor="entry-price" className={labelStyles}>Entry Price</label>
                                <input id="entry-price" type="number" step="any" value={entryPrice} onChange={e => setEntryPrice(e.target.value)} placeholder="1.2345" className={inputStyles} />
                            </div>
                             <div>
                                <label htmlFor="stop-loss-price" className={labelStyles}>Stop Loss Price</label>
                                <input id="stop-loss-price" type="number" step="any" value={stopLossPrice} onChange={e => setStopLossPrice(e.target.value)} placeholder="1.2325" className={inputStyles} />
                            </div>
                        </div>
                    )}

                </div>

                {/* Results Section */}
                 <div className="bg-white/80 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-xl shadow-lg p-6 flex flex-col">
                     <h3 className="text-xl font-semibold text-slate-900 dark:text-white mb-4">Calculation Results</h3>
                     {results ? (
                        <div className="space-y-4 flex-grow flex flex-col">
                            <InfoCard 
                                title="Amount at Risk" 
                                value={`$${results.riskAmount.toFixed(2)}`} 
                                subtext={`${riskPercentage}% of $${parseFloat(accountBalance).toLocaleString()}`}
                            />
                            <InfoCard 
                                title="Position Size (Lots)" 
                                value={instrumentSpec.type === 'Forex' ? results.positionSizeLots.toFixed(2) : 'N/A'}
                                subtext={instrumentSpec.type !== 'Forex' ? "Not applicable for this instrument" : undefined}
                                isPrimary
                            />
                            <InfoCard 
                                title="Position Size (Units)" 
                                value={`${results.positionSizeUnits.toLocaleString(undefined, { maximumFractionDigits: instrumentSpec.type === 'Crypto' ? 4 : 2 })}`}
                                subtext={instrumentSpec.type === 'Index' ? "Contracts" : instrumentSpec.type === 'Stock' ? "Shares" : instrumentSpec.type === 'Crypto' ? "Coins" : "Units"}
                                isPrimary
                            />
                            <div className="text-left text-xs text-slate-400 dark:text-slate-500 pt-4 mt-auto space-y-2 p-3 bg-slate-50 dark:bg-slate-800/30 rounded-lg">
                                <p className="font-semibold text-slate-500 dark:text-slate-400">Calculation Breakdown:</p>
                                <p>1. Risk Amount = ${parseFloat(accountBalance).toLocaleString()} (Balance) × {riskPercentage}% (Risk) = <span className="font-semibold">${results.riskAmount.toFixed(2)}</span></p>
                                <p>2. Stop Loss = <span className="font-semibold">{results.stopLossInPips.toFixed(2)} {instrumentSpec.unitName}</span></p>
                                <p>3. Value per {instrumentSpec.unitName.slice(0,-1)} (1 Lot) = <span className="font-semibold">${instrumentSpec.pipPointValue.toFixed(2)}</span></p>
                                <p>4. Position Size (Lots) = ${results.riskAmount.toFixed(2)} / ({results.stopLossInPips.toFixed(2)} × ${instrumentSpec.pipPointValue.toFixed(2)}) = <span className="font-semibold">{results.positionSizeLots.toFixed(4)}</span></p>
                                {instrumentSpec.notes && <p className="mt-1 italic">{instrumentSpec.notes}</p>}
                            </div>
                        </div>
                    ) : (
                        <div className="flex-grow flex flex-col items-center justify-center text-center text-slate-500 dark:text-slate-400 p-4 bg-slate-100 dark:bg-slate-800/50 rounded-lg">
                            <BalanceIcon className="w-12 h-12 mb-4"/>
                            <p>Enter valid trade parameters to see your calculated position size.</p>
                        </div>
                    )}
                 </div>
            </div>
             <div className="flex justify-center">
                <button
                    onClick={handleReset}
                    className="px-6 py-2 rounded-md bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 font-semibold text-slate-800 dark:text-slate-200 text-sm transition-colors"
                >
                    Reset Calculator
                </button>
            </div>
        </div>
    );
};

export default PositionSizeCalculator;