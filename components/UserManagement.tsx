import React, { useState, useMemo, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useAppContext } from '../context';
import { INSTRUMENT_CATEGORIES } from '../constants';
import { ChevronDownIcon, PlusIcon, EditIcon, TrashIcon, XMarkIcon, Avatar, ArrowUpIcon, ArrowDownIcon } from './Icons';
import { CustomTag, Account, User } from '../types';
import { AvatarSelectionModal } from './AvatarSelectionModal';

const AuthCard: React.FC<{title: string; children: React.ReactNode}> = ({ title, children }) => (
    <div className="w-full max-w-md p-8 space-y-8 bg-white/60 dark:bg-slate-800/60 backdrop-blur-lg border border-slate-200/80 dark:border-slate-700/80 rounded-2xl shadow-2xl shadow-slate-300/20 dark:shadow-black/20">
        <h2 className="text-3xl font-bold text-center text-slate-900 dark:text-white">{title}</h2>
        {children}
    </div>
);

const inputStyles = "w-full px-4 py-2 border border-slate-300 dark:border-slate-700 rounded-md bg-slate-100/50 dark:bg-slate-700/50 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-accent-500 focus:border-accent-500 transition-colors";
const buttonStyles = "w-full px-4 py-2 text-white bg-gradient-to-br from-accent-500 to-accent-600 rounded-md hover:from-accent-600 hover:to-accent-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-900 focus:ring-accent-500 disabled:opacity-50 font-semibold";
const secondaryButtonStyles = "px-4 py-2 rounded-md bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 font-semibold text-slate-800 dark:text-slate-200 text-sm transition-colors";


export const Login: React.FC<{ onSwitch: () => void }> = ({ onSwitch }) => {
    const { login } = useAppContext();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        try {
            await login(email, password);
        } catch (err: any) {
            setError(err.message || "Failed to log in.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <AuthCard title="Welcome Back">
            <form className="space-y-6" onSubmit={handleLogin}>
                <input type="email" placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} className={inputStyles} required />
                <input type="password" placeholder="Password" value={password} onChange={e => setPassword(e.target.value)} className={inputStyles} required />
                {error && <p className="text-red-500 text-sm text-center">{error}</p>}
                <button type="submit" className={buttonStyles} disabled={loading}>
                    {loading ? 'Logging in...' : 'Login'}
                </button>
            </form>
            <p className="text-center text-sm text-slate-500 dark:text-slate-400">
                Don't have an account?{' '}
                <button onClick={onSwitch} className="font-medium text-accent-500 hover:text-accent-400">
                    Sign up
                </button>
            </p>
        </AuthCard>
    );
};

export const SignUp: React.FC<{ onSwitch: () => void }> = ({ onSwitch }) => {
    const { signup } = useAppContext();
    const [fullName, setFullName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleSignup = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        try {
            await signup(email, password, fullName);
        } catch (err: any) {
            setError(err.message || "Failed to sign up.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <AuthCard title="Create Your Account">
            <form className="space-y-6" onSubmit={handleSignup}>
                <input type="text" placeholder="Full Name" value={fullName} onChange={e => setFullName(e.target.value)} className={inputStyles} required />
                <input type="email" placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} className={inputStyles} required />
                <input type="password" placeholder="Password" value={password} onChange={e => setPassword(e.target.value)} className={inputStyles} required />
                {error && <p className="text-red-500 text-sm text-center">{error}</p>}
                <button type="submit" className={buttonStyles} disabled={loading}>
                    {loading ? 'Creating Account...' : 'Sign Up'}
                </button>
            </form>
            <p className="text-center text-sm text-slate-500 dark:text-slate-400">
                Already have an account?{' '}
                <button onClick={onSwitch} className="font-medium text-accent-500 hover:text-accent-400">
                    Login
                </button>
            </p>
        </AuthCard>
    );
};

const CustomTagManager: React.FC = () => {
    const { customTags, addCustomTag, updateCustomTag, deleteCustomTag } = useAppContext();
    const [editingTag, setEditingTag] = useState<CustomTag | null>(null);
    const [portalContainer, setPortalContainer] = useState<HTMLElement | null>(null);

    useEffect(() => {
        setPortalContainer(document.getElementById('modal-portal'));
    }, []);

    // Form state for adding a new tag
    const [newTagName, setNewTagName] = useState('');
    const [newTagOptions, setNewTagOptions] = useState<string[]>([]);
    const [currentOption, setCurrentOption] = useState('');

    const handleAddOption = (e: React.FormEvent) => {
        e.preventDefault();
        if (currentOption && !newTagOptions.includes(currentOption)) {
            setNewTagOptions([...newTagOptions, currentOption]);
            setCurrentOption('');
        }
    };
    
    const handleRemoveOption = (option: string) => {
        setNewTagOptions(newTagOptions.filter(o => o !== option));
    };

    const handleSaveNewTag = (e: React.FormEvent) => {
        e.preventDefault();
        if (newTagName && newTagOptions.length > 0) {
            addCustomTag(newTagName, newTagOptions);
            setNewTagName('');
            setNewTagOptions([]);
            setCurrentOption('');
        }
    };
    
    const handleUpdateTag = (tag: CustomTag) => {
        updateCustomTag(tag);
        setEditingTag(null);
    }
    
    return (
        <div className="bg-white/80 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 p-6 rounded-xl shadow-lg shadow-slate-200/20 dark:shadow-black/20">
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">Custom Journal Tags</h2>
            <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">Create your own dropdown tags to better categorize trades. These will appear in the journal entry form.</p>
            
            <div className="space-y-4 mb-8">
                {customTags.map(tag => (
                    <div key={tag.id} className="bg-slate-100 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/50 p-4 rounded-lg">
                        <div className="flex justify-between items-center">
                            <h3 className="font-semibold text-slate-900 dark:text-white">{tag.name}</h3>
                            <div className="flex items-center gap-2">
                                <button onClick={() => setEditingTag(tag)} className="p-1.5 rounded-full text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700">
                                    <EditIcon className="w-4 h-4" />
                                </button>
                                <button onClick={() => deleteCustomTag(tag.id)} className="p-1.5 rounded-full text-red-500 hover:bg-red-500/10">
                                    <TrashIcon className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                        <div className="flex flex-wrap gap-2 mt-2">
                            {tag.options.map(opt => <span key={opt} className="px-2.5 py-1 text-xs font-medium bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-full">{opt}</span>)}
                        </div>
                    </div>
                ))}
            </div>

             <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4 border-t border-slate-200 dark:border-slate-800 pt-6">Add New Custom Tag</h3>
             <form onSubmit={handleSaveNewTag} className="space-y-4">
                 <input type="text" value={newTagName} onChange={e => setNewTagName(e.target.value)} placeholder="Tag Name (e.g., 'Setup Type')" className={inputStyles} required />
                 <div className="flex gap-2">
                     <input type="text" value={currentOption} onChange={e => setCurrentOption(e.target.value)} placeholder="Add an option" className={inputStyles} />
                     <button type="button" onClick={handleAddOption} className="px-4 py-2 bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-200 rounded-md hover:bg-slate-300 dark:hover:bg-slate-600 font-semibold">Add</button>
                 </div>
                 {newTagOptions.length > 0 && (
                     <div className="flex flex-wrap gap-2 p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg">
                         {newTagOptions.map(opt => (
                             <span key={opt} className="flex items-center gap-1.5 px-2 py-1 text-sm bg-slate-200 dark:bg-slate-700 rounded-full">
                                 {opt}
                                 <button type="button" onClick={() => handleRemoveOption(opt)} className="text-slate-500 hover:text-red-500">
                                     <XMarkIcon className="w-3 h-3"/>
                                 </button>
                             </span>
                         ))}
                     </div>
                 )}
                 <button type="submit" className={`${buttonStyles} sm:w-auto sm:px-6`}>Save New Tag</button>
             </form>
             {editingTag && portalContainer && createPortal(
                <TagEditModal tag={editingTag} onSave={handleUpdateTag} onClose={() => setEditingTag(null)} />,
                portalContainer
             )}
        </div>
    );
};

const TagEditModal: React.FC<{ tag: CustomTag; onSave: (tag: CustomTag) => void; onClose: () => void }> = ({ tag, onSave, onClose }) => {
    const [name, setName] = useState(tag.name);
    const [options, setOptions] = useState(tag.options);
    const [newOption, setNewOption] = useState('');

    const handleAddOption = () => {
        if (newOption && !options.includes(newOption)) {
            setOptions([...options, newOption]);
            setNewOption('');
        }
    };
    
    const handleRemoveOption = (option: string) => {
        setOptions(options.filter(o => o !== option));
    };

    const handleSave = () => {
        if (name && options.length > 0) {
            onSave({ ...tag, name, options });
        }
    };

    return (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in" onClick={onClose}>
            <div className="bg-white dark:bg-slate-800 rounded-lg shadow-xl w-full max-w-md p-6 animate-fade-in-up" onClick={e => e.stopPropagation()}>
                <h3 className="text-xl font-bold mb-4">Edit Tag</h3>
                <div className="space-y-4">
                    <input type="text" value={name} onChange={e => setName(e.target.value)} placeholder="Tag Name" className={inputStyles} />
                    <div className="flex gap-2">
                        <input type="text" value={newOption} onChange={e => setNewOption(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleAddOption()} placeholder="Add an option" className={inputStyles} />
                        <button onClick={handleAddOption} className="px-4 py-2 bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-200 rounded-md hover:bg-slate-300 dark:hover:bg-slate-600 font-semibold">Add</button>
                    </div>
                    {options.length > 0 && (
                        <div className="flex flex-wrap gap-2 p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg max-h-40 overflow-y-auto">
                            {options.map(opt => (
                                <span key={opt} className="flex items-center gap-1.5 px-2 py-1 text-sm bg-slate-200 dark:bg-slate-700 rounded-full">
                                    {opt}
                                    <button onClick={() => handleRemoveOption(opt)} className="text-slate-500 hover:text-red-500">
                                        <XMarkIcon className="w-3 h-3"/>
                                    </button>
                                </span>
                            ))}
                        </div>
                    )}
                </div>
                <div className="flex justify-end gap-4 mt-6">
                    <button onClick={onClose} className="px-4 py-2 rounded-md bg-slate-200 dark:bg-slate-600 hover:bg-slate-300 dark:hover:bg-slate-500">Cancel</button>
                    <button onClick={handleSave} className="px-4 py-2 rounded-md bg-accent-600 text-white hover:bg-accent-700">Save Changes</button>
                </div>
            </div>
        </div>
    );
};


const InstrumentSelector: React.FC = () => {
    const { tradableInstruments, setTradableInstruments } = useAppContext();
    const [localSelection, setLocalSelection] = useState<Set<string>>(new Set(tradableInstruments));
    const [searchTerm, setSearchTerm] = useState('');
    const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set(Object.keys(INSTRUMENT_CATEGORIES)));
    const [isSaved, setIsSaved] = useState(false);

    useEffect(() => {
        setLocalSelection(new Set(tradableInstruments));
    }, [tradableInstruments]);

    const toggleCategory = (category: string) => {
        setExpandedCategories(prev => {
            const newSet = new Set(prev);
            if (newSet.has(category)) {
                newSet.delete(category);
            } else {
                newSet.add(category);
            }
            return newSet;
        });
    };

    const toggleInstrument = (instrument: string) => {
        setIsSaved(false);
        setLocalSelection(prev => {
            const newSet = new Set(prev);
            if (newSet.has(instrument)) {
                newSet.delete(instrument);
            } else {
                newSet.add(instrument);
            }
            return newSet;
        });
    };

    const handleSave = () => {
        setTradableInstruments(Array.from(localSelection).sort());
        setIsSaved(true);
        setTimeout(() => setIsSaved(false), 2000);
    };

    const filteredCategories: Record<string, string[]> = useMemo(() => {
        if (!searchTerm) {
          return INSTRUMENT_CATEGORIES;
        }
        const lowercasedFilter = searchTerm.toLowerCase();
        
        return Object.fromEntries(
            Object.entries(INSTRUMENT_CATEGORIES)
                .map(([category, instruments]) => {
                    const filteredInstruments = instruments.filter(instrument => instrument.toLowerCase().includes(lowercasedFilter));
                    return [category, filteredInstruments];
                })
                .filter(([, instruments]) => instruments.length > 0)
        );
    }, [searchTerm]);
    
    useEffect(() => {
        if(searchTerm) {
            setExpandedCategories(new Set(Object.keys(filteredCategories)))
        }
    }, [searchTerm, filteredCategories])

    return (
        <div className="bg-white/80 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 p-6 rounded-xl shadow-lg shadow-slate-200/20 dark:shadow-black/20">
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">Tradable Instruments</h2>
            <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">Select the instruments you trade. This will customize instrument dropdowns throughout the app.</p>

            <div className="mb-4">
                <input
                    type="text"
                    placeholder="Search instruments (e.g., BTC, EUR/USD)..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className={inputStyles}
                />
            </div>

            <div className="max-h-96 overflow-y-auto pr-2 space-y-4 mb-6">
                {Object.keys(filteredCategories).length > 0 ? Object.entries(filteredCategories).map(([category, instruments]) => (
                    <div key={category}>
                        <button onClick={() => toggleCategory(category)} className="w-full flex justify-between items-center text-left font-semibold text-slate-800 dark:text-slate-200 mb-2 p-2 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800">
                            {category}
                            <ChevronDownIcon className={`w-4 h-4 transition-transform ${expandedCategories.has(category) ? 'rotate-180' : ''}`} />
                        </button>
                        {expandedCategories.has(category) && (
                            <div className="flex flex-wrap gap-2 pl-2">
                                {instruments.map(instrument => (
                                    <button
                                        key={instrument}
                                        onClick={() => toggleInstrument(instrument)}
                                        className={`px-3 py-1.5 text-sm rounded-full border transition-colors ${
                                            localSelection.has(instrument)
                                                ? 'bg-accent-500 border-accent-600 text-white font-semibold'
                                                : 'bg-slate-100 dark:bg-slate-700 border-slate-200 dark:border-slate-600 hover:border-slate-400 dark:hover:border-slate-400'
                                        }`}
                                    >
                                        {instrument}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                )) : <p className="text-center text-slate-500 dark:text-slate-400 py-4">No instruments match your search.</p>}
            </div>
            
            <div className="flex justify-end">
                <button onClick={handleSave} className={`${buttonStyles} w-auto px-6`}>
                    {isSaved ? 'Saved!' : 'Save Instruments'}
                </button>
            </div>
        </div>
    );
};


const Profile: React.FC = () => {
    const { user, accounts, trades, addAccount, deleteAccount, updateUser, toggleBrowserNotifications } = useAppContext();
    const [newAccountName, setNewAccountName] = useState('');
    const [newAccountBalance, setNewAccountBalance] = useState('');
    const [newAccountType, setNewAccountType] = useState<'Personal' | 'Prop Firm'>('Personal');
    const [newPropFirmName, setNewPropFirmName] = useState('');
    const [newAccountStage, setNewAccountStage] = useState<'Evaluation' | 'Live'>('Evaluation');
    const [newAccountPhase, setNewAccountPhase] = useState<'Phase 1' | 'Phase 2' | 'Phase 3'>('Phase 1');
    const [newProfitTarget, setNewProfitTarget] = useState('');
    const [newMaxDailyDrawdown, setNewMaxDailyDrawdown] = useState('');
    const [newMaxOverallDrawdown, setNewMaxOverallDrawdown] = useState('');
    const [newMinTradingDays, setNewMinTradingDays] = useState('');
    const [newMaxTradingDays, setNewMaxTradingDays] = useState('');
    const [accountToDelete, setAccountToDelete] = useState<Account | null>(null);
    const [shouldDeleteTrades, setShouldDeleteTrades] = useState(false);
    const [portalContainer, setPortalContainer] = useState<HTMLElement | null>(null);
    const [updateError, setUpdateError] = useState('');
    const [isAvatarModalOpen, setIsAvatarModalOpen] = useState(false);

    useEffect(() => {
        setPortalContainer(document.getElementById('modal-portal'));
    }, []);
    
    const tradesForAccount = useMemo(() => {
        if (!accountToDelete) return 0;
        return trades.filter(t => t.account_id === accountToDelete.id).length;
    }, [trades, accountToDelete]);

    const handleAddAccount = (e: React.FormEvent) => {
        e.preventDefault();
        const balance = parseFloat(newAccountBalance);
        if (newAccountName.trim() && !isNaN(balance) && balance >= 0) {
            let options: any = {};
            if (newAccountType === 'Prop Firm') {
                options.prop_firm_name = newPropFirmName;
                options.stage = newAccountStage;
                if (newAccountStage === 'Evaluation') {
                    options.phase = newAccountPhase;
                }
                options.rules = {
                    profit_target: parseFloat(newProfitTarget),
                    max_daily_drawdown: parseFloat(newMaxDailyDrawdown),
                    max_overall_drawdown: parseFloat(newMaxOverallDrawdown),
                    min_trading_days: parseInt(newMinTradingDays, 10),
                    ...(parseInt(newMaxTradingDays, 10) > 0 && { max_trading_days: parseInt(newMaxTradingDays, 10) })
                };
            }
            addAccount(newAccountName.trim(), newAccountType, balance, options);
            setNewAccountName('');
            setNewAccountBalance('');
            setNewPropFirmName('');
            setNewProfitTarget('');
            setNewMaxDailyDrawdown('');
            setNewMaxOverallDrawdown('');
            setNewMinTradingDays('');
            setNewMaxTradingDays('');
        }
    };
    
    const handleDeleteAccount = () => {
        if (accountToDelete) {
            deleteAccount(accountToDelete.id, shouldDeleteTrades);
            setAccountToDelete(null);
        }
    };

    const handleRiskMethodChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        setUpdateError('');
        try {
            await updateUser({ risk_calculation_method: e.target.value as User['risk_calculation_method'] });
        } catch (err: any) {
            console.error("Failed to update user profile:", err);
            setUpdateError(`Failed to save setting: ${err.message}`);
        }
    };

    return (
        <div className="space-y-8 max-w-4xl mx-auto">
            <div className="bg-white/80 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 p-6 rounded-xl shadow-lg shadow-slate-200/20 dark:shadow-black/20">
                <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">User Profile</h2>
                <div className="flex flex-col sm:flex-row items-center gap-6">
                    <div className="relative">
                        <button onClick={() => setIsAvatarModalOpen(true)} className="relative group rounded-full">
                            <Avatar avatar_url={user?.avatar_url} name={user?.name} className="w-24 h-24" />
                            <div className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                                <EditIcon className="w-8 h-8" />
                            </div>
                        </button>
                    </div>
                    <div className="flex-grow text-center sm:text-left">
                        <p className="text-xl font-bold">{user?.name}</p>
                        <p className="text-slate-500 dark:text-slate-400">{user?.email}</p>
                        <div className="flex items-center gap-2 mt-4 justify-center sm:justify-start">
                            <button onClick={() => setIsAvatarModalOpen(true)} className={secondaryButtonStyles}>
                                Change Avatar
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            <div className="bg-white/80 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 p-6 rounded-xl shadow-lg shadow-slate-200/20 dark:shadow-black/20">
                <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">Settings</h2>
                <div>
                    <label className="block text-md font-medium text-slate-700 dark:text-slate-300">Risk Calculation Method</label>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mb-3">Choose which balance to use for calculating risk % in the journal.</p>
                    <div className="flex items-center gap-6">
                        <div className="flex items-center">
                            <input
                                id="risk-current"
                                name="risk-calculation"
                                type="radio"
                                value="currentBalance"
                                checked={user?.risk_calculation_method === 'currentBalance' || !user?.risk_calculation_method}
                                onChange={handleRiskMethodChange}
                                className="h-4 w-4 border-gray-300 text-accent-600 focus:ring-accent-500"
                            />
                            <label htmlFor="risk-current" className="ml-3 block text-sm font-medium leading-6 text-slate-900 dark:text-slate-100">
                                Current Balance
                            </label>
                        </div>
                         <div className="flex items-center">
                            <input
                                id="risk-initial"
                                name="risk-calculation"
                                type="radio"
                                value="initialBalance"
                                checked={user?.risk_calculation_method === 'initialBalance'}
                                onChange={handleRiskMethodChange}
                                className="h-4 w-4 border-gray-300 text-accent-600 focus:ring-accent-500"
                            />
                            <label htmlFor="risk-initial" className="ml-3 block text-sm font-medium leading-6 text-slate-900 dark:text-slate-100">
                                Initial Balance
                            </label>
                        </div>
                    </div>
                    {updateError && <p className="text-red-500 text-sm mt-2">{updateError}</p>}
                </div>
            </div>

            <div className="bg-white/80 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 p-6 rounded-xl shadow-lg shadow-slate-200/20 dark:shadow-black/20">
                <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">Notifications</h2>
                <div className="flex items-center justify-between">
                    <div>
                        <label htmlFor="notif-toggle" className="block text-md font-medium text-slate-700 dark:text-slate-300">Browser Push Notifications</label>
                        <p className="text-sm text-slate-500 dark:text-slate-400">Receive real-time alerts on your desktop.</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                        <input 
                            id="notif-toggle"
                            type="checkbox" 
                            checked={user?.browser_notifications_enabled || false}
                            onChange={toggleBrowserNotifications}
                            className="sr-only peer" 
                        />
                        <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-accent-500/50 dark:peer-focus:ring-accent-800 rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-slate-600 peer-checked:bg-accent-600"></div>
                    </label>
                </div>
            </div>

             <div className="bg-white/80 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 p-6 rounded-xl shadow-lg shadow-slate-200/20 dark:shadow-black/20">
                <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-6">Trading Accounts</h2>
                <div className="space-y-4 mb-6">
                    {accounts.map(acc => {
                        const change = acc.balance - acc.initial_balance;
                        const percentageChange = acc.initial_balance !== 0 ? (change / acc.initial_balance) * 100 : 0;
                        const balanceColorClass = acc.balance >= acc.initial_balance ? 'text-accent-500' : 'text-slate-900 dark:text-white';

                        return (
                            <div key={acc.id} className="bg-slate-100 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/50 p-4 rounded-lg">
                                <div className="mb-4">
                                    <p className="font-semibold text-slate-900 dark:text-white">{acc.name}</p>
                                    <p className="text-sm text-slate-500 dark:text-slate-400">
                                        {acc.type === 'Prop Firm' ? `${acc.prop_firm_name} - ${acc.stage} ${acc.phase || ''}`.trim() : 'Personal'}
                                    </p>
                                </div>
                                <div className="flex justify-between items-center">
                                    <div className="flex items-baseline gap-3">
                                        <p className={`text-2xl font-mono ${balanceColorClass}`}>${acc.balance.toLocaleString()}</p>
                                        {percentageChange !== 0 && (
                                            <div className={`flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full ${percentageChange > 0 ? 'bg-green-500/10 text-green-500' : 'bg-red-500/10 text-red-500'}`}>
                                                {percentageChange > 0 ? <ArrowUpIcon className="w-3 h-3" /> : <ArrowDownIcon className="w-3 h-3" />}
                                                <span>{Math.abs(percentageChange).toFixed(2)}%</span>
                                            </div>
                                        )}
                                    </div>
                                    <button onClick={() => { setAccountToDelete(acc); setShouldDeleteTrades(false); }} className="p-2 rounded-full text-red-500 hover:bg-red-500/10 transition-colors" aria-label={`Delete account ${acc.name}`}>
                                        <TrashIcon className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                        );
                    })}
                </div>
                 <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4 border-t border-slate-200 dark:border-slate-800 pt-6">Add New Account</h3>
                 <form onSubmit={handleAddAccount} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="sm:col-span-2">
                        <label className="block text-sm font-medium text-slate-500 dark:text-slate-400 mb-1">Account Name</label>
                        <input type="text" value={newAccountName} onChange={e => setNewAccountName(e.target.value)} placeholder="e.g. My FTMO Challenge" className={inputStyles} required />
                    </div>
                     <div>
                        <label className="block text-sm font-medium text-slate-500 dark:text-slate-400 mb-1">Initial Balance ($)</label>
                        <input type="number" step="any" value={newAccountBalance} onChange={e => setNewAccountBalance(e.target.value)} placeholder="100000" className={inputStyles} required />
                    </div>
                     <div>
                        <label className="block text-sm font-medium text-slate-500 dark:text-slate-400 mb-1">Account Type</label>
                        <select value={newAccountType} onChange={e => setNewAccountType(e.target.value as any)} className={inputStyles}>
                            <option value="Personal">Personal</option>
                            <option value="Prop Firm">Prop Firm</option>
                        </select>
                    </div>

                    {newAccountType === 'Prop Firm' && (
                        <>
                            <div className="sm:col-span-2">
                                <label className="block text-sm font-medium text-slate-500 dark:text-slate-400 mb-1">Prop Firm Name</label>
                                <input type="text" value={newPropFirmName} onChange={e => setNewPropFirmName(e.target.value)} placeholder="e.g. FTMO" className={inputStyles} required />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-500 dark:text-slate-400 mb-1">Stage</label>
                                <select value={newAccountStage} onChange={e => setNewAccountStage(e.target.value as any)} className={inputStyles}>
                                    <option value="Evaluation">Evaluation</option>
                                    <option value="Live">Live</option>
                                </select>
                            </div>
                            {newAccountStage === 'Evaluation' && (
                                <div>
                                    <label className="block text-sm font-medium text-slate-500 dark:text-slate-400 mb-1">Phase</label>
                                    <select value={newAccountPhase} onChange={e => setNewAccountPhase(e.target.value as any)} className={inputStyles}>
                                        <option value="Phase 1">Phase 1</option>
                                        <option value="Phase 2">Phase 2</option>
                                        <option value="Phase 3">Phase 3</option>
                                    </select>
                                </div>
                            )}
                             <div className="sm:col-span-2 grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-500 dark:text-slate-400 mb-1">Profit Target ($)</label>
                                    <input type="number" step="any" value={newProfitTarget} onChange={e => setNewProfitTarget(e.target.value)} placeholder="110000" className={inputStyles} required={newAccountType === 'Prop Firm'} />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-500 dark:text-slate-400 mb-1">Min Trading Days</label>
                                    <input type="number" value={newMinTradingDays} onChange={e => setNewMinTradingDays(e.target.value)} placeholder="10" className={inputStyles} required={newAccountType === 'Prop Firm'} />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-500 dark:text-slate-400 mb-1">Max Daily Drawdown (%)</label>
                                    <input type="number" step="any" value={newMaxDailyDrawdown} onChange={e => setNewMaxDailyDrawdown(e.target.value)} placeholder="5" className={inputStyles} required={newAccountType === 'Prop Firm'} />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-500 dark:text-slate-400 mb-1">Max Overall Drawdown (%)</label>
                                    <input type="number" step="any" value={newMaxOverallDrawdown} onChange={e => setNewMaxOverallDrawdown(e.target.value)} placeholder="10" className={inputStyles} required={newAccountType === 'Prop Firm'} />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-500 dark:text-slate-400 mb-1">Max Trading Days (opt.)</label>
                                    <input type="number" value={newMaxTradingDays} onChange={e => setNewMaxTradingDays(e.target.value)} placeholder="30" className={inputStyles} />
                                </div>
                            </div>
                        </>
                    )}
                    <button type="submit" className={`${buttonStyles} sm:col-span-2`}>Add Account</button>
                </form>
            </div>
            <CustomTagManager />
            <InstrumentSelector />
            {isAvatarModalOpen && portalContainer && createPortal(
                <AvatarSelectionModal onClose={() => setIsAvatarModalOpen(false)} />,
                portalContainer
            )}
            {accountToDelete && portalContainer && createPortal(
                <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in" onClick={() => setAccountToDelete(null)}>
                    <div className="bg-white dark:bg-slate-800 rounded-lg shadow-xl w-full max-w-sm p-6 text-center animate-fade-in-up" onClick={e => e.stopPropagation()}>
                        <h3 className="text-xl font-bold text-slate-900 dark:text-white">Delete Account?</h3>
                        <p className="text-sm text-slate-500 dark:text-slate-400 my-4">Are you sure you want to delete the account "{accountToDelete.name}"? Trades associated with this account will be unlinked. This action cannot be undone.</p>
                        
                        {tradesForAccount > 0 && (
                            <div className="my-4 p-3 bg-slate-100 dark:bg-slate-700/50 rounded-lg text-left">
                                <label className="flex items-center text-sm text-slate-700 dark:text-slate-300 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={shouldDeleteTrades}
                                        onChange={(e) => setShouldDeleteTrades(e.target.checked)}
                                        className="h-4 w-4 rounded border-gray-300 text-accent-600 focus:ring-accent-500 mr-2"
                                    />
                                    Also delete all {tradesForAccount} associated trades.
                                </label>
                            </div>
                        )}

                        <div className="flex justify-center gap-4 mt-6">
                            <button onClick={() => setAccountToDelete(null)} className="px-6 py-2 rounded-md bg-slate-200 dark:bg-slate-600 hover:bg-slate-300 dark:hover:bg-slate-500 font-semibold">
                                Cancel
                            </button>
                            <button onClick={handleDeleteAccount} className="px-6 py-2 rounded-md bg-red-600 text-white hover:bg-red-700 font-semibold">
                                Confirm Delete
                            </button>
                        </div>
                    </div>
                </div>,
                portalContainer
            )}
        </div>
    );
};

export const UserManagement: React.FC = () => {
    return <Profile />;
};