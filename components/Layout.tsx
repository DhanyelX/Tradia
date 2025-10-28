
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useAppContext } from '../context';
import { View, Notification, NotificationType } from '../types';
import { 
    DashboardIcon, TradesIcon, ProfileIcon, SunIcon, MoonIcon, LogoutIcon, PlusIcon, 
    SidebarCollapseIcon, CalendarIcon, AnalyticsIcon, JournalIcon, CommunityIcon,
    ChevronDownIcon, AnalyticsOverviewIcon, PerformanceBreakdownIcon,
    AIInsightsIcon, ChevronLeftIcon, PsychologyBehaviorIcon, Avatar, LogoIcon, 
    StrategyInsightsIcon, BriefcaseIcon, ToolboxIcon, CalculatorIcon, RiskOfRuinIcon, ClockIcon,
    DocumentArrowDownIcon, BellIcon, CheckCircleIcon, XMarkIcon, BeakerIcon, TagIcon
} from './Icons';
import { ImmersiveJournalEntry } from './ImmersiveJournalEntry';

function useOnClickOutside(ref: React.RefObject<HTMLElement>, handler: (event: MouseEvent | TouchEvent) => void) {
  useEffect(
    () => {
      const listener = (event: MouseEvent | TouchEvent) => {
        if (!ref.current || ref.current.contains(event.target as Node)) {
          return;
        }
        handler(event);
      };
      document.addEventListener("mousedown", listener);
      document.addEventListener("touchstart", listener);
      return () => {
        document.removeEventListener("mousedown", listener);
        document.removeEventListener("touchstart", listener);
      };
    },
    [ref, handler]
  );
}

const formatTimeAgo = (date: Date): string => {
    const seconds = Math.floor((new Date().getTime() - new Date(date).getTime()) / 1000);
    let interval = seconds / 31536000;
    if (interval > 1) return Math.floor(interval) + " years ago";
    interval = seconds / 2592000;
    if (interval > 1) return Math.floor(interval) + " months ago";
    interval = seconds / 86400;
    if (interval > 1) return Math.floor(interval) + " days ago";
    interval = seconds / 3600;
    if (interval > 1) return Math.floor(interval) + " hours ago";
    interval = seconds / 60;
    if (interval > 1) return Math.floor(interval) + " minutes ago";
    return Math.floor(seconds) + " seconds ago";
}

const NotificationItem: React.FC<{ notification: Notification, onMarkAsRead: (id: string) => void, onLinkClick: (link: View) => void }> = ({ notification, onMarkAsRead, onLinkClick }) => {
    
    const getIcon = (type: NotificationType) => {
        const iconProps = { className: "w-5 h-5" };
        switch (type) {
            case 'report': return <DocumentArrowDownIcon {...iconProps} />;
            case 'drawdown': return <RiskOfRuinIcon {...iconProps} />;
            case 'reminder': return <JournalIcon {...iconProps} />;
            case 'news': return <CalendarIcon {...iconProps} />;
            default: return <BellIcon {...iconProps} />;
        }
    };
    
    const handleItemClick = () => {
        if (notification.link) {
            onLinkClick(notification.link);
        }
        if (!notification.is_read) {
            onMarkAsRead(notification.id);
        }
    };

    return (
        <div 
            className={`flex items-start gap-3 p-3 transition-colors duration-200 ${notification.link ? 'cursor-pointer' : ''}`}
            onClick={handleItemClick}
        >
            {!notification.is_read && <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0 animate-pulse"></div>}
            <div className={`text-slate-500 dark:text-slate-400 flex-shrink-0 mt-1 ${notification.is_read ? 'ml-5' : ''}`}>{getIcon(notification.type)}</div>
            <div className="flex-grow">
                <p className={`text-sm ${notification.is_read ? 'text-slate-500 dark:text-slate-400' : 'text-slate-800 dark:text-slate-200'}`}>{notification.message}</p>
                <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">{formatTimeAgo(notification.timestamp)}</p>
            </div>
            {!notification.is_read && (
                <button 
                    onClick={(e) => { e.stopPropagation(); onMarkAsRead(notification.id); }} 
                    className="p-1 rounded-full text-slate-400 hover:text-green-500 hover:bg-green-500/10 flex-shrink-0"
                    title="Mark as read"
                >
                    <CheckCircleIcon className="w-5 h-5" />
                </button>
            )}
        </div>
    );
};

const NotificationDropdown: React.FC<{ 
    onClose: () => void;
    onLinkClick: (link: View) => void;
}> = ({ onClose, onLinkClick }) => {
    const { notifications, markNotificationAsRead, markAllNotificationsAsRead } = useAppContext();
    
    return (
        <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white dark:bg-slate-800 rounded-lg shadow-2xl z-30 border border-slate-200 dark:border-slate-700 animate-fade-in">
            <div className="flex justify-between items-center p-3 border-b border-slate-200 dark:border-slate-700">
                <h3 className="font-semibold text-slate-900 dark:text-white">Notifications</h3>
                <button onClick={markAllNotificationsAsRead} className="text-xs font-semibold text-accent-500 hover:text-accent-400 disabled:opacity-50" disabled={notifications.every(n => n.is_read)}>
                    Clear All
                </button>
            </div>
            <div className="max-h-96 overflow-y-auto">
                {notifications.length > 0 ? (
                    notifications.map(n => (
                        <div key={n.id} className="border-b border-slate-100 dark:border-slate-700/50 last:border-b-0">
                            <NotificationItem notification={n} onMarkAsRead={markNotificationAsRead} onLinkClick={(link) => { onLinkClick(link); onClose(); }} />
                        </div>
                    ))
                ) : (
                    <div className="p-8 text-center text-sm text-slate-500 dark:text-slate-400">
                        <BellIcon className="w-8 h-8 mx-auto mb-2"/>
                        You have no new notifications.
                    </div>
                )}
            </div>
        </div>
    );
};


const ThemeToggle: React.FC = () => {
  const { theme, toggleTheme } = useAppContext();
  return (
    <button
      onClick={toggleTheme}
      className="p-2 rounded-full text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-slate-700/50 transition-colors"
      aria-label="Toggle theme"
    >
      {theme === 'light' ? <MoonIcon className="w-5 h-5"/> : <SunIcon className="w-5 h-5"/>}
    </button>
  );
};

const Header: React.FC<{onToggleSidebar: () => void}> = ({onToggleSidebar}) => {
    const { user, logout, view, setView, notifications } = useAppContext();
    const [dropdownOpen, setDropdownOpen] = useState(false);
    const [notificationsOpen, setNotificationsOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);
    const notificationsRef = useRef<HTMLDivElement>(null);

    useOnClickOutside(dropdownRef, () => setDropdownOpen(false));
    useOnClickOutside(notificationsRef, () => setNotificationsOpen(false));

    const unreadCount = useMemo(() => notifications.filter(n => !n.is_read).length, [notifications]);

    const viewTitles: Record<string, string> = {
        dashboard: 'Dashboard',
        trades: 'Trade History',
        'economic-calendar': 'Economic Calendar',
        analytics: 'Performance Analytics',
        'analytics-overview': 'Analytics: Overview',
        'analytics-performance-breakdown': 'Analytics: Performance Breakdown',
        'analytics-psychology-behavior': 'Analytics: Psychology & Behavior',
        'analytics-ai-insights': 'Analytics: AI Insights',
        'analytics-cost-analysis': 'Analytics: Cost Analysis',
        journal: 'Trading Journal',
        playbooks: 'Strategy Playbooks',
        'prop-firm-hub': 'Prop Firm Hub',
        'position-size-calculator': 'Position Size Calculator',
        'risk-of-ruin-calculator': 'Risk of Ruin Calculator',
        'session-time-converter': 'Session Time Converter',
        simulations: 'Simulations',
        reports: 'Performance Reports',
        community: 'Community Hub',
        profile: 'User Profile'
    };

    return (
        <header className="bg-white/60 dark:bg-slate-900/60 backdrop-blur-lg h-16 flex items-center justify-between px-6 border-b border-slate-200/80 dark:border-slate-800/80 fixed top-0 right-0 left-0 z-20 transition-all duration-300">
            <div className="flex items-center gap-4">
              <button onClick={onToggleSidebar} className="p-1 -ml-2 rounded-full text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-slate-700/50">
                <SidebarCollapseIcon />
              </button>
              <h1 className="text-xl font-semibold text-slate-900 dark:text-white capitalize">{viewTitles[view.split('/').join('-')] || 'Dashboard'}</h1>
            </div>
            <div className="flex items-center gap-2 sm:gap-4">
                <ThemeToggle />
                
                {/* Notifications Button */}
                <div ref={notificationsRef} className="relative">
                    <button 
                        onClick={() => setNotificationsOpen(o => !o)} 
                        className="p-2 rounded-full text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-slate-700/50 relative"
                        aria-label={`View notifications (${unreadCount} unread)`}
                    >
                        <BellIcon />
                        {unreadCount > 0 && (
                            <span className="absolute -top-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white ring-2 ring-white/80 dark:ring-slate-900/80">
                                {unreadCount}
                            </span>
                        )}
                    </button>
                    {notificationsOpen && <NotificationDropdown onClose={() => setNotificationsOpen(false)} onLinkClick={setView} />}
                </div>

                <div ref={dropdownRef} className="relative">
                    <button onClick={() => setDropdownOpen(!dropdownOpen)} className="flex items-center gap-2 p-1 rounded-full hover:bg-slate-200 dark:hover:bg-slate-700/50">
                        <Avatar avatar_url={user?.avatar_url} name={user?.name} className="w-8 h-8" />
                        <span className="hidden md:inline text-slate-700 dark:text-slate-300 font-medium">{user?.name}</span>
                    </button>
                    {dropdownOpen && (
                        <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-slate-800 rounded-md shadow-lg py-1 z-30 border border-slate-200 dark:border-slate-700 animate-fade-in">
                            <button onClick={logout} className="w-full text-left flex items-center px-4 py-2 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700">
                                <LogoutIcon className="w-4 h-4 mr-2" />
                                Logout
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </header>
    );
};

interface NavLinkProps {
  icon: React.ReactNode;
  label: string;
  view: View;
  onLinkClick: () => void;
  isSubLink?: boolean;
}

const NavLink: React.FC<NavLinkProps> = ({ icon, label, view, onLinkClick, isSubLink = false }) => {
    const { view: currentView, setView } = useAppContext();
    const isActive = currentView === view;
    
    return (
        <button
            onClick={() => {
                setView(view);
                onLinkClick();
            }}
            className={`flex items-center w-full p-3 rounded-lg transition-all duration-200 group text-sm relative ${
                isSubLink ? 'pl-10' : ''
            } ${
                isActive 
                ? 'bg-accent-500/10 text-accent-500' 
                : 'text-slate-500 dark:text-slate-400 hover:bg-slate-200/60 dark:hover:bg-slate-800/60 hover:text-slate-900 dark:hover:text-white'
            }`}
        >
            {isActive && <div className="absolute left-0 top-1/2 -translate-y-1/2 h-5 w-1 bg-accent-500 rounded-r-full"></div>}
            {icon}
            <span className="ml-3 font-semibold whitespace-nowrap">{label}</span>
        </button>
    );
};

interface CollapsibleNavLinkProps {
    icon: React.ReactNode;
    label: string;
    baseViews: string[];
    subLinks: { icon: React.ReactNode; label: string; view: View }[];
    onLinkClick: () => void;
}

const CollapsibleNavLink: React.FC<CollapsibleNavLinkProps> = ({ icon, label, baseViews, subLinks, onLinkClick }) => {
    const { view: currentView, setView } = useAppContext();
    const isParentActive = baseViews.some(base => currentView.startsWith(base));
    const [isOpen, setIsOpen] = useState(isParentActive);

    useEffect(() => {
      setIsOpen(isParentActive);
    }, [isParentActive]);

    const handleParentClick = () => {
        if (!isOpen) {
             const firstSublinkView = subLinks[0]?.view;
             if (firstSublinkView && !isParentActive) {
                setView(firstSublinkView);
             }
        }
        setIsOpen(!isOpen);
    }

    return (
        <div>
            <button
                onClick={handleParentClick}
                className={`flex items-center justify-between w-full p-3 rounded-lg transition-all duration-200 group text-sm relative ${
                    isParentActive && !isOpen
                    ? 'bg-accent-500/10 text-accent-500' 
                    : 'text-slate-500 dark:text-slate-400 hover:bg-slate-200/60 dark:hover:bg-slate-800/60 hover:text-slate-900 dark:hover:text-white'
                }`}
            >
                {isParentActive && !isOpen && <div className="absolute left-0 top-1/2 -translate-y-1/2 h-5 w-1 bg-accent-500 rounded-r-full"></div>}
                <div className="flex items-center">
                    {icon}
                    <span className="ml-3 font-semibold whitespace-nowrap">{label}</span>
                </div>
                <ChevronDownIcon className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
            </button>
            {isOpen && (
                <div className="pt-2 space-y-1 animate-fade-in">
                    {subLinks.map(link => (
                        <NavLink 
                            key={link.view}
                            icon={link.icon} 
                            label={link.label} 
                            view={link.view} 
                            onLinkClick={onLinkClick} 
                            isSubLink 
                        />
                    ))}
                </div>
            )}
        </div>
    );
};


const Sidebar: React.FC<{isCollapsed: boolean; onToggle: ()=>void; onLinkClick: () => void}> = ({isCollapsed, onToggle, onLinkClick}) => {
    const { accounts } = useAppContext();

    const hasPropFirmAccount = useMemo(() => accounts.some(acc => acc.type === 'Prop Firm'), [accounts]);
    
    const analyticsSubLinks: { view: View; label: string; icon: React.ReactNode }[] = [
        { view: 'analytics/overview', label: 'Overview', icon: <AnalyticsOverviewIcon className="w-4 h-4" /> },
        { view: 'analytics/performance-breakdown', label: 'Breakdown', icon: <PerformanceBreakdownIcon className="w-4 h-4" /> },
        { view: 'analytics/psychology-behavior', label: 'Psychology', icon: <PsychologyBehaviorIcon className="w-4 h-4" /> },
        { view: 'analytics/cost-analysis', label: 'Cost Analysis', icon: <TagIcon className="w-4 h-4" /> },
        { view: 'analytics/ai-insights', label: 'AI Insights', icon: <AIInsightsIcon className="w-4 h-4" /> },
    ];
    
    const toolsSubLinks: { view: View; label: string; icon: React.ReactNode }[] = [
        { view: 'position-size-calculator', label: 'Position Size Calc', icon: <CalculatorIcon className="w-4 h-4" /> },
        { view: 'risk-of-ruin-calculator', label: 'Risk of Ruin Calc', icon: <RiskOfRuinIcon className="w-4 h-4" /> },
        { view: 'simulations', label: 'Simulations', icon: <BeakerIcon className="w-4 h-4" /> },
        { view: 'economic-calendar', label: 'Economic Calendar', icon: <CalendarIcon className="w-4 h-4" /> },
        { view: 'session-time-converter', label: 'Session Converter', icon: <ClockIcon className="w-4 h-4" /> },
        { view: 'playbooks', label: 'Playbooks', icon: <StrategyInsightsIcon className="w-4 h-4" /> },
        { view: 'reports', label: 'Reports', icon: <DocumentArrowDownIcon className="w-4 h-4" /> },
    ];

    if (hasPropFirmAccount) {
        toolsSubLinks.push({ view: 'prop-firm-hub', label: 'Prop Firm Hub', icon: <BriefcaseIcon className="w-4 h-4" /> });
    }

    return (
        <aside className={`bg-white/60 dark:bg-slate-900/60 backdrop-blur-lg h-screen fixed top-0 left-0 flex flex-col z-40 w-64 transition-transform duration-300 ease-in-out border-r border-slate-200/80 dark:border-slate-800/80 ${isCollapsed ? '-translate-x-full' : 'translate-x-0'}`}>
            <div className={`h-16 flex items-center border-b border-slate-200/80 dark:border-slate-800/80 px-4 justify-between`}>
                <div className="flex items-center gap-2">
                    <LogoIcon className="text-accent-500" />
                    <h2 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-accent-500 to-accent-600">Tradia</h2>
                </div>
                 <button onClick={onToggle} className="p-2 rounded-full text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-slate-700/50 transition-colors">
                    <ChevronLeftIcon className="transition-transform duration-300" />
                </button>
            </div>
            <nav className="flex-grow p-4 space-y-2 overflow-y-auto">
                <NavLink icon={<DashboardIcon />} label="Dashboard" view="dashboard" onLinkClick={onLinkClick} />
                <NavLink icon={<TradesIcon />} label="Trades" view="trades" onLinkClick={onLinkClick} />
                <CollapsibleNavLink 
                    icon={<AnalyticsIcon />} 
                    label="Analytics" 
                    baseViews={['analytics']} 
                    subLinks={analyticsSubLinks} 
                    onLinkClick={onLinkClick} 
                />
                <NavLink icon={<JournalIcon />} label="Journal" view="journal" onLinkClick={onLinkClick} />
                <NavLink icon={<CommunityIcon />} label="Community" view="community" onLinkClick={onLinkClick} />
                <CollapsibleNavLink
                    icon={<ToolboxIcon />}
                    label="Tools"
                    baseViews={['economic-calendar', 'playbooks', 'prop-firm-hub', 'position-size-calculator', 'risk-of-ruin-calculator', 'session-time-converter', 'simulations', 'reports']}
                    subLinks={toolsSubLinks}
                    onLinkClick={onLinkClick}
                />
                <NavLink icon={<ProfileIcon />} label="Profile" view="profile" onLinkClick={onLinkClick} />
            </nav>
        </aside>
    );
};

const FloatingActionButton: React.FC<{onClick: () => void}> = ({onClick}) => (
    <button 
        onClick={onClick}
        className="fixed bottom-6 right-6 bg-gradient-to-br from-accent-500 to-accent-600 hover:from-accent-600 hover:to-accent-700 text-white rounded-full p-4 shadow-lg shadow-accent-500/30 z-20 transition-all duration-300 transform hover:scale-110 focus:outline-none focus:ring-4 focus:ring-accent-500/50"
        aria-label="Add Trade"
    >
        <PlusIcon className="w-6 h-6" />
    </button>
);


const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const { view } = useAppContext();
    const [isJournalEntryOpen, setIsJournalEntryOpen] = useState(false);
    const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(true);

    const handleLinkClick = () => {
        setIsSidebarCollapsed(true);
    };

    return (
        <div className="min-h-screen">
            <Sidebar 
                isCollapsed={isSidebarCollapsed} 
                onToggle={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
                onLinkClick={handleLinkClick} 
            />
            
            {!isSidebarCollapsed && (
                 <div 
                    onClick={() => setIsSidebarCollapsed(true)}
                    className="fixed inset-y-0 right-0 left-64 bg-black/50 backdrop-blur-sm z-30 transition-opacity duration-300 ease-in-out"
                    aria-hidden="true"
                ></div>
            )}

            <div className="relative">
                <Header onToggleSidebar={() => setIsSidebarCollapsed(c => !c)} />
                <main key={view} className="p-4 sm:p-6 mt-16 animate-fade-in-up">
                    <div className="max-w-7xl mx-auto">
                        {children}
                    </div>
                </main>
            </div>
            <FloatingActionButton onClick={() => setIsJournalEntryOpen(true)} />
            {isJournalEntryOpen && <ImmersiveJournalEntry onClose={() => setIsJournalEntryOpen(false)} />}
        </div>
    );
};

export default Layout;
