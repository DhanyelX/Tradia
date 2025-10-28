import { User, Account, Trade, CustomTag, Community, CommunityPost, Achievement } from './types';

export const SESSIONS = ['Tokyo', 'London', 'New York', 'Sydney'];
export const STRATEGIES = ['Scalp', 'Day Trade', 'Swing Trade', 'Position Trade', 'News Trade', 'Trend Following', 'Counter-trend'];
export const MARKET_CONDITIONS = ['Bullish', 'Bearish', 'Ranging', 'Volatile'];
export const CURRENCIES = ['USD', 'EUR', 'GBP', 'JPY', 'CAD', 'AUD', 'NZD', 'CHF'];
export const EMOTIONS = [
    { name: 'Disciplined', emoji: '🧘' },
    { name: 'Confident', emoji: '😎' },
    { name: 'Patient', emoji: '😌' },
    { name: 'Anxious', emoji: '😟' },
    { name: 'Greedy', emoji: '🤑' },
    { name: 'Fearful', emoji: '😨' },
    { name: 'Impatient', emoji: '🏃‍♂️' },
    { name: 'Hopeful', emoji: '🙏' },
    { name: 'Frustrated', emoji: '😠' },
    { name: 'Euphoric', emoji: '🎉' },
    { name: 'Regretful', emoji: '😫' },
    { name: 'Neutral', emoji: '😐' },
];

export const EMOTION_CATEGORIES = {
    positive: ['Disciplined', 'Confident', 'Patient', 'Euphoric', 'Hopeful'],
    neutral: ['Neutral'],
    negative: ['Anxious', 'Greedy', 'Fearful', 'Impatient', 'Frustrated', 'Regretful'],
};

export const INSTRUMENT_CATEGORIES = {
  'Forex Majors': ['EUR/USD', 'USD/JPY', 'GBP/USD', 'USD/CHF', 'USD/CAD', 'AUD/USD', 'NZD/USD'],
  'Forex Minors': ['EUR/GBP', 'EUR/AUD', 'GBP/JPY', 'CHF/JPY', 'NZD/JPY', 'GBP/CAD', 'EUR/JPY', 'AUD/JPY', 'CAD/JPY', 'EUR/NZD', 'EUR/CAD', 'AUD/CAD', 'GBP/CHF', 'EUR/CHF'],
  'Forex Exotics': ['USD/SEK', 'USD/NOK', 'USD/DKK', 'USD/ZAR', 'USD/HKD', 'USD/TRY', 'USD/MXN'],
  'Crypto': ['BTC/USD', 'ETH/USD', 'XRP/USD', 'LTC/USD', 'BCH/USD', 'ADA/USD', 'DOGE/USD', 'SOL/USD'],
  'Indices': ['US30', 'SPX500', 'NAS100', 'UK100', 'GER30', 'FRA40', 'JPN225', 'HKG50'],
  'Commodities': ['XAU/USD', 'XAG/USD', 'WTI/USD', 'BRENT/USD'],
  'Stocks': ['AAPL', 'GOOGL', 'MSFT', 'AMZN', 'TSLA', 'NVDA', 'META', 'BABA']
};

export interface InstrumentSpec {
    type: 'Forex' | 'Index' | 'Crypto' | 'Stock' | 'Commodity';
    pipPointValue: number;
    pipPointSize: number;
    unitName: 'pips' | 'points';
    lotSize: number;
    notes?: string;
}

const forexNote = "Pip values for non-USD quoted pairs are estimated. For maximum accuracy, confirm with your broker.";

export const INSTRUMENT_SPECS: Record<string, InstrumentSpec> = {
    // Forex (assuming USD account, standard lot)
    'EUR/USD': { type: 'Forex', lotSize: 100000, pipPointValue: 10, pipPointSize: 0.0001, unitName: 'pips' },
    'GBP/USD': { type: 'Forex', lotSize: 100000, pipPointValue: 10, pipPointSize: 0.0001, unitName: 'pips' },
    'AUD/USD': { type: 'Forex', lotSize: 100000, pipPointValue: 10, pipPointSize: 0.0001, unitName: 'pips' },
    'NZD/USD': { type: 'Forex', lotSize: 100000, pipPointValue: 10, pipPointSize: 0.0001, unitName: 'pips' },
    'USD/JPY': { type: 'Forex', lotSize: 100000, pipPointValue: 6.67, pipPointSize: 0.01, unitName: 'pips', notes: forexNote }, // Approx @ 150 JPY
    'USD/CAD': { type: 'Forex', lotSize: 100000, pipPointValue: 7.40, pipPointSize: 0.0001, unitName: 'pips', notes: forexNote }, // Approx @ 1.35 CAD
    'USD/CHF': { type: 'Forex', lotSize: 100000, pipPointValue: 11.11, pipPointSize: 0.0001, unitName: 'pips', notes: forexNote }, // Approx @ 0.90 CHF
    'EUR/JPY': { type: 'Forex', lotSize: 100000, pipPointValue: 6.67, pipPointSize: 0.01, unitName: 'pips', notes: forexNote },
    'GBP/JPY': { type: 'Forex', lotSize: 100000, pipPointValue: 6.67, pipPointSize: 0.01, unitName: 'pips', notes: forexNote },

    // Indices (value per 1 point move per 1 unit/contract)
    'US30': { type: 'Index', lotSize: 1, pipPointValue: 1, pipPointSize: 1, unitName: 'points' },
    'SPX500': { type: 'Index', lotSize: 1, pipPointValue: 1, pipPointSize: 1, unitName: 'points' },
    'NAS100': { type: 'Index', lotSize: 1, pipPointValue: 1, pipPointSize: 1, unitName: 'points' },
    'GER30': { type: 'Index', lotSize: 1, pipPointValue: 1.07, pipPointSize: 1, unitName: 'points', notes: "Point value is in EUR, estimated in USD." }, // Approximated
    'UK100': { type: 'Index', lotSize: 1, pipPointValue: 1.27, pipPointSize: 1, unitName: 'points', notes: "Point value is in GBP, estimated in USD." }, // Approximated

    // Commodities
    'XAU/USD': { type: 'Commodity', lotSize: 100, pipPointValue: 1, pipPointSize: 0.01, unitName: 'points' },
    'XAG/USD': { type: 'Commodity', lotSize: 5000, pipPointValue: 5, pipPointSize: 0.01, unitName: 'points' },
    'WTI/USD': { type: 'Commodity', lotSize: 1000, pipPointValue: 10, pipPointSize: 0.01, unitName: 'points' },
    
    // Crypto (value per $1 move per 1 coin)
    'BTC/USD': { type: 'Crypto', lotSize: 1, pipPointValue: 1, pipPointSize: 1, unitName: 'points' },
    'ETH/USD': { type: 'Crypto', lotSize: 1, pipPointValue: 1, pipPointSize: 1, unitName: 'points' },

    // Stocks (value per $1 move per 1 share)
    'DEFAULT_STOCK': { type: 'Stock', lotSize: 1, pipPointValue: 1, pipPointSize: 1, unitName: 'points' },
};

export const getInstrumentSpec = (instrument: string): InstrumentSpec => {
    if (INSTRUMENT_SPECS[instrument]) {
        return INSTRUMENT_SPECS[instrument];
    }
    const category = Object.keys(INSTRUMENT_CATEGORIES).find(cat => 
        INSTRUMENT_CATEGORIES[cat as keyof typeof INSTRUMENT_CATEGORIES].includes(instrument)
    );
    switch(category) {
        case 'Crypto': return INSTRUMENT_SPECS['BTC/USD'];
        case 'Stocks': return INSTRUMENT_SPECS['DEFAULT_STOCK'];
        case 'Indices': return INSTRUMENT_SPECS['US30'];
        case 'Commodities': return INSTRUMENT_SPECS['XAU/USD'];
        case 'Forex Majors':
        case 'Forex Minors':
        case 'Forex Exotics':
             return INSTRUMENT_SPECS['EUR/USD']; // Default to most common forex spec
        default: return INSTRUMENT_SPECS['DEFAULT_STOCK']; // Default for anything unknown
    }
};


export const SETUP_QUALITY_TAGS = ['Good Setup', 'FOMO', 'Revenge Trade', 'Impulsive', 'Over-leveraged'];

export const TRADE_QUALITY_COLORS: Record<string, string> = {
    A: 'bg-amber-300 text-amber-900',
    B: 'bg-green-500 text-white',
    C: 'bg-orange-500 text-white',
    D: 'bg-red-500 text-white',
};

const today = new Date();
today.setUTCHours(0, 0, 0, 0);
const yesterday = new Date(new Date().setUTCDate(today.getUTCDate() - 1));
yesterday.setUTCHours(0, 0, 0, 0);
const tomorrow = new Date(new Date().setUTCDate(today.getUTCDate() + 1));
tomorrow.setUTCHours(0, 0, 0, 0);

export const MOCK_ECONOMIC_EVENTS = [
    // Yesterday
    { id: 'EVT001', date: yesterday, time: '14:00', currency: 'CAD', impact: 'Low', event: 'BOC Gov Macklem Speaks', forecast: null, previous: null, actual: null },
    { id: 'EVT002', date: yesterday, time: '18:45', currency: 'NZD', impact: 'Medium', event: 'Building Consents m/m', forecast: '1.2%', previous: '-0.2%', actual: '0.9%' },
    // Today
    { id: 'EVT003', date: today, time: '02:00', currency: 'GBP', impact: 'Medium', event: 'Nationwide HPI m/m', forecast: '0.3%', previous: '0.4%', actual: '0.1%' },
    { id: 'EVT004', date: today, time: '08:15', currency: 'EUR', impact: 'High', event: 'Main Refinancing Rate', forecast: '4.50%', previous: '4.50%', actual: null },
    { id: 'EVT005', date: today, time: '08:30', currency: 'USD', impact: 'High', event: 'Non-Farm Employment Change', forecast: '182K', previous: '272K', actual: null },
    { id: 'EVT006', date: today, time: '08:30', currency: 'USD', impact: 'High', event: 'Unemployment Rate', forecast: '3.9%', previous: '4.0%', actual: null },
    { id: 'EVT007', date: today, time: '08:30', currency: 'CAD', impact: 'Medium', event: 'Employment Change', forecast: '22.6K', previous: '26.7K', actual: null },
    { id: 'EVT008', date: today, time: '10:00', currency: 'USD', impact: 'Low', event: 'JOLTS Job Openings', forecast: '8.34M', previous: '8.49M', actual: null },
];