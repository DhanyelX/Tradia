
import { User, Account, Trade, Strategy, CustomTag, Community, CommunityPost, Notification } from './types';

export const MOCK_USER: User = {
    id: 'mock-user-123',
    name: 'Alex Trader',
    email: 'alex.trader@example.com',
    avatar_url: 'https://api.dicebear.com/8.x/adventurer/svg?seed=Max',
    risk_calculation_method: 'currentBalance',
    browser_notifications_enabled: false,
    tradable_instruments: ['EUR/USD', 'USD/JPY', 'BTC/USD', 'US30'],
};

export const MOCK_ACCOUNTS: Account[] = [
    {
        id: 'acc-1',
        user_id: 'mock-user-123',
        name: 'Personal Swing Account',
        type: 'Personal',
        balance: 54320.50,
        initial_balance: 50000,
    },
    {
        id: 'acc-2',
        user_id: 'mock-user-123',
        name: 'FTMO Challenge',
        type: 'Prop Firm',
        balance: 102500.00,
        initial_balance: 100000,
        prop_firm_name: 'FTMO',
        stage: 'Evaluation',
        phase: 'Phase 1',
        rules: {
            profit_target: 110000,
            max_daily_drawdown: 5,
            max_overall_drawdown: 10,
            min_trading_days: 10
        }
    }
];

const now = new Date();
const createDate = (daysAgo: number, hour: number) => {
    const date = new Date(now);
    date.setDate(date.getDate() - daysAgo);
    date.setHours(hour, 0, 0, 0);
    return date;
};

export const MOCK_TRADES: Trade[] = [
    { id: 'trade-1', user_id: 'mock-user-123', trade_taken: true, account_id: 'acc-2', instrument: 'US30', pnl: 1513.50, rr: 2.5, risk_percentage: 1, notes: 'Caught a nice breakout during NY session.', tags: ['Breakout', 'New York', 'Bullish'], entry_timestamp: createDate(1, 9), exit_timestamp: createDate(1, 11), followed_plan: true, trade_quality: 'A', entry: 39000, exit: 39152, stop_loss: 38950, take_profit: 39150, commission: 7.00 },
    { id: 'trade-2', user_id: 'mock-user-123', trade_taken: true, account_id: 'acc-1', instrument: 'EUR/USD', pnl: -504.00, rr: -1, risk_percentage: 1, notes: 'Stopped out, news event caused unexpected volatility.', tags: ['News Trade', 'London', 'Bearish'], entry_timestamp: createDate(2, 8), exit_timestamp: createDate(2, 9), followed_plan: true, trade_quality: 'B', entry: 1.0850, exit: 1.0800, stop_loss: 1.0900, take_profit: 1.0750, commission: 3.50, swap: 0.50 },
    { id: 'trade-3', user_id: 'mock-user-123', trade_taken: true, account_id: 'acc-1', instrument: 'EUR/USD', pnl: 845.00, rr: 1.7, risk_percentage: 0.5, notes: 'Good trend continuation trade.', tags: ['Trend Following', 'London'], entry_timestamp: createDate(3, 10), exit_timestamp: createDate(3, 14), followed_plan: true, trade_quality: 'A', entry: 1.0700, exit: 1.0785, stop_loss: 1.0650, take_profit: 1.0785, commission: 5.00 },
    { id: 'trade-4', user_id: 'mock-user-123', trade_taken: false, instrument: 'BTC/USD', pnl: 0, rr: 0, notes: 'Observed a potential reversal setup but chose not to enter due to low conviction. Price did reverse, good practice in discipline.', tags: ['Observation', 'Reversal'], entry_timestamp: createDate(4, 15), exit_timestamp: createDate(4, 15) },
    { id: 'trade-5', user_id: 'mock-user-123', trade_taken: true, account_id: 'acc-2', pnl: 1188.00, rr: 3, risk_percentage: 0.5, instrument: 'USD/JPY', tags: ['Scalp', 'Tokyo'], notes: 'Quick scalp on JPY weakness.', entry_timestamp: createDate(5, 1), exit_timestamp: createDate(5, 2), followed_plan: true, trade_quality: 'B', entry: 157.10, exit: 157.40, stop_loss: 157.00, take_profit: 157.40, commission: 12.00 },
];

export const MOCK_STRATEGIES: Strategy[] = [
    { id: 'strat-1', user_id: 'mock-user-123', name: 'London Breakout', description: 'Trade breakouts of the London session opening range.', entry_conditions: 'Price breaks above/below first hour high/low.', exit_conditions: 'Target 2R or end of session.', market_conditions: 'High volume, trending.'},
    { id: 'strat-2', user_id: 'mock-user-123', name: '5-Min ORB', description: 'Opening Range Breakout on the 5-minute chart.', entry_conditions: 'Enter on break of first 5-min candle.', exit_conditions: 'Trail stop loss.', market_conditions: 'Good for volatile opens.'},
];

export const MOCK_CUSTOM_TAGS: CustomTag[] = [
    { id: 'ctag-1', user_id: 'mock-user-123', name: 'Setup Quality', options: ['A+', 'A', 'B', 'C'] },
];

export const MOCK_OTHER_USERS: User[] = [
    { id: 'user-2', name: 'Jane Doe', email: 'jane@example.com', avatar_url: 'https://api.dicebear.com/8.x/adventurer/svg?seed=jessica-m' },
    { id: 'user-3', name: 'Sam Smith', email: 'sam@example.com', avatar_url: 'https://api.dicebear.com/8.x/adventurer/svg?seed=sam' },
];

export const MOCK_COMMUNITIES: Community[] = [
    {
        id: 'comm-1',
        name: 'London Session Scalpers',
        description: 'A group for traders focusing on the London session.',
        created_by: 'mock-user-123',
        community_members: [{ user_id: 'mock-user-123', community_id: 'comm-1', role: 'admin' }, { user_id: 'user-2', community_id: 'comm-1', role: 'member' }],
        goals: [],
        user_stats_snapshots: []
    }
];

export const MOCK_POSTS: CommunityPost[] = [
    {
        id: 'post-1',
        community_id: 'comm-1',
        author_id: 'user-2',
        content: 'Great session today, anyone catch that GU run?',
        timestamp: createDate(0, 11),
        post_likes: ['mock-user-123'],
        community_comments: [
            { id: 'comment-1', post_id: 'post-1', author_id: 'mock-user-123', content: 'I did! Nice push.', timestamp: createDate(0, 11) }
        ]
    }
];

export const MOCK_NOTIFICATIONS: Notification[] = [
    { id: 'notif-1', type: 'generic', message: 'Welcome to Tradia! Log your first trade to get started.', is_read: false, timestamp: createDate(0, 9) }
];
