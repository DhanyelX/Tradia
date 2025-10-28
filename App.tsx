

// A small, reversible change.
import React, { useState, useMemo, useEffect, useCallback, useRef } from 'react';
import { User as SupabaseUser } from '@supabase/supabase-js';
import { User, Account, Trade, CustomTag, Community, CommunityPost, Achievement, CommunityComment, Goal, UserStatsSnapshot, View, Theme, CommunityMember, Strategy, PropFirmRules, AppContextType, Notification } from './types';
import Layout from './components/Layout';
import Dashboard from './components/Dashboard';
import { TradeManagement } from './components/TradeManagement';
import { UserManagement, Login, SignUp } from './components/UserManagement';
import Analytics from './components/Analytics';
import Journal from './components/Journal';
import EconomicCalendar from './components/EconomicCalendar';
import CommunityComponent from './components/Community';
import StrategyPlaybook from './components/StrategyPlaybook';
import PropFirmHub from './components/PropFirmHub';
import PositionSizeCalculator from './components/PositionSizeCalculator';
import RiskOfRuinCalculator from './components/RiskOfRuinCalculator';
import SessionTimeConverter from './components/SessionTimeConverter';
import Reports from './components/Reports';
import Simulations from './components/Simulations';
import { TradeDetailModal } from './components/TradeComponents';
import { AppContext, useAppContext } from './context';
import LandingPage from './components/LandingPage';
import PricingPage from './components/PricingPage';
import MonteCarloSimulation from './components/MonteCarloSimulation';
import TimeUnderwaterSimulation from './components/TimeUnderwaterSimulation';
import BootstrapSimulation from './components/BootstrapSimulation';
import LoadingScreen from './components/LoadingScreen';
import { supabase } from './supabaseClient';


// Helper to add a timeout to a promise
const promiseWithTimeout = <T,>(
  promise: Promise<T>,
  ms: number,
  timeoutError = new Error('Promise timed out')
): Promise<T> => {
  // Create a timeout promise that rejects in `ms` milliseconds
  const timeout = new Promise<never>((_, reject) => {
    setTimeout(() => {
      reject(timeoutError);
    }, ms);
  });

  // Race the original promise against the timeout
  return Promise.race<T>([promise, timeout]);
};


// Helper to convert string dates from DB to Date objects
const parseDates = <T extends Record<string, any>>(data: T[], dateFields: (keyof T)[]): T[] => {
    return data.map(item => {
        const newItem = { ...item };
        dateFields.forEach(field => {
            if (newItem[field] && typeof newItem[field] === 'string') {
                (newItem as any)[field] = new Date(newItem[field]);
            }
        });
        return newItem;
    });
};

const App: React.FC = () => {
    // State management
    const [theme, setTheme] = useState<Theme>('dark');
    const [view, setView] = useState<View>('home');
    
    // Auth state
    const [user, setUser] = useState<User | null>(null);
    const [users, setUsers] = useState<User[]>([]);

    // Data state
    const [trades, setTrades] = useState<Trade[]>([]);
    const [accounts, setAccounts] = useState<Account[]>([]);
    const [customTags, setCustomTags] = useState<CustomTag[]>([]);
    const [communities, setCommunities] = useState<Community[]>([]);
    const [posts, setPosts] = useState<CommunityPost[]>([]);
    const [achievements, setAchievements] = useState<Achievement[]>([]);
    const [strategies, setStrategies] = useState<Strategy[]>([]);
    const [tradableInstruments, setTradableInstruments] = useState<string[]>([]);
    const [notifications, setNotifications] = useState<Notification[]>([]);
    
    // UI state
    const [selectedTrade, setSelectedTrade] = useState<Trade | null>(null);
    const [dataLoading, setDataLoading] = useState<boolean>(true);

    const unauthenticatedViews = useMemo(() => ['home', 'login', 'signup', 'pricing'], []);

    // Theme effect
    useEffect(() => {
        document.documentElement.classList.toggle('dark', theme === 'dark');
    }, [theme]);
    
    const toggleTheme = () => setTheme(prev => prev === 'light' ? 'dark' : 'light');
    
    const fetchData = useCallback(async (userId: string) => {
        try {
            const { data: memberData, error: memberError } = await supabase
                .from('community_members')
                .select('community_id')
                .eq('user_id', userId);
            
            if (memberError) {
                console.error("Error fetching community memberships:", memberError);
            }
            
            const userCommunityIds = (memberData || []).map(m => m.community_id);
            
            const [
                tradesRes, accountsRes, customTagsRes, strategiesRes, notificationsRes,
                communitiesRes, postsRes, allUsersRes
            ] = await Promise.all([
                supabase.from('trades').select('*').eq('user_id', userId).order('exit_timestamp', { ascending: false }),
                supabase.from('accounts').select('*').eq('user_id', userId),
                supabase.from('custom_tags').select('*').eq('user_id', userId),
                supabase.from('strategies').select('*').eq('user_id', userId),
                supabase.from('notifications').select('*').eq('user_id', userId).order('timestamp', { ascending: false }),
                
                supabase
                    .from('communities')
                    .select('*, community_members(*), goals(*), user_stats_snapshots(*)')
                    .in('id', userCommunityIds),
                
                supabase
                    .from('community_posts')
                    .select('*, community_comments(*), post_likes(user_id)')
                    .in('community_id', userCommunityIds),
                
                supabase.from('users').select('id, name, avatar_url'),
            ]);
    
            const errors = [
                tradesRes.error, accountsRes.error, customTagsRes.error, strategiesRes.error, 
                notificationsRes.error, communitiesRes.error, postsRes.error, allUsersRes.error
            ].filter(Boolean);
    
            if (errors.length > 0) {
                errors.forEach(error => console.error("Data fetch error:", error?.message));
            }
            
            setTrades(parseDates(tradesRes.data || [], ['entry_timestamp', 'exit_timestamp']));
            setAccounts(accountsRes.data || []);
            setCustomTags(customTagsRes.data || []);
            setStrategies(strategiesRes.data || []);
            setNotifications(parseDates(notificationsRes.data || [], ['timestamp']));
            setCommunities(parseDates((communitiesRes.data || []).map(c => ({...c, goals: parseDates(c.goals || [], ['created_at']), user_stats_snapshots: parseDates(c.user_stats_snapshots || [], ['shared_at'])})), []));
            setPosts(parseDates((postsRes.data || []).map(p => ({...p, community_comments: parseDates(p.community_comments || [], ['timestamp']), post_likes: (p.post_likes || []).map((l:any) => l.user_id)})), ['timestamp']));
            setUsers(allUsersRes.data || []);

        } catch (error: any) {
            console.error("Critical error in fetchData:", error);
            // Set empty states so the app can still load
            setTrades([]);
            setAccounts([]);
            setCustomTags([]);
            setStrategies([]);
            setNotifications([]);
            setCommunities([]);
            setPosts([]);
            setUsers([]);
        }
    }, []);

    useEffect(() => {
        setDataLoading(true);
    
        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
            let shouldHideLoading = true;
    
            try {
                if (session?.user) {
                    const userProfilePromise = supabase.from('users').select('*').eq('id', session.user.id).single();
                    
                    const { data: userData, error: userError } = await promiseWithTimeout(
                        userProfilePromise,
                        8000, // 8-second timeout
                        new Error('User profile fetch timed out. This might be a network issue or an RLS policy problem on the "users" table.')
                    );

                    if (userError) {
                        throw userError;
                    }
                    
                    setUser(userData);
                    setTradableInstruments(userData?.tradable_instruments || []);
                    
                    await fetchData(userData.id);
    
                    setView(currentView => {
                        if (unauthenticatedViews.includes(currentView)) {
                            return 'dashboard';
                        }
                        return currentView;
                    });
    
                } else {
                    setUser(null);
                    setUsers([]);
                    setTrades([]);
                    setAccounts([]);
                    setCustomTags([]);
                    setCommunities([]);
                    setPosts([]);
                    setStrategies([]);
                    setNotifications([]);
                    setTradableInstruments([]);
                    
                    setView(currentView => {
                        if (!unauthenticatedViews.includes(currentView)) {
                            return 'home';
                        }
                        return currentView;
                    });
                }
            } catch (error: any) {
                 if (error.message?.includes('timed out')) {
                    // It's a timeout. Supabase will likely retry.
                    // Keep the loading screen on to prevent a UI flash.
                    console.warn("AUTH CHANGE: User profile fetch timed out. Keeping loader on for potential retry.");
                    shouldHideLoading = false;
                } else {
                    // This is a "real" error, not a timeout. Treat the user as logged out.
                    console.error("Critical error in onAuthStateChange:", error);
                    setUser(null);
                    setUsers([]); setTrades([]); setAccounts([]); setCustomTags([]);
                    setCommunities([]); setPosts([]); setStrategies([]); setNotifications([]);
                    setTradableInstruments([]);
                    setView('home'); // Redirect to home on critical failure
                }
            } finally {
                if (shouldHideLoading) {
                    setDataLoading(false);
                }
            }
        });
    
        return () => {
            subscription.unsubscribe();
        };
    }, [fetchData, unauthenticatedViews]);

    const login = async (email: string, password: string) => {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
    };

    const signup = async (email: string, password: string, fullName: string) => {
        // FIX: The type inference for `supabase.auth.signUp` can fail, returning `{}`, which causes type errors.
        // The implementation is changed to use destructuring with a type assertion to work around the incorrect type.
        const { data, error } = await supabase.auth.signUp({
            email,
            password,
            options: {
                data: {
                    name: fullName,
                }
            }
        }) as { data: any, error: any };
        if (error) throw error;
        // The `onAuthStateChange` handler is responsible for setting the user state.
        return { user: null };
    };

    const logout = async () => {
        await supabase.auth.signOut();
        setUser(null);
        setView('home');
    };
    
    const contextValue: AppContextType = {
        theme, toggleTheme,
        isAuthenticated: !!user,
        user,
        users,
        view, setView,
        dataLoading,
        login, signup, logout,
        trades, 
        addTrade: async (tradeData) => {
             if (!user) throw new Error("User not authenticated");
            const { data, error } = await supabase.from('trades').insert({ ...tradeData, user_id: user.id }).select().single();
            if (error) throw error;
            if (!data) return null;
            const newTrade = parseDates([data], ['entry_timestamp', 'exit_timestamp'])[0];
            setTrades(prev => [newTrade, ...prev]);
            return newTrade;
        },
        addMultipleTrades: async (newTradesData, onProgress) => {
            if (!user) throw new Error("User not authenticated");
            const tradesWithUserId = newTradesData.map(t => ({...t, user_id: user!.id}));
            const { data, error } = await supabase.from('trades').insert(tradesWithUserId).select();
            if (error) throw error;
            const newTrades = parseDates<Trade>(data || [], ['entry_timestamp', 'exit_timestamp']);
            setTrades(prev => [...newTrades.reverse(), ...prev]);
            if (onProgress) onProgress(100);
            return newTrades;
        },
        updateTrade: async (updatedTrade) => {
            const { data, error } = await supabase.from('trades').update(updatedTrade).eq('id', updatedTrade.id);
            if (error) throw error;
            setTrades(prev => prev.map(t => t.id === updatedTrade.id ? updatedTrade : t));
        },
        deleteTrade: async (tradeId) => {
            const { error } = await supabase.from('trades').delete().eq('id', tradeId);
            if (error) throw error;
            setTrades(prev => prev.filter(t => t.id !== tradeId));
        },
        selectedTrade, setSelectedTrade,
        accounts,
        addAccount: async (name, type, balance, options) => {
             if (!user) throw new Error("User not authenticated");
            const newAccount: Omit<Account, 'id'> = { user_id: user.id, name, type, balance, initial_balance: balance, ...options };
            const { data, error } = await supabase.from('accounts').insert(newAccount).select().single();
            if (error) throw error;
            setAccounts(prev => [...prev, data]);
        },
        deleteAccount: async (accountId, deleteAssociatedTrades) => {
            if(deleteAssociatedTrades) {
                const { error } = await supabase.from('trades').delete().eq('account_id', accountId);
                if (error) throw error;
            } else {
                const { error } = await supabase.from('trades').update({ account_id: null }).eq('account_id', accountId);
                if (error) throw error;
            }
            const { error: accError } = await supabase.from('accounts').delete().eq('id', accountId);
            if(accError) throw accError;

            setTrades(prev => {
                if(deleteAssociatedTrades) return prev.filter(t => t.account_id !== accountId);
                return prev.map(t => t.account_id === accountId ? { ...t, account_id: undefined } : t);
            });
            setAccounts(prev => prev.filter(a => a.id !== accountId));
        },
        customTags,
        addCustomTag: async (name, options) => {
            if (!user) throw new Error("User not authenticated");
            const { data, error } = await supabase.from('custom_tags').insert({ user_id: user.id, name, options }).select().single();
            if (error) throw error;
            setCustomTags(prev => [...prev, data]);
        },
        updateCustomTag: async (tag) => {
            const { error } = await supabase.from('custom_tags').update(tag).eq('id', tag.id);
            if (error) throw error;
            setCustomTags(prev => prev.map(t => t.id === tag.id ? tag : t));
        },
        deleteCustomTag: async (id) => {
            const { error } = await supabase.from('custom_tags').delete().eq('id', id);
            if (error) throw error;
            setCustomTags(prev => prev.filter(t => t.id !== id));
        },
        tradableInstruments,
        setTradableInstruments: async (instruments) => {
            if (!user) throw new Error("User not authenticated");
            const { error } = await supabase.from('users').update({ tradable_instruments: instruments }).eq('id', user.id);
            if (error) throw error;
            setUser(prev => prev ? { ...prev, tradable_instruments: instruments } : null);
            setTradableInstruments(instruments);
        },
        updateUser: async (updatedUserData) => {
            if (!user) throw new Error("User not authenticated");
            const { data, error } = await supabase.from('users').update(updatedUserData).eq('id', user.id).select().single();
            if(error) throw error;
            setUser(data);
        },
        updateAvatar: async (file) => {
            if(!user) throw new Error("User not authenticated");
            const fileExt = file.name.split('.').pop();
            const filePath = `${user.id}/${Date.now()}.${fileExt}`;
            const { error: uploadError } = await supabase.storage.from('avatars').upload(filePath, file, { upsert: true });
            if (uploadError) throw uploadError;

            const { data } = supabase.storage.from('avatars').getPublicUrl(filePath);
            const { error: dbError } = await supabase.from('users').update({ avatar_url: data.publicUrl }).eq('id', user.id);
            if (dbError) throw dbError;

            setUser(prev => prev ? { ...prev, avatar_url: data.publicUrl } : null);
        },
        removeAvatar: async () => {
             if(!user) throw new Error("User not authenticated");
             const { error } = await supabase.from('users').update({ avatar_url: null }).eq('id', user.id);
             if (error) throw error;
             setUser(prev => prev ? { ...prev, avatar_url: undefined } : null);
        },
        communities, posts, achievements, strategies, notifications,
        addCommunity: async (name, description) => {
            if(!user) throw new Error("User not authenticated");
            const { data: newCommunity, error } = await supabase.from('communities').insert({ name, description, created_by: user.id }).select().single();
            if (error) throw error;
            const { error: memberError } = await supabase.from('community_members').insert({ user_id: user.id, community_id: newCommunity.id, role: 'admin' });
            if (memberError) throw memberError;

            const communityWithMember = { ...newCommunity, community_members: [{ user_id: user.id, community_id: newCommunity.id, role: 'admin' }], goals: [], user_stats_snapshots: [] };
            setCommunities(prev => [...prev, communityWithMember]);
            return communityWithMember;
        },
        joinCommunity: async (id) => {
            if (!user) throw new Error("User not authenticated");
            const { error } = await supabase.from('community_members').insert({ user_id: user.id, community_id: id, role: 'member' });
            if (error) throw error;
            await fetchData(user.id);
        },
        leaveCommunity: async (id) => {
            if (!user) throw new Error("User not authenticated");
            const { error } = await supabase.from('community_members').delete().match({ user_id: user.id, community_id: id });
            if (error) throw error;
            setCommunities(prev => prev.filter(c => c.id !== id));
        },
        addPost: async (post) => {
            if (!user) throw new Error("User not authenticated");
            const { data: newPost, error } = await supabase.from('community_posts').insert({ ...post, author_id: user.id }).select().single();
            if (error) throw error;
            const postWithExtras = { ...newPost, timestamp: new Date(newPost.timestamp), post_likes: [], community_comments: [] };
            setPosts(prev => [postWithExtras, ...prev]);
        },
        toggleLike: async (postId) => {
            if (!user) return;
            const originalPosts = posts;
            const post = originalPosts.find(p => p.id === postId);
            if (!post) return;
            const liked = post.post_likes.includes(user.id);

            setPosts(prev => prev.map(p => p.id === postId ? { ...p, post_likes: liked ? p.post_likes.filter(id => id !== user.id) : [...p.post_likes, user.id] } : p));

            if (liked) {
                const { error } = await supabase.from('post_likes').delete().match({ post_id: postId, user_id: user.id });
                if (error) { setPosts(originalPosts); throw error; }
            } else {
                const { error } = await supabase.from('post_likes').insert({ post_id: postId, user_id: user.id });
                if (error) { setPosts(originalPosts); throw error; }
            }
        },
        addComment: async (postId, content) => {
            if (!user) return;
            const { data, error } = await supabase.from('community_comments').insert({ post_id: postId, author_id: user.id, content }).select().single();
            if (error) throw error;
            const newComment = { ...data, timestamp: new Date(data.timestamp) };
            setPosts(prev => prev.map(p => p.id === postId ? { ...p, community_comments: [...p.community_comments, newComment] } : p));
        },
        addStrategy: async (strat) => {
            if (!user) return;
            const { data, error } = await supabase.from('strategies').insert({ ...strat, user_id: user.id }).select().single();
            if (error) throw error;
            setStrategies(prev => [...prev, data]);
        },
        updateStrategy: async (strat) => {
            const { error } = await supabase.from('strategies').update(strat).eq('id', strat.id);
            if (error) throw error;
            setStrategies(prev => prev.map(s => s.id === strat.id ? strat : s));
        },
        deleteStrategy: async (id) => {
            const { error } = await supabase.from('strategies').delete().eq('id', id);
            if (error) throw error;
            setStrategies(prev => prev.filter(s => s.id !== id));
        },
        addGoal: async (communityId, goal) => {
            if (!user) return;
            const { data, error } = await supabase.from('goals').insert({ ...goal, community_id: communityId, author_id: user.id }).select().single();
            if (error) throw error;
            const newGoal = { ...data, created_at: new Date(data.created_at) };
            setCommunities(prev => prev.map(c => c.id === communityId ? { ...c, goals: [...c.goals, newGoal] } : c));
        },
        updateGoal: async (communityId, updatedGoal) => {
            const { error } = await supabase.from('goals').update(updatedGoal).eq('id', updatedGoal.id);
            if (error) throw error;
            setCommunities(prev => prev.map(c => c.id === communityId ? { ...c, goals: c.goals.map(g => g.id === updatedGoal.id ? updatedGoal : g) } : c));
        },
        deleteGoal: async (communityId, goalId) => {
            const { error } = await supabase.from('goals').delete().eq('id', goalId);
            if (error) throw error;
            setCommunities(prev => prev.map(c => c.id === communityId ? { ...c, goals: c.goals.filter(g => g.id !== goalId) } : c));
        },
        shareStats: async (communityId: string) => {
            if (!user) return;
            const userTrades = trades.filter(t => t.user_id === user.id && t.trade_taken);
            if(userTrades.length === 0) return;

            const winningTrades = userTrades.filter(t => t.pnl > 0);
            const losingTrades = userTrades.filter(t => t.pnl <= 0);
            const net_pnl = userTrades.reduce((sum, t) => sum + t.pnl, 0);
            const win_rate = (winningTrades.length / userTrades.length) * 100;
            const totalGains = winningTrades.reduce((sum, t) => sum + t.pnl, 0);
            const totalLosses = Math.abs(losingTrades.reduce((sum, t) => sum + t.pnl, 0));
            
            let profit_factor: number;
            if (totalLosses > 0) {
                profit_factor = totalGains / totalLosses;
            } else if (totalGains > 0) {
                profit_factor = 999; // Using a large number to represent infinity for DB storage
            } else {
                profit_factor = 0; // No profit and no loss, so profit factor is 0
            }
            
            const snapshotData = { community_id: communityId, user_id: user.id, net_pnl, win_rate, profit_factor, total_trades: userTrades.length, shared_at: new Date().toISOString() };
            
            const { data: newSnapshot, error } = await supabase.from('user_stats_snapshots').upsert(snapshotData, { onConflict: 'community_id, user_id' }).select().single();
            
            if (error) throw error;
            if (!newSnapshot) return;
            
            const parsedSnapshot = parseDates([newSnapshot], ['shared_at'])[0];
            setCommunities(prev => prev.map(c => {
                if (c.id === communityId) {
                    const existing = c.user_stats_snapshots.filter(s => s.user_id !== user.id);
                    return { ...c, user_stats_snapshots: [...existing, parsedSnapshot] };
                }
                return c;
            }));
        },
        unshareStats: async (communityId: string) => {
            if (!user) return;
            const { error } = await supabase.from('user_stats_snapshots').delete().match({ community_id: communityId, user_id: user.id });
            if (error) throw error;
            setCommunities(prev => prev.map(c => c.id === communityId ? { ...c, user_stats_snapshots: c.user_stats_snapshots.filter(s => s.user_id !== user.id) } : c));
        },
        markNotificationAsRead: async (id) => {
            const { error } = await supabase.from('notifications').update({ is_read: true }).eq('id', id);
            if (error) throw error;
            setNotifications(p => p.map(n => n.id === id ? {...n, is_read: true} : n));
        },
        markAllNotificationsAsRead: async () => {
             if (!user) return;
             const { error } = await supabase.from('notifications').update({ is_read: true }).eq('user_id', user.id);
             if (error) throw error;
             setNotifications(p => p.map(n => ({...n, is_read: true})));
        },
        toggleBrowserNotifications: async () => {
            if (!user) return;
            const updatedValue = !user.browser_notifications_enabled;
            const { error } = await supabase.from('users').update({ browser_notifications_enabled: updatedValue }).eq('id', user.id);
            if (error) throw error;
            setUser(prev => prev ? {...prev, browser_notifications_enabled: updatedValue } : null);
        },
    };
    
    if (dataLoading) {
        return <LoadingScreen />;
    }

    if (!user || unauthenticatedViews.includes(view)) {
        const AuthSwitcher: React.FC = () => {
            const [isLogin, setIsLogin] = useState(view !== 'signup');
            useEffect(() => {
                if (view === 'login') setIsLogin(true);
                if (view === 'signup') setIsLogin(false);
            }, [view]);

            if (view === 'home') return <LandingPage />;
            if (view === 'pricing') return <PricingPage />;

            return (
                <div className="min-h-screen flex items-center justify-center p-4">
                    {isLogin ? <Login onSwitch={() => { setView('signup'); setIsLogin(false); }} /> : <SignUp onSwitch={() => { setView('login'); setIsLogin(true); }} />}
                </div>
            );
        };
        return (
            <AppContext.Provider value={contextValue}>
                <AuthSwitcher />
            </AppContext.Provider>
        );
    }
    
    const CurrentView: React.FC = () => {
        const { view } = useAppContext();
        const viewParts = view.split('/');
        const baseView = viewParts[0];
        
        switch (baseView) {
            case 'dashboard': return <Dashboard />;
            case 'trades': return <TradeManagement />;
            case 'economic-calendar': return <EconomicCalendar />;
            case 'analytics':
                const subView = viewParts.length > 1 ? `analytics-${viewParts[1]}` : 'analytics-overview';
                return <Analytics activeSubView={subView} />;
            case 'journal': return <Journal />;
            case 'playbooks': return <StrategyPlaybook />;
            case 'prop-firm-hub': return <PropFirmHub />;
            case 'position-size-calculator': return <PositionSizeCalculator />;
            case 'risk-of-ruin-calculator': return <RiskOfRuinCalculator />;
            case 'session-time-converter': return <SessionTimeConverter />;
            case 'reports': return <Reports />;
            case 'simulations':
                if (view === 'simulations/monte-carlo') return <MonteCarloSimulation />;
                if (view === 'simulations/time-under-water') return <TimeUnderwaterSimulation />;
                if (view === 'simulations/bootstrap') return <BootstrapSimulation />;
                return <Simulations />;
            case 'community': return <CommunityComponent />;
            case 'profile': return <UserManagement />;
            default: return <Dashboard />;
        }
    };

    return (
        <AppContext.Provider value={contextValue}>
            {selectedTrade && <TradeDetailModal trade={selectedTrade} onClose={() => setSelectedTrade(null)} />}
            <Layout>
                <CurrentView />
            </Layout>
        </AppContext.Provider>
    );
};

export default App;