import React from 'react';
import { useAppContext } from '../context';

const EconomicCalendar: React.FC = () => {
    const { theme } = useAppContext();

    const widgetSrc = `https://s.tradingview.com/embed-widget/events/?locale=en&colorTheme=${theme}`;

    return (
        <div className="bg-white/80 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-xl shadow-lg shadow-slate-200/20 dark:shadow-black/20 overflow-hidden">
            <iframe
                src={widgetSrc}
                style={{ width: '100%', height: 'calc(100vh - 10rem)', border: 0 }}
                title="TradingView Economic Calendar"
                frameBorder="0"
            ></iframe>
        </div>
    );
};

export default EconomicCalendar;