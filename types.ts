
import React from 'react';

export type Theme = 'light' | 'dark';

export type View = string;

export type NotificationType = 'report' | 'drawdown' | 'reminder' | 'news' | 'generic';

export interface Notification {
    id: string;
    type: NotificationType;
    message: string;
    is_read: boolean;
    timestamp: Date;
    link?: View; // Optional link to a view
}

export interface User {
    id: string;
    name: string;
    email: string;
    avatar_url?: string;
    risk_calculation_method?: 'initialBalance' | 'currentBalance';
    browser_notifications_enabled?: boolean;
    tradable_instruments?: string[];
}

export interface PropFirmRules {
    profit_target: number; // Now an absolute dollar value
    max_daily_drawdown: number; // percentage
    max_overall_drawdown: number; // percentage
    min_trading_days: number;
    max_trading_days?: number;
}

export interface Account {
    id: string;
    user_id: string;
    name: string;
    type: 'Personal' | 'Prop Firm';
    balance: number;
    initial_balance: number;
    prop_firm_name?: string;
    stage?: 'Evaluation' | 'Live';
    phase?: 'Phase 1' | 'Phase 2' | 'Phase 3';
    rules?: PropFirmRules;
}

export interface AINote {
    summary: string;
    strength?: string;
    weakness?: string;
    suggestion?: string;
}

export interface Strategy {
    id: string;
    user_id: string;
    name: string;
    description: string;
    entry_conditions: string;
    exit_conditions: string;
    market_conditions: string;
}

export interface Trade {
    id: string;
    user_id: string;
    trade_taken: boolean;
    account_id?: string;
    instrument: string;
    entry?: number;
    exit?: number;
    stop_loss?: number;
    take_profit?: number;
    risk_percentage?: number;
    rr: number; // Risk to Reward Ratio
    pnl: number;
    notes: string;
    tags: string[];
    entry_timestamp: Date;
    exit_timestamp: Date;
    news_event?: { name: string; timing: 'Before' | 'During' | 'After' };
    ai_note?: AINote;
    emotion_during_trade?: string;
    emotion_after_trade?: string;
    followed_plan?: boolean;
    trade_quality?: 'A' | 'B' | 'C' | 'D';
    custom_tags?: { [key: string]: string };
    commission?: number;
    swap?: number;
    lot_size?: number;
    screenshot_url?: string;
    audio_note_url?: string;
    deal_id?: string;
    order_id?: string;
    strategy_id?: string;
}

export interface CustomTag {
    id: string;
    user_id: string;
    name: string;
    options: string[];
}

export interface CommunityComment {
    id: string;
    post_id: string;
    author_id: string;
    content: string;
    timestamp: Date;
}

export interface CommunityPost {
    id: string;
    community_id: string;
    author_id: string;
    content: string;
    shared_trade_id?: string;
    post_likes: string[]; // Array of user IDs
    community_comments: CommunityComment[];
    timestamp: Date;
}

export interface Achievement {
    id: string;
    name: string;
    description: string;
}

export interface Goal {
    id: string;
    community_id: string;
    author_id: string;
    description: string;
    status: 'In Progress' | 'Completed';
    created_at: Date;
}

export interface UserStatsSnapshot {
    id: string;
    community_id: string;
    user_id: string;
    net_pnl: number;
    win_rate: number;
    profit_factor: number;
    total_trades: number;
    shared_at: Date;
}

export interface CommunityMember {
    user_id: string;
    community_id: string;
    role: 'admin' | 'member';
}

export interface Community {
    id: string;
    name: string;
    description: string;
    created_by: string;
    community_members: CommunityMember[];
    goals: Goal[];
    user_stats_snapshots: UserStatsSnapshot[];
}

export interface AppContextType {
    theme: Theme;
    toggleTheme: () => void;
    isAuthenticated: boolean;
    user: User | null;
    updateUser: (updatedUser: Partial<User>) => Promise<void>;
    users: User[];
    login: (email: string, password: string) => Promise<void>;
    signup: (email: string, password: string, fullName: string) => Promise<{ user: User | null }>;
    logout: () => Promise<void>;
    updateAvatar: (file: File) => Promise<void>;
    removeAvatar: () => Promise<void>;
    trades: Trade[];
    addTrade: (trade: Omit<Trade, 'id' | 'ai_note' | 'user_id'>) => Promise<Trade | null>;
    updateTrade: (updatedTrade: Trade) => Promise<void>;
    deleteTrade: (tradeId: string) => Promise<void>;
    addMultipleTrades: (newTrades: Omit<Trade, 'id' | 'ai_note' | 'user_id'>[], onProgress?: (progress: number) => void) => Promise<Trade[]>;
    selectedTrade: Trade | null;
    setSelectedTrade: (trade: Trade | null) => void;
    accounts: Account[];
    addAccount: (accountName: string, type: 'Personal' | 'Prop Firm', balance: number, options?: { prop_firm_name?: string; stage?: 'Evaluation' | 'Live'; phase?: 'Phase 1' | 'Phase 2' | 'Phase 3', rules?: PropFirmRules }) => Promise<void>;
    deleteAccount: (accountId: string, deleteTrades: boolean) => Promise<void>;
    tradableInstruments: string[];
    setTradableInstruments: (instruments: string[]) => Promise<void>;
    customTags: CustomTag[];
    addCustomTag: (name: string, options: string[]) => Promise<void>;
    updateCustomTag: (updatedTag: CustomTag) => Promise<void>;
    deleteCustomTag: (tagId: string) => Promise<void>;
    view: View;
    setView: (view: View) => void;
    dataLoading: boolean;
    communities: Community[];
    addCommunity: (name: string, description: string) => Promise<Community | null>;
    joinCommunity: (communityId: string) => Promise<void>;
    leaveCommunity: (communityId: string) => Promise<void>;
    addGoal: (communityId: string, goal: Omit<Goal, 'id' | 'author_id' | 'community_id' | 'created_at'>) => Promise<void>;
    updateGoal: (communityId: string, updatedGoal: Goal) => Promise<void>;
    deleteGoal: (communityId: string, goalId: string) => Promise<void>;
    shareStats: (communityId: string) => Promise<void>;
    unshareStats: (communityId: string) => Promise<void>;
    posts: CommunityPost[];
    achievements: Achievement[];
    addPost: (post: Omit<CommunityPost, 'id' | 'timestamp' | 'post_likes' | 'community_comments'>) => Promise<void>;
    toggleLike: (postId: string) => Promise<void>;
    addComment: (postId: string, content: string) => Promise<void>;
    strategies: Strategy[];
    addStrategy: (strategy: Omit<Strategy, 'id' | 'user_id'>) => Promise<void>;
    updateStrategy: (updatedStrategy: Strategy) => Promise<void>;
    deleteStrategy: (strategyId: string) => Promise<void>;
    notifications: Notification[];
    markNotificationAsRead: (notificationId: string) => void;
    markAllNotificationsAsRead: () => void;
    toggleBrowserNotifications: () => Promise<void>;
}
