
import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useAppContext } from '../context';
import { Strategy } from '../types';
import { PlusIcon, XMarkIcon, EditIcon, TrashIcon } from './Icons';

const StrategyModal: React.FC<{
    strategy?: Strategy | null;
    onClose: () => void;
    onSave: (strategy: Omit<Strategy, 'id' | 'user_id'> | Strategy) => void;
}> = ({ strategy, onClose, onSave }) => {
    const [name, setName] = useState(strategy?.name || '');
    const [description, setDescription] = useState(strategy?.description || '');
    const [entry_conditions, setEntryConditions] = useState(strategy?.entry_conditions || '');
    const [exit_conditions, setExitConditions] = useState(strategy?.exit_conditions || '');
    const [market_conditions, setMarketConditions] = useState(strategy?.market_conditions || '');
    const [portalContainer, setPortalContainer] = useState<HTMLElement | null>(null);

    useEffect(() => {
        setPortalContainer(document.getElementById('modal-portal'));
    }, []);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const strategyData = { name, description, entry_conditions, exit_conditions, market_conditions };
        if (strategy?.id) {
            onSave({ ...strategy, ...strategyData });
        } else {
            onSave(strategyData);
        }
    };
    
    const inputStyles = "w-full bg-slate-100 dark:bg-slate-700/50 text-slate-900 dark:text-white p-3 rounded-lg border border-slate-300 dark:border-slate-700 focus:ring-2 focus:ring-accent-500 focus:border-accent-500 text-base transition-colors";
    const labelStyles = "block text-sm font-medium text-slate-500 dark:text-slate-400 mb-2";

    const modalContent = (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in" onClick={onClose}>
            <div className="bg-white dark:bg-slate-800 rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col animate-fade-in-up" onClick={e => e.stopPropagation()}>
                <div className="flex-shrink-0 flex items-center justify-between p-4 border-b border-slate-200 dark:border-slate-800">
                    <h3 className="text-xl font-bold text-slate-900 dark:text-white">{strategy ? 'Edit' : 'Create'} Strategy</h3>
                    <button onClick={onClose} className="p-1 rounded-full text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-700"><XMarkIcon /></button>
                </div>
                <form onSubmit={handleSubmit} className="flex-grow p-6 overflow-y-auto space-y-4">
                    <div>
                        <label className={labelStyles}>Strategy Name</label>
                        <input type="text" value={name} onChange={e => setName(e.target.value)} placeholder="e.g., London Breakout" className={inputStyles} required />
                    </div>
                    <div>
                        <label className={labelStyles}>Description</label>
                        <textarea value={description} onChange={e => setDescription(e.target.value)} rows={2} placeholder="A brief overview of this strategy" className={inputStyles} required />
                    </div>
                    <div>
                        <label className={labelStyles}>Entry Conditions</label>
                        <textarea value={entry_conditions} onChange={e => setEntryConditions(e.target.value)} rows={4} placeholder="- Condition 1&#10;- Condition 2" className={`${inputStyles} font-mono text-sm`} />
                    </div>
                     <div>
                        <label className={labelStyles}>Exit Conditions</label>
                        <textarea value={exit_conditions} onChange={e => setExitConditions(e.target.value)} rows={4} placeholder="- Take Profit at X&#10;- Stop Loss at Y" className={`${inputStyles} font-mono text-sm`} />
                    </div>
                     <div>
                        <label className={labelStyles}>Optimal Market Conditions</label>
                        <textarea value={market_conditions} onChange={e => setMarketConditions(e.target.value)} rows={3} placeholder="- High volatility&#10;- Trending market" className={`${inputStyles} font-mono text-sm`} />
                    </div>
                </form>
                <div className="flex-shrink-0 flex justify-end gap-4 p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 rounded-b-lg">
                    <button type="button" onClick={onClose} className="px-4 py-2 rounded-md bg-slate-200 dark:bg-slate-600 hover:bg-slate-300 dark:hover:bg-slate-500 font-semibold">Cancel</button>
                    <button type="submit" onClick={handleSubmit} className="px-6 py-2 rounded-md bg-accent-600 text-white hover:bg-accent-700 font-semibold">Save Strategy</button>
                </div>
            </div>
        </div>
    );

    if (!portalContainer) return null;

    return createPortal(modalContent, portalContainer);
};

const StrategyCard: React.FC<{ strategy: Strategy; onEdit: () => void; onDelete: () => void; style?: React.CSSProperties }> = ({ strategy, onEdit, onDelete, style }) => (
    <div className="bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-xl shadow-lg shadow-slate-200/20 dark:shadow-black/20 p-5 flex flex-col justify-between transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl animate-fade-in-up" style={style}>
        <div>
            <div className="flex justify-between items-start">
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">{strategy.name}</h3>
                <div className="flex items-center gap-1">
                    <button onClick={onEdit} className="p-1.5 rounded-full text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700"><EditIcon className="w-4 h-4"/></button>
                    <button onClick={onDelete} className="p-1.5 rounded-full text-red-500 hover:bg-red-500/10"><TrashIcon className="w-4 h-4"/></button>
                </div>
            </div>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 line-clamp-2">{strategy.description}</p>
        </div>
        <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-700">
            <h4 className="text-xs font-semibold uppercase text-slate-400 dark:text-slate-500 mb-2">Entry Conditions</h4>
            <p className="text-sm text-slate-600 dark:text-slate-300 whitespace-pre-wrap line-clamp-3 font-mono">{strategy.entry_conditions || <span className="italic">Not defined.</span>}</p>
        </div>
    </div>
);

const StrategyPlaybook: React.FC = () => {
    const { strategies, addStrategy, updateStrategy, deleteStrategy } = useAppContext();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingStrategy, setEditingStrategy] = useState<Strategy | null>(null);

    const handleOpenModal = (strategy: Strategy | null = null) => {
        setEditingStrategy(strategy);
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setEditingStrategy(null);
        setIsModalOpen(false);
    };

    const handleSaveStrategy = (strategyData: Omit<Strategy, 'id' | 'user_id'> | Strategy) => {
        if ('id' in strategyData) {
            updateStrategy(strategyData as Strategy);
        } else {
            addStrategy(strategyData as Omit<Strategy, 'id' | 'user_id'>);
        }
        handleCloseModal();
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
                <div>
                    <h2 className="text-3xl font-bold text-slate-900 dark:text-white">Strategy Playbooks</h2>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Define and manage your trading strategies to analyze their performance.</p>
                </div>
                <button onClick={() => handleOpenModal()} className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-md text-sm font-semibold text-slate-800 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700/80 self-start sm:self-center transition-colors">
                    <PlusIcon className="w-4 h-4"/>
                    Create New Playbook
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {strategies.map((strategy, index) => (
                    <StrategyCard 
                        key={strategy.id} 
                        strategy={strategy}
                        onEdit={() => handleOpenModal(strategy)}
                        onDelete={() => deleteStrategy(strategy.id)}
                        style={{ animationDelay: `${index * 50}ms` }}
                    />
                ))}
            </div>

            {strategies.length === 0 && (
                <div className="text-center py-12 bg-white/50 dark:bg-slate-900/30 rounded-lg border-2 border-dashed border-slate-300 dark:border-slate-700">
                    <h3 className="text-xl font-semibold text-slate-700 dark:text-slate-300">No Playbooks Yet</h3>
                    <p className="text-slate-500 dark:text-slate-400 mt-2">Click "Create New Playbook" to define your first trading strategy.</p>
                </div>
            )}

            {isModalOpen && (
                <StrategyModal 
                    strategy={editingStrategy}
                    onClose={handleCloseModal}
                    onSave={handleSaveStrategy}
                />
            )}
        </div>
    );
};

export default StrategyPlaybook;
