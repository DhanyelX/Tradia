import React, { useState, useEffect } from 'react';
import { 
    LogoIcon, CheckCircleIcon, ChevronDownIcon,
    SunIcon, MoonIcon
} from './Icons';
import { useAppContext } from '../context';

// Re-using the theme toggle from LandingPage.tsx
const ThemeToggle: React.FC<{className?: string}> = ({className}) => {
  const { theme, toggleTheme } = useAppContext();
  return (
    <button
      onClick={toggleTheme}
      className={`p-2 rounded-full text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-slate-700/50 transition-colors ${className}`}
      aria-label="Toggle theme"
    >
      {theme === 'light' ? <MoonIcon className="w-5 h-5"/> : <SunIcon className="w-5 h-5"/>}
    </button>
  );
};

// Simplified Header for the pricing page
const PricingHeader: React.FC = () => {
    const { setView } = useAppContext();
    return (
        <header className='sticky top-0 z-50 bg-white/80 dark:bg-slate-950/80 backdrop-blur-lg border-b border-slate-200/80 dark:border-slate-800/50'>
            <div className="container mx-auto px-6 py-4 flex justify-between items-center">
                <button onClick={() => setView('home')} className="flex items-center gap-2">
                    <LogoIcon className="text-accent-500" />
                    <span className="text-xl font-bold text-slate-900 dark:text-white">Tradia</span>
                </button>
                <div className="flex items-center gap-2">
                    <button onClick={() => setView('home')} className="text-sm font-medium text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition-colors">
                        Back to Home
                    </button>
                    <ThemeToggle />
                </div>
            </div>
        </header>
    );
};


const FAQItem: React.FC<{ question: string; children: React.ReactNode; }> = ({ question, children }) => {
    const [isOpen, setIsOpen] = useState(false);
    return (
        <div className="border-b border-slate-200 dark:border-slate-800 py-4">
            <button onClick={() => setIsOpen(!isOpen)} className="w-full flex justify-between items-center text-left text-slate-800 dark:text-white font-semibold">
                <span>{question}</span>
                <ChevronDownIcon className={`w-5 h-5 text-slate-400 transform transition-transform ${isOpen ? 'rotate-180' : ''}`} />
            </button>
            {isOpen && <div className="mt-3 text-slate-600 dark:text-slate-400 text-sm animate-fade-in">{children}</div>}
        </div>
    );
};

const PricingPage: React.FC = () => {
    const { setView } = useAppContext();
    const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly');
    
    const pricing = {
        monthly: { free: 0, pro: 24.99 },
        yearly: { free: 0, pro: 19.99 },
    };

    return (
        <div className="bg-slate-50 dark:bg-slate-950 text-slate-700 dark:text-slate-300">
            <div className="aurora-background"></div>
            <PricingHeader />

            <main>
                <section id="pricing" className="py-20">
                    <div className="container mx-auto px-6">
                         <div className="text-center max-w-2xl mx-auto">
                            <h2 className="text-3xl md:text-4xl font-bold text-slate-900 dark:text-white">Simple, transparent pricing.</h2>
                            <p className="mt-4 text-slate-500 dark:text-slate-400">Start for free, upgrade when you're ready.</p>
                        </div>
                        <div className="mt-8 flex justify-center">
                             <div className="flex items-center gap-2 bg-slate-200 dark:bg-slate-800 p-1 rounded-lg">
                                <button onClick={() => setBillingCycle('monthly')} className={`px-4 py-1.5 text-sm font-medium rounded-md transition-all ${billingCycle === 'monthly' ? 'bg-white dark:bg-slate-700 shadow text-slate-900 dark:text-white' : 'text-slate-500 dark:text-slate-400'}`}>Monthly</button>
                                <button onClick={() => setBillingCycle('yearly')} className={`px-4 py-1.5 text-sm font-medium rounded-md transition-all relative ${billingCycle === 'yearly' ? 'bg-white dark:bg-slate-700 shadow text-slate-900 dark:text-white' : 'text-slate-500 dark:text-slate-400'}`}>Yearly <span className="absolute -top-2 -right-2 text-[10px] bg-accent-500 text-white px-1.5 py-0.5 rounded-full">Save 20%</span></button>
                            </div>
                        </div>
                        <div className="mt-8 grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-4xl mx-auto">
                            {[ {name: 'Free', price: pricing[billingCycle].free, description: 'Basic analytics and manual entries for one account.', features: ['Manual Trade Journaling', 'Basic Performance Analytics', '1 Trading Account', 'Community Access']}, {name: 'Pro', price: pricing[billingCycle].pro, description: 'AI insights, prop firm integration, and multi-account support.', features: ['All Free Features', 'AI-Powered Trade Analysis', 'Prop Firm Hub & Rule Tracking', 'Unlimited Accounts', 'Advanced Analytics'], primary: true} ].map(plan => (
                                <div key={plan.name} className={`bg-white dark:bg-slate-900/50 p-8 rounded-2xl border ${plan.primary ? 'border-accent-500/50' : 'border-slate-200 dark:border-slate-800'}`}>
                                    <h3 className="text-xl font-bold text-slate-900 dark:text-white">{plan.name}</h3>
                                    <p className="text-slate-500 dark:text-slate-400 mt-2 h-10">{plan.description}</p>
                                    <p className="mt-6">
                                        <span className="text-4xl font-extrabold text-slate-900 dark:text-white">${plan.price}</span>
                                        <span className="text-slate-500 dark:text-slate-400">/ {plan.name === 'Free' ? 'forever' : 'month'}</span>
                                    </p>
                                    <button onClick={() => setView('signup')} className={`w-full mt-6 text-sm font-semibold py-3 rounded-md transition-all duration-300 ${plan.primary ? 'bg-gradient-to-r from-accent-500 to-green-500 text-white hover:scale-105' : 'bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300'}`}>
                                        {plan.name === 'Free' ? 'Start Free' : 'Upgrade to Pro'}
                                    </button>
                                    <ul className="mt-8 space-y-3 text-sm">
                                        {plan.features.map(f => (
                                            <li key={f} className="flex items-center gap-3 text-slate-600 dark:text-slate-300"><CheckCircleIcon className="w-5 h-5 text-accent-500" /> {f}</li>
                                        ))}
                                    </ul>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                <section className="py-20 bg-slate-100 dark:bg-slate-950/50">
                    <div className="container mx-auto px-6 max-w-3xl">
                        <h2 className="text-3xl font-bold text-slate-900 dark:text-white text-center">Frequently Asked Questions</h2>
                        <div className="mt-8">
                            <FAQItem question="Is my trading data secure?">Yes. Your data is encrypted and stored securely. We do not share your trading data with anyone. It remains completely private to you.</FAQItem>
                            <FAQItem question="Can I use it with multiple prop firms?">Absolutely. The Pro plan allows you to connect and track an unlimited number of accounts from any prop firm or personal brokerage.</FAQItem>
                            <FAQItem question="Do I need to connect MT4/MT5?">Not yet. Currently, you can import trades via a standard MT5 CSV export. Direct integration is on our roadmap for the future.</FAQItem>
                            <FAQItem question="Is there a free plan?">Yes, our free plan provides basic journaling and analytics for a single account so you can experience the core features of Tradia forever.</FAQItem>
                            <FAQItem question="Can I cancel anytime?">Of course. You can cancel your Pro subscription at any time from your profile settings, no questions asked.</FAQItem>
                        </div>
                    </div>
                </section>
            </main>

            <footer className="bg-slate-100 dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800">
                <div className="container mx-auto px-6 py-8 text-center text-slate-500 text-sm">
                    <p>&copy; {new Date().getFullYear()} Tradia. All rights reserved.</p>
                     <div className="flex justify-center gap-6 mt-4">
                        <a href="#" className="hover:text-slate-900 dark:hover:text-white">Privacy</a>
                        <a href="#" className="hover:text-slate-900 dark:hover:text-white">Terms</a>
                        <a href="#" className="hover:text-slate-900 dark:hover:text-white">Contact</a>
                    </div>
                </div>
            </footer>
        </div>
    );
};

export default PricingPage;