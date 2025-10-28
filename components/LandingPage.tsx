import React, { useState, useEffect, useRef } from 'react';
import { 
    LogoIcon, AIInsightsIcon, BriefcaseIcon, AnalyticsIcon, CheckCircleIcon,
    MoonIcon, SunIcon, ChevronDownIcon, StarIcon
} from './Icons';
import { useAppContext } from '../context';

// Custom hook for scroll animations
const useScrollAnimate = () => {
    const observer = useRef<IntersectionObserver | null>(null);

    useEffect(() => {
        observer.current = new IntersectionObserver((entries) => {
            entries.forEach((entry) => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('is-visible');
                }
            });
        }, { threshold: 0.1 });

        const elements = document.querySelectorAll('.scroll-animate');
        elements.forEach(el => observer.current?.observe(el));

        return () => {
            elements.forEach(el => observer.current?.unobserve(el));
        };
    }, []);
};


const HamburgerIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg {...props} width="24" height="24" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16m-7 6h7"></path>
    </svg>
);
const XMarkIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg {...props} width="24" height="24" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
  </svg>
);
const QuoteIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
    <path d="M6 17h3l2-4V7H5v6h3zm8 0h3l2-4V7h-6v6h3z" />
  </svg>
);
const XCircleIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 9.75l4.5 4.5m0-4.5l-4.5 4.5M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);


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

const Header: React.FC = () => {
    const { setView } = useAppContext();
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [isScrolled, setIsScrolled] = useState(false);

    useEffect(() => {
        const handleScroll = () => {
            setIsScrolled(window.scrollY > 10);
        };
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    const handleMobileNavClick = (targetView?: 'login' | 'signup' | 'pricing' | 'home', href?: string) => {
        setIsMobileMenuOpen(false);
        if (href) {
            document.querySelector(href)?.scrollIntoView({ behavior: 'smooth' });
        }
        if (targetView) {
            setView(targetView);
        }
    };
    
    const navLinkClasses = "text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition-colors";
    
    const navLinks = (
        <>
            <button onClick={(e) => { e.preventDefault(); handleMobileNavClick(undefined, '#features'); }} className={navLinkClasses}>Features</button>
            <button onClick={(e) => { e.preventDefault(); handleMobileNavClick(undefined, '#pricing'); }} className={navLinkClasses}>Pricing</button>
            <button onClick={() => handleMobileNavClick('login')} className={navLinkClasses}>Login</button>
        </>
    );

    return (
        <header className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${isScrolled ? 'bg-white/80 dark:bg-slate-950/80 backdrop-blur-lg border-b border-slate-200/80 dark:border-slate-800/50' : 'bg-transparent'}`}>
            <div className="container mx-auto px-6 py-4 flex justify-between items-center">
                <button onClick={() => setView('home')} className="flex items-center gap-2">
                    <LogoIcon className="text-accent-500" />
                    <span className="text-xl font-bold text-slate-900 dark:text-white">Tradia</span>
                </button>

                <nav className="hidden md:flex items-center gap-8 text-sm font-medium">
                    {navLinks}
                </nav>

                <div className="hidden md:flex items-center gap-2">
                    <button onClick={() => setView('signup')} className="text-sm font-semibold bg-gradient-to-r from-accent-500 to-green-500 text-white px-5 py-2 rounded-md transition-all duration-300 hover:scale-105 hover:shadow-lg hover:shadow-accent-500/30">
                        Begin Your Journey
                    </button>
                    <ThemeToggle />
                </div>

                <div className="md:hidden flex items-center gap-2">
                    <ThemeToggle />
                    <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white z-50 relative">
                       {isMobileMenuOpen ? <XMarkIcon className="w-6 h-6" /> : <HamburgerIcon className="w-6 h-6" />}
                    </button>
                </div>
            </div>
             {isMobileMenuOpen && (
                <div className="md:hidden bg-white/95 dark:bg-slate-900/95 backdrop-blur-sm border-t border-slate-200 dark:border-slate-800 animate-fade-in">
                    <nav className="container mx-auto px-6 py-4 flex flex-col items-center gap-4">
                        {navLinks}
                        <div className="w-full border-t border-slate-200 dark:border-slate-800 my-2"></div>
                        <button onClick={() => handleMobileNavClick('signup')} className="w-full text-sm font-semibold bg-gradient-to-r from-accent-500 to-green-500 text-white px-5 py-2 rounded-md">
                            Begin Your Journey
                        </button>
                    </nav>
                </div>
            )}
        </header>
    );
};

const DashboardPreview: React.FC = () => {
    const chartRef = useRef<SVGPathElement>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const timer = setTimeout(() => setLoading(false), 1200);
        return () => clearTimeout(timer);
    }, []);

    useEffect(() => {
        if (!loading && chartRef.current) {
            const path = chartRef.current;
            const length = path.getTotalLength();
            path.style.strokeDasharray = `${length}`;
            path.style.strokeDashoffset = `${length}`;
            setTimeout(() => {
                path.style.transition = 'stroke-dashoffset 2s ease-out';
                path.style.strokeDashoffset = '0';
            }, 100);
        }
    }, [loading]);
    
    const StatCard: React.FC<{label: string, value: string, icon: React.ReactNode, isLoading: boolean}> = ({label, value, icon, isLoading}) => (
        <div className="bg-white/50 dark:bg-slate-900/50 rounded-lg p-3 space-y-2">
            {isLoading ? (
                <>
                    <div className="h-3 w-3/4 rounded-full shimmer-bg"></div>
                    <div className="h-6 w-1/2 rounded-full shimmer-bg"></div>
                </>
            ) : (
                <>
                    <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
                        {icon}<span>{label}</span>
                    </div>
                    <div className="text-xl font-bold text-slate-800 dark:text-white">{value}</div>
                </>
            )}
        </div>
    );

    return (
        <div className="mt-20 relative max-w-5xl mx-auto scroll-animate delay-400">
            <div className="absolute -inset-4 bg-gradient-to-br from-accent-500 to-blue-500 rounded-2xl opacity-10 blur-2xl dark:opacity-20"></div>
            <div className="relative bg-white/60 dark:bg-slate-900/60 backdrop-blur-sm border border-slate-200/80 dark:border-slate-800/80 rounded-xl p-2 md:p-4 shadow-2xl shadow-black/30">
                <div className="aspect-[16/9] bg-slate-100/50 dark:bg-slate-800/50 rounded-lg p-2 md:p-4 border border-slate-200 dark:border-slate-800 overflow-hidden relative">
                    <div className="w-full h-full grid grid-cols-3 grid-rows-3 gap-4">
                        <div className="col-span-3 bg-white/50 dark:bg-slate-900/50 rounded-lg p-3 flex items-center justify-between">
                             {loading ? <div className="h-6 w-1/4 rounded-full shimmer-bg"></div> : <p className="text-xl font-bold text-slate-800 dark:text-white">$108,345.19</p>}
                             {loading ? <div className="h-6 w-1/6 rounded-full shimmer-bg"></div> : <p className="text-sm font-semibold px-2 py-1 rounded-full bg-green-500/10 text-green-500">+8.35%</p>}
                        </div>
                        <div className="col-span-2 row-span-2 bg-white/50 dark:bg-slate-900/50 rounded-lg p-2 flex flex-col justify-end relative">
                            <svg className="w-full h-full absolute inset-0" preserveAspectRatio="none">
                                <path ref={chartRef} d="M0,80 C50,20 100,100 200,60 S300,10 400,70 S500,120 600,80" stroke="url(#chart-gradient)" strokeWidth="2.5" fill={loading ? 'none' : "url(#chart-fill)"} vectorEffect="non-scaling-stroke" />
                                <defs>
                                    <linearGradient id="chart-gradient" x1="0%" y1="0%" x2="100%" y2="0%"><stop offset="0%" stopColor="#4ade80" /><stop offset="100%" stopColor="#3b82f6" /></linearGradient>
                                    <linearGradient id="chart-fill" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#4ade80" stopOpacity={0.3}/>
                                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                                    </linearGradient>
                                </defs>
                            </svg>
                        </div>
                        <StatCard isLoading={loading} label="Win Rate" value="62.5%" icon={<CheckCircleIcon className="w-3 h-3"/>} />
                        <StatCard isLoading={loading} label="Profit Factor" value="2.18" icon={<AnalyticsIcon className="w-3 h-3"/>} />
                    </div>
                </div>
            </div>
        </div>
    );
};

const FAQItem: React.FC<{ question: string; children: React.ReactNode; }> = ({ question, children }) => {
    const [isOpen, setIsOpen] = useState(false);
    return (
        <div className="border-b border-slate-200/80 dark:border-slate-800/80 py-4">
            <button onClick={() => setIsOpen(!isOpen)} className="w-full flex justify-between items-center text-left text-slate-800 dark:text-white font-semibold">
                <span>{question}</span>
                <ChevronDownIcon className={`w-5 h-5 text-slate-400 transform transition-transform ${isOpen ? 'rotate-180' : ''}`} />
            </button>
            {isOpen && <div className="mt-3 text-slate-600 dark:text-slate-400 text-sm animate-fade-in">{children}</div>}
        </div>
    );
};


const LandingPage: React.FC = () => {
    const { setView } = useAppContext();
    useScrollAnimate();

    useEffect(() => {
        document.querySelector('html')!.style.scrollBehavior = 'smooth';
        return () => { document.querySelector('html')!.style.scrollBehavior = 'auto'; };
    }, []);
    
    const features = [
        { 
            icon: <AIInsightsIcon className="w-6 h-6" />, 
            title: 'Your Personal AI Trading Coach', 
            subtitle: 'AI-Powered Self-Discovery',
            description: 'Go beyond simple P&L. Tradia’s AI delves deep into your trading data to give you personalized, actionable feedback on every trade. Discover your most profitable setups, pinpoint costly behavioral patterns, and get concrete suggestions to sharpen your edge, day after day.',
            visual: (
                <div className="relative w-full h-full bg-slate-100 dark:bg-slate-800/50 rounded-lg p-4 flex flex-col justify-center items-center text-center">
                    <div className="bg-white dark:bg-slate-900 rounded-lg p-4 shadow-lg w-full max-w-xs border border-yellow-400/50">
                        <AIInsightsIcon className="w-8 h-8 text-yellow-400 mx-auto mb-2"/>
                        <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">AI Quick Insight</p>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 italic">"Your win rate on <span className="font-bold text-accent-500">XAU/USD</span> is <span className="font-bold text-accent-500">25% higher</span> during the London session."</p>
                    </div>
                </div>
            )
        },
        { 
            icon: <BriefcaseIcon className="w-6 h-6" />,
            title: 'Conquer Your Prop Firm Challenge', 
            subtitle: 'Freedom Through Discipline',
            description: 'Juggling multiple prop firm accounts is stressful. The Tradia Prop Firm Hub is your central command center. We track every rule—profit targets, daily drawdown, max loss—across all your challenges in real-time. Stop worrying about violations and focus on what you do best: trading.',
            visual: (
                <div className="relative w-full h-full bg-slate-100 dark:bg-slate-800/50 rounded-lg p-4 flex flex-col justify-center">
                    <div className="bg-white dark:bg-slate-900 rounded-lg p-4 shadow-lg w-full max-w-xs mx-auto space-y-3">
                        {[ {label: "Profit Target", percent: 75, color:"bg-green-500"}, {label: "Daily Drawdown", percent: 40, color:"bg-yellow-500"}, {label: "Max Drawdown", percent: 20, color:"bg-red-500"} ].map(item => (
                            <div key={item.label} className="animate-fade-in-up" style={{ animationDelay: `${item.percent*5}ms` }}>
                                <div className="flex justify-between text-xs font-medium text-slate-600 dark:text-slate-300"><p>{item.label}</p><p>{item.percent}%</p></div>
                                <div className="w-full bg-slate-200 dark:bg-slate-700 h-2.5 rounded-full mt-1 overflow-hidden"><div className={`${item.color} h-2.5 rounded-full transition-all duration-500`} style={{width: `${item.percent}%`}}></div></div>
                            </div>
                        ))}
                    </div>
                </div>
            )
        },
        { 
            icon: <AnalyticsIcon className="w-6 h-6" />,
            title: 'A Unified View of Your Trading Journey', 
            subtitle: 'Your Trading Story, Told in Data',
            description: 'No more fragmented spreadsheets. Tradia consolidates your entire trading history from every account into one powerful, interactive dashboard. Visualize your growth with a unified equity curve, analyze performance by any metric imaginable, and finally see the complete story your data is telling you.',
            visual: (
                <div className="relative w-full h-full bg-slate-100 dark:bg-slate-800/50 rounded-lg p-4 grid grid-cols-3 grid-rows-3 gap-2">
                    <div className="col-span-3 row-span-2 bg-white/50 dark:bg-slate-900/50 rounded-lg shadow-inner p-2 relative animate-fade-in-up" style={{ animationDelay: '100ms' }}>
                        <svg className="w-full h-full" preserveAspectRatio="none" viewBox="0 0 300 100">
                            <defs>
                                <linearGradient id="unified-analytics-fill" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.4}/>
                                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                                </linearGradient>
                            </defs>
                            <path d="M0,80 C30,70 50,40 80,50 S130,90 180,70 S230,20 270,30 L300,20" stroke="#6366f1" strokeWidth="2" fill="url(#unified-analytics-fill)" vectorEffect="non-scaling-stroke" />
                            <circle cx="80" cy="50" r="2.5" fill="#fff" stroke="#4f46e5" strokeWidth="1.5" />
                            <circle cx="180" cy="70" r="2.5" fill="#fff" stroke="#16a34a" strokeWidth="1.5" />
                            <circle cx="270" cy="30" r="2.5" fill="#fff" stroke="#4f46e5" strokeWidth="1.5" />
                        </svg>
                        <div className="absolute top-2 right-2 flex items-center gap-1.5 text-[10px] text-slate-500 dark:text-slate-400">
                            <span className="w-1.5 h-1.5 rounded-full bg-[#4f46e5]"></span> Acct 1
                            <span className="w-1.5 h-1.5 rounded-full bg-[#16a34a]"></span> Acct 2
                        </div>
                    </div>
                    
                    <div className="bg-white/80 dark:bg-slate-900/80 p-2 rounded-lg text-center flex flex-col justify-center animate-fade-in-up" style={{ animationDelay: '200ms' }}>
                        <p className="text-[10px] text-slate-500">Win Rate</p>
                        <p className="font-bold text-base text-green-500">68%</p>
                    </div>
                    <div className="bg-white/80 dark:bg-slate-900/80 p-2 rounded-lg text-center flex flex-col justify-center animate-fade-in-up" style={{ animationDelay: '300ms' }}>
                        <p className="text-[10px] text-slate-500">Profit Factor</p>
                        <p className="font-bold text-base text-slate-800 dark:text-white">2.31</p>
                    </div>
                    <div className="bg-white/80 dark:bg-slate-900/80 p-2 rounded-lg text-center flex flex-col justify-center animate-fade-in-up" style={{ animationDelay: '400ms' }}>
                        <p className="text-[10px] text-slate-500">Total Trades</p>
                        <p className="font-bold text-base text-slate-800 dark:text-white">142</p>
                    </div>
                </div>
            )
        },
    ];
    
    const testimonials = [
        { name: 'Alex R.', role: 'FTMO Trader', text: 'Tradia\'s Prop Firm Hub is a game-changer. It saved me from violating my daily drawdown twice. It\'s a must-have for any serious prop trader.', avatar: 'https://api.dicebear.com/8.x/adventurer/svg?seed=alex-r' },
        { name: 'Jessica M.', role: 'Swing Trader', text: 'The AI insights are shockingly accurate. It pointed out a pattern of over-leveraging on Fridays that I had completely missed. My P&L has improved since.', avatar: 'https://api.dicebear.com/8.x/adventurer/svg?seed=jessica-m' },
    ];
    
    const firms = [ 'FTMO', 'The Funded Trader', 'Apex Trader Funding', 'Topstep', 'MyForexFunds', 'TradingView', 'MetaTrader 5', 'cTrader'];

    return (
        <div className="bg-slate-50 dark:bg-slate-950 text-slate-700 dark:text-slate-300">
            <div className="aurora-background"></div>
            <Header />

            <main>
                <section className="pt-40 pb-20 text-center relative overflow-hidden">
                    <div className="container mx-auto px-6 relative z-10">
                        <h1 className="text-4xl md:text-6xl font-extrabold text-slate-900 dark:text-white leading-tight tracking-tighter scroll-animate">
                            Your Trading Edge, Finally Quantified.
                        </h1>
                        <p className="mt-6 max-w-2xl mx-auto text-lg text-slate-600 dark:text-slate-400 scroll-animate delay-200">
                            Tradia is the intelligent trading journal that does more than just record your trades—it reveals your unique path to profitability. Connect your accounts, log your decisions, and let our AI co-pilot transform your data into a clear, actionable strategy for consistent growth.
                        </p>
                        <div className="mt-10 flex justify-center gap-4 scroll-animate delay-300">
                            <button onClick={() => setView('signup')} className="text-base font-semibold bg-gradient-to-r from-accent-500 to-green-500 text-white px-8 py-3 rounded-md transition-all duration-300 hover:scale-105 hover:shadow-lg hover:shadow-accent-500/30">Begin Your Journey—Free</button>
                        </div>
                        <DashboardPreview />
                    </div>
                </section>

                <section className="py-16 scroll-animate">
                    <div className="container mx-auto px-6 text-center">
                        <p className="text-sm font-semibold text-slate-500 dark:text-slate-400 tracking-wider uppercase">For Traders at Top Firms & Platforms</p>
                         <div className="mt-8 logo-ticker-container group">
                            <div className="logo-ticker-track">
                                {[...firms, ...firms].map((firm, index) => (
                                    <div key={index} className="flex-shrink-0 w-48 flex items-center justify-center p-4">
                                        <span className="text-xl font-semibold text-slate-400 dark:text-slate-600 transition-all duration-300 group-hover:text-slate-600 dark:group-hover:text-slate-400">
                                            {firm}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </section>
                
                 <section className="py-20 bg-white/50 dark:bg-slate-950/50">
                     <div className="container mx-auto px-6">
                        <div className="text-center max-w-2xl mx-auto scroll-animate">
                            <h2 className="text-3xl md:text-4xl font-bold text-slate-900 dark:text-white">From Market Noise to Mental Clarity.</h2>
                            <p className="mt-4 text-slate-500 dark:text-slate-400">The path to consistent profitability isn't found in a holy grail indicator. It's found in your own data.</p>
                        </div>
                        <div className="mt-16 grid grid-cols-1 lg:grid-cols-2 gap-8">
                            <div className="scroll-animate p-6 rounded-lg bg-red-500/5 dark:bg-red-500/10 border border-red-500/20">
                                <h3 className="font-semibold text-red-600 dark:text-red-400 flex items-center gap-2"><XCircleIcon className="w-5 h-5"/>The Old Way: The Fog of War</h3>
                                <p className="text-sm mt-2 text-slate-600 dark:text-slate-400">You're in the trenches, navigating the markets on gut feeling and adrenaline. Your 'journal' is a chaotic mix of spreadsheets, screenshots, and forgotten notes—a graveyard of painful lessons and missed opportunities, with no clear path forward.</p>
                            </div>
                             <div className="scroll-animate delay-100 p-6 rounded-lg bg-accent-500/5 dark:bg-accent-500/10 border border-accent-500/20">
                                <h3 className="font-semibold text-accent-600 dark:text-accent-400 flex items-center gap-2"><CheckCircleIcon className="w-5 h-5"/>The Tradia Way: The Light of Insight</h3>
                                <p className="text-sm mt-2 text-slate-600 dark:text-slate-400">Tradia brings order to the chaos. Our intelligent platform systematically analyzes every decision—your entries, exits, psychology, and market conditions—to reveal your true statistical edge. It’s not about finding a new strategy; it’s about perfecting yours.</p>
                            </div>
                        </div>
                    </div>
                </section>

                <section id="features" className="py-20">
                    <div className="container mx-auto px-6 space-y-24">
                        {features.map((feature, index) => (
                            <div key={feature.title} className={`grid grid-cols-1 lg:grid-cols-2 gap-12 items-center scroll-animate`}>
                                <div className={index % 2 === 1 ? 'lg:order-2' : ''}>
                                    <div className="inline-flex items-center gap-2 bg-accent-500/10 text-accent-500 px-3 py-1 rounded-full text-sm font-semibold mb-3">
                                        {feature.icon}
                                        <span>{feature.subtitle}</span>
                                    </div>
                                    <h3 className="text-3xl font-bold text-slate-900 dark:text-white">{feature.title}</h3>
                                    <p className="mt-4 text-slate-600 dark:text-slate-400">{feature.description}</p>
                                </div>
                                <div className={`relative h-72 ${index % 2 === 1 ? 'lg:order-1' : ''}`}>
                                    <div className="absolute -inset-4 bg-gradient-to-br from-accent-500/50 to-blue-500/50 rounded-2xl opacity-10 blur-xl"></div>
                                    {feature.visual}
                                </div>
                            </div>
                        ))}
                    </div>
                </section>
                
                 <section className="py-20 bg-white/50 dark:bg-slate-950/50">
                     <div className="container mx-auto px-6">
                        <div className="text-center max-w-2xl mx-auto scroll-animate">
                            <h2 className="text-3xl md:text-4xl font-bold text-slate-900 dark:text-white">Built by traders, for traders.</h2>
                        </div>
                        <div className="mt-12 grid grid-cols-1 lg:grid-cols-2 gap-8">
                            {testimonials.map((t, i) => (
                                <div key={t.name} className="bg-white dark:bg-slate-900/50 p-6 rounded-xl border border-slate-200 dark:border-slate-800 scroll-animate relative" style={{ transitionDelay: `${i * 150}ms` }}>
                                    <QuoteIcon className="absolute top-4 right-4 w-12 h-12 text-slate-100 dark:text-slate-800" />
                                    <div className="flex text-yellow-400">
                                        {[...Array(5)].map((_, i) => <StarIcon key={i} className="w-5 h-5"/>)}
                                    </div>
                                    <p className="mt-4 text-slate-600 dark:text-slate-300 relative">"{t.text}"</p>
                                    <div className="mt-4 flex items-center gap-3">
                                        <img src={t.avatar} alt={t.name} className="w-10 h-10 rounded-full" />
                                        <div>
                                            <p className="font-semibold text-slate-900 dark:text-white">{t.name}</p>
                                            <p className="text-sm text-slate-500 dark:text-slate-400">{t.role}</p>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                 <section id="pricing" className="py-20">
                    <div className="container mx-auto px-6">
                         <div className="text-center max-w-2xl mx-auto scroll-animate">
                            <h2 className="text-3xl md:text-4xl font-bold text-slate-900 dark:text-white">Find the Perfect Plan for Your Journey.</h2>
                            <p className="mt-4 text-slate-500 dark:text-slate-400">Begin with our free plan and ascend when you're ready to master your craft.</p>
                        </div>
                        <div className="mt-8 grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-3xl mx-auto">
                           {[ {name: 'Free', price: 0, description: 'For traders getting started.', features: ['Manual Trade Journaling', 'Basic Performance Analytics', '1 Trading Account']}, {name: 'Pro', price: 24.99, description: 'For dedicated prop firm traders.', features: ['All Free Features', 'AI-Powered Trade Analysis', 'Prop Firm Hub & Rule Tracking', 'Unlimited Accounts'], primary: true} ].map(plan => (
                                <div key={plan.name} className={`bg-white dark:bg-slate-900/50 p-8 rounded-2xl border ${plan.primary ? 'border-accent-500/50 shadow-accent-500/10' : 'border-slate-200 dark:border-slate-800'} shadow-xl scroll-animate`}>
                                    <h3 className="text-xl font-bold text-slate-900 dark:text-white">{plan.name}</h3>
                                    <p className="text-slate-500 dark:text-slate-400 mt-2 h-10">{plan.description}</p>
                                    <p className="mt-6">
                                        <span className="text-4xl font-extrabold text-slate-900 dark:text-white">${plan.price}</span>
                                        <span className="text-slate-500 dark:text-slate-400">/ {plan.name === 'Free' ? 'forever' : 'month'}</span>
                                    </p>
                                    <button onClick={() => setView('signup')} className={`w-full mt-6 text-sm font-semibold py-3 rounded-md transition-all duration-300 ${plan.primary ? 'bg-gradient-to-r from-accent-500 to-green-500 text-white hover:scale-105' : 'bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300'}`}>
                                        {plan.name === 'Free' ? 'Start for Free' : 'Start Pro Trial'}
                                    </button>
                                    <ul className="mt-8 space-y-3 text-sm">
                                        {plan.features.map(f => (
                                            <li key={f} className="flex items-start gap-3 text-slate-600 dark:text-slate-300"><CheckCircleIcon className="w-5 h-5 text-accent-500 flex-shrink-0 mt-0.5" /> {f}</li>
                                        ))}
                                    </ul>
                                </div>
                            ))}
                        </div>
                        <div className="text-center mt-8 scroll-animate">
                             <button onClick={() => setView('pricing')} className="text-sm font-semibold text-accent-500 hover:text-accent-400">View full pricing details &rarr;</button>
                        </div>
                    </div>
                </section>
                
                <section className="py-20 bg-white/50 dark:bg-slate-950/50">
                    <div className="container mx-auto px-6 max-w-3xl scroll-animate">
                        <h2 className="text-3xl font-bold text-slate-900 dark:text-white text-center">Frequently Asked Questions</h2>
                        <div className="mt-8">
                            <FAQItem question="Is my trading data secure?">Yes. Your data is encrypted and stored securely. We do not share your trading data with anyone. It remains completely private to you.</FAQItem>
                            <FAQItem question="Can I use it with multiple prop firms?">Absolutely. The Pro plan allows you to connect and track an unlimited number of accounts from any prop firm or personal brokerage.</FAQItem>
                            <FAQItem question="What kind of data can I import?">You can easily import your trading history using a standard CSV file from platforms like MetaTrader 5. We provide a template to make it simple. Direct broker integration is coming soon!</FAQItem>
                            <FAQItem question="Can I cancel anytime?">Of course. You can cancel your Pro subscription at any time from your profile settings, no questions asked.</FAQItem>
                        </div>
                    </div>
                </section>

                <section className="py-20">
                    <div className="container mx-auto px-6 text-center scroll-animate">
                        <h2 className="text-3xl md:text-4xl font-bold text-slate-900 dark:text-white">Your evolution as a trader starts now.</h2>
                        <p className="mt-4 max-w-xl mx-auto text-slate-500 dark:text-slate-400">Join thousands of traders who are leaving guesswork behind and building lasting consistency through data, discipline, and deep insight.</p>
                        <div className="mt-8">
                             <button onClick={() => setView('signup')} className="text-base font-semibold bg-gradient-to-r from-accent-500 to-green-500 text-white px-8 py-3 rounded-md transition-all duration-300 hover:scale-105 hover:shadow-lg hover:shadow-accent-500/30">Claim Your Free Account</button>
                        </div>
                    </div>
                </section>
            </main>

            <footer className="bg-slate-100 dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800">
                <div className="container mx-auto px-6 py-8 text-center text-slate-500 text-sm">
                    <p>&copy; {new Date().getFullYear()} Tradia. All rights reserved.</p>
                     <div className="flex justify-center gap-6 mt-4">
                        <button className="hover:text-slate-900 dark:hover:text-white">Privacy</button>
                        <button className="hover:text-slate-900 dark:hover:text-white">Terms</button>
                        <button className="hover:text-slate-900 dark:hover:text-white">Contact</button>
                    </div>
                    <p className="mt-4 text-xs">Made with ❤️ from Tradia</p>
                </div>
            </footer>
        </div>
    );
};
export default LandingPage;