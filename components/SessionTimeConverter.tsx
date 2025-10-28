import React, { useState, useEffect, useMemo } from 'react';
import { ChevronRightIcon, SunIcon, MoonIcon } from './Icons';
import DigitalFlipClock from './DigitalFlipClock';

// Helper function to get a timezone's offset from UTC in hours for a given date, accounting for DST.
const getOffsetInHours = (timeZone: string, date: Date): number => {
    try {
        const formatter = new Intl.DateTimeFormat('en-CA', { // 'en-CA' gives YYYY-MM-DD and 24h format
            timeZone,
            year: 'numeric', month: '2-digit', day: '2-digit',
            hour: '2-digit', minute: '2-digit', second: '2-digit',
            hour12: false
        });

        const parts = formatter.formatToParts(date).reduce((acc, part) => {
            if (part.type !== 'literal') acc[part.type] = parseInt(part.value, 10);
            return acc;
        }, {} as any);
        
        const hour = parts.hour === 24 ? 0 : parts.hour;

        const tzTime = Date.UTC(parts.year, parts.month - 1, parts.day, hour, parts.minute, parts.second);
        const utcTime = date.getTime();
        
        return (tzTime - utcTime) / 3600000;
    } catch (e) {
        console.error(`Failed to get offset for timezone: ${timeZone}`, e);
        return 0; // Fallback to UTC
    }
};

const FOREX_MARKETS_CONFIG = [
  { name: 'Sydney', flag: '🇦🇺', timeZone: 'Australia/Sydney', localOpen: 8, localClose: 17, mapPosition: { top: '68%', left: '88%' } },
  { name: 'Tokyo', flag: '🇯🇵', timeZone: 'Asia/Tokyo', localOpen: 9, localClose: 18, mapPosition: { top: '38%', left: '83%' } },
  { name: 'London', flag: '🇬🇧', timeZone: 'Europe/London', localOpen: 8, localClose: 17, mapPosition: { top: '26%', left: '49%' } },
  { name: 'New York', flag: '🇺🇸', timeZone: 'America/New_York', localOpen: 8, localClose: 17, mapPosition: { top: '36%', left: '25%' } },
];


const useTime = (refreshCycle = 1000) => {
    const [now, setNow] = useState(new Date());

    useEffect(() => {
        const intervalId = setInterval(() => setNow(new Date()), refreshCycle);
        return () => clearInterval(intervalId);
    }, [refreshCycle]);

    return now;
};

const formatCountdown = (ms: number) => {
    if (ms < 0) ms = 0;
    const totalSeconds = Math.floor(ms / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    
    return `${hours}h ${minutes}m ${seconds}s`;
};

const WorldMapBackground: React.FC = () => (
    <div className="absolute inset-0 w-full h-full text-slate-200/50 dark:text-slate-800/50 transition-colors duration-300" aria-hidden="true">
        <svg viewBox="0 0 1000 525" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMidYMid slice" className="w-full h-full">
            <path fill="currentColor" d="M982 235c-2-1-5-2-8-1-2 0-4 1-5 3-2 3-3 7-1 10 1 2 2 3 4 4 1 0 2 0 3-1 2-1 4-3 5-5 1-2 2-5 1-8l-1-2zM964 249c-1 0-2 0-2-1-2-1-3-3-3-5 0-2 1-4 2-5 2-1 4-1 6-1 2 0 4 1 5 3 0 2-1 4-2 5-1 1-3 2-5 2-1 1-1 1-1 1zM941 262c-3 0-5-2-6-4-1-3-1-6 0-9 1-2 3-4 5-4 3 0 5 1 6 3 2 3 2 6 0 9s-3 4-5 5zM932 235c0 1 0 2-1 3-1 2-3 3-5 3-2 0-3-1-4-2-2-2-3-5-2-8 1-2 2-4 4-5 2-1 4-1 6 0 2 1 3 3 3 6-1 2-2 4-1 5zM915 241c-2 0-4 1-5 2-1 2-2 4-1 7 1 2 2 3 4 4 2 1 4 1 6 0 2-1 3-3 3-5 1-3 0-6-2-8-1-1-2-2-5-2zM897 247c-2 0-4 1-5 2-1 2-2 4-1 6 1 2 2 3 4 4 2 1 4 0 5-1 2-1 3-3 3-5 1-3 0-5-1-7-1-2-3-2-5-2zM882 254c-1 0-2 1-3 1-2 1-3 3-3 5s1 4 2 5c1 1 3 2 5 2 2 0 4-1 5-2 1-1 2-3 2-5s-1-4-2-5c-1-1-2-1-4-1zM833 247c-2 0-3 1-4 2-2 2-3 4-2 7 0 2 1 4 3 5 1 1 3 1 4 1 2 0 4-1 5-2s2-3 2-5c0-3-1-5-3-7-1-1-2-1-5-1zM859 238c1-4-1-8-5-10-3-1-7-1-10 1-3 1-6 4-7 7-1 3-1 7 1 10 1 2 3 4 5 4 3 0 5-1 7-3 2-2 3-5 4-8 1-2 1-4 0-5zM830 225c2-3 2-7 0-10-1-2-3-3-5-4-3-1-5-1-8 0-3 1-5 3-6 6-1 3-1 6 0 9s3 5 6 6c2 1 5 1 7 0 3-1 5-3 6-7zM805 233c-1-1-2-1-3-1-2 0-4 1-5 2-1 2-2 4-1 7 1 2 2 4 4 4 2 1 4 1 6 0 2-1 3-3 4-6 0-2-1-4-2-5-1-1-2-1-2-1zM786 235c-2 0-4 0-5 2-2 1-3 3-3 5 0 2 1 4 2 5 1 1 3 2 5 2 2 0 4-1 5-2 1-1 2-3 2-5 0-2-1-4-2-5-1-1-3-2-4-2zM813 322c-1 0-1 0-2-1-1-1-2-2-2-4 0-1 0-3 1-4 1-1 2-2 3-2 2 0 3 1 4 2 1 1 2 3 1 4 0 2-1 3-2 4-1 1-2 1-3 1zM796 322c-2 0-4-1-5-2-1-1-2-3-2-5 0-2 1-4 2-5 1-1 2-2 4-2 2 0 3 0 5 1 1 1 2 2 2 4 0 2-1 4-2 5-1 1-2 2-4 2zM776 323c-2 0-3-1-4-2-2-1-3-3-3-5 0-2 1-4 2-5s2-2 4-2c2 0 4 0 5 1s2 3 2 5c0 2-1 4-2 5-1 2-2 3-4 3zM760 322c-2 0-4-1-5-2-1-2-2-3-2-5 0-2 1-4 2-5 1-1 2-2 4-2 2 0 4 0 5 2 1 1 2 2 2 5 0 2-1 3-2 5-1 1-3 2-4 2zM743 323c-2 0-4-1-5-2-1-1-2-3-2-5 0-2 1-4 2-5 1-1 2-2 4-2 2 0 4 0 5 1 1 1 2 3 2 5s-1 4-2 5c-1 1-3 2-4 3zM725 321c-2 0-4-1-5-2-1-1-2-3-2-5 0-2 1-4 2-5 1-1 3-2 4-2 2 0 4 1 5 2 1 1 2 3 2 5 0 2-1 3-2 5-1 1-2 2-4 2zM633 472c-1 0-2 0-3-1-1-1-2-2-2-3 0-2 1-3 2-4s2-2 4-2c2 0 3 0 4 1 2 1 3 2 3 4 0 2-1 3-2 4-1 1-2 2-4 2-1 0-1 0-1 0zM615 478c-2 0-4-1-5-2-1-1-2-3-2-5 0-2 1-4 2-5s3-2 5-2c2 0 4 1 5 2s2 3 2 5-1 4-2 5c-1 1-3 2-5 2zM597 483c-2 0-4-1-5-2-1-1-2-3-2-5 0-2 1-4 2-5 1-1 3-2 4-2 2 0 4 0 5 2 1 1 2 3 2 5 0 2-1 4-2 5-1 1-3 2-4 2zM578 488c-2 0-4-1-5-2-1-1-2-3-2-5 0-2 1-4 2-5 1-1 3-2 4-2s4 1 5 2c1 1 2 3 2 5s-1 4-2 5c-1 1-3 2-4 2zM560 490c-2 0-4-1-5-2-1-2-2-3-2-5 0-2 1-4 2-5 1-1 3-2 4-2 2 0 4 0 5 2 1 1 2 3 2 5 0 2-1 4-2 5-1 1-3 2-4 2zM542 491c-2 0-4-1-5-2-1-1-2-3-2-5 0-2 1-4 2-5s2-2 4-2c2 0 4 1 5 2s2 3 2 5-1 4-2 5c-1 2-2 2-4 2zM523 491c-2 0-4-1-5-2-1-1-2-3-2-5 0-2 1-4 2-5s2-2 4-2c2 0 4 1 5 2 1 1 2 3 2 5 0 2-1 4-2 5-1 1-3 2-4 2zM505 487c-2 0-4-1-5-2-1-1-2-3-2-5 0-2 1-4 2-5s3-2-5-2c-2 0-4 1-5 2-1 2-2 3-2 5 0 2 1 4 2 5 1 1 3 2 4 2zM487 480c-2 0-4-1-5-2-1-1-2-3-2-5 0-2 1-4 2-5 1-1 3-2 4-2 2 0 4 1 5 2 1 1 2 3 2 5 0 2-1 4-2 5-1 1-3 2-4 2zM470 472c-2 0-3-1-4-2-2-1-3-3-3-5 0-2 1-4 2-5 1-1 3-2 4-2 2 0 4 1 5 2 1 1 2 3 2 5 0 2-1 4-2 5-1 1-3 2-4 2zM451 462c-2 0-4-1-5-2-1-2-2-3-2-5 0-2 1-4 2-5 1-1 3-2 4-2s4 1 5 2c1 1 2 3 2 5s-1 4-2 5c-1 1-3 2-4 2zM433 453c-2 0-4-1-5-2-1-1-2-3-2-5 0-2 1-4 2-5 1-1 3-2 4-2 2 0 4 1 5 2 1 1 2 3 2 5 0 2-1 4-2 5-1 1-3 2-4 2zM415 444c-2 0-4-1-5-2-1-1-2-3-2-5s1-4 2-5c1-1 3-2 4-2 2 0 4 1 5 2 1 1 2 3 2 5 0 2-1 4-2 5-1 1-3 2-4 2zM397 435c-2 0-4-1-5-2-1-1-2-3-2-5 0-2 1-4 2-5s2-2 4-2c2 0 4 1 5 2 1 1 2 3 2 5-1 4-2 5-1 1-3 2-4 2zM379 427c-2 0-4-1-5-2-1-1-2-3-2-5 0-2 1-4 2-5 1-1 3-2 4-2 2 0 4 1 5 2 1 1 2 3 2 5 0 2-1 4-2 5-1 1-3 2-4 2zM362 420c-2 0-4-1-5-2-1-1-2-3-2-5s1-4 2-5c1-1 3-2 4-2 2 0 4 1 5 2 1 1 2 3 2 5 0 2-1 4-2 5-1 1-3 2-4 2zM345 413c-2 0-4-1-5-2-1-2-2-3-2-5 0-2 1-4 2-5 1-1 3-2 4-2 2 0 4 1 5 2s2 3 2 5-1 4-2 5c-1 1-3 2-4 2zM327 406c-2 0-4-1-5-2-1-1-2-3-2-5s1-4 2-5c1-1 3-2 4-2 2 0 4 1 5 2 1 1 2 3 2 5 0 2-1 4-2 5-1 1-3 2-4 2zM309 398c-2 0-4-1-5-2-1-1-2-3-2-5 0-2 1-4 2-5s2-2 4-2c2 0 4 1 5 2 1 1 2 3 2 5 0 2-1 4-2 5-1 1-3 2-4 2zM292 390c-2 0-4-1-5-2-1-1-2-3-2-5 0-2 1-4 2-5 1-1 3-2 4-2 2 0 4 1 5 2 1 1 2 3 2 5 0 2-1 4-2 5-1 1-3 2-4 2zM275 382c-2 0-4-1-5-2-1-1-2-3-2-5 0-2 1-4 2-5s2-2 4-2c2 0 4 1 5 2 1 1 2 3 2 5 0 2-1 4-2 5-1 1-3 2-4 2zM258 373c-2 0-4-1-5-2-1-1-2-3-2-5 0-2 1-4 2-5 1-1 3-2 4-2s4 1 5 2c1 1 2 3 2 5-1 2-1 4-2 5-1 1-3 2-4 2zM240 364c-2 0-4-1-5-2-1-1-2-3-2-5s1-4 2-5c1-1 3-2 4-2 2 0 4 1 5 2 1 1 2 3 2 5 0 2-1 4-2 5-1 1-3 2-4 2zM222 354c-2 0-4-1-5-2-1-1-2-3-2-5 0-2 1-4 2-5s2-2 4-2c2 0 4 1 5 2 1 1 2 3 2 5 0 2-1 4-2 5-1 1-3 2-4 2zM205 344c-2 0-4-1-5-2-1-1-2-3-2-5 0-2 1-4 2-5s3-2 4-2c2 0 4 1 5 2s2 3 2 5-1 4-2 5c-1 1-3 2-4 2zM188 333c-2 0-4-1-5-2-1-1-2-3-2-5 0-2 1-4 2-5 1-1 3-2 4-2 2 0 4 1 5 2 1 1 2 3 2 5 0 2-1 4-2 5-1 1-3 2-4 2zM170 322c-2 0-4-1-5-2-1-1-2-3-2-5s1-4 2-5c1-1 3-2 4-2c2 0 4 1 5 2 1 1 2 3 2 5 0 2-1 4-2 5-1 1-3 2-4 2zM153 310c-2 0-4-1-5-2-1-1-2-3-2-5 0-2 1-4 2-5 1-1 3-2 4-2 2 0 4 1 5 2 1 1 2 3 2 5s-1 4-2 5c-1 1-3 2-4 2zM136 297c-2 0-4-1-5-2-1-1-2-3-2-5 0-2 1-4 2-5s3-2 4-2c2 0 4 1 5 2 1 1 2 3 2 5s-1 4-2 5-3 2-4 2zM119 283c-2 0-4-1-5-2-1-1-2-3-2-5 0-2 1-4 2-5 1-1 3-2 4-2 2 0 4 1 5 2 1 1 2 3 2 5 0 2-1 4-2 5-1 1-3 2-4 2zM102 268c-2 0-4-1-5-2-1-1-2-3-2-5 0-2 1-4 2-5 1-1 3-2 4-2 2 0 4 1 5 2 1 1 2 3 2 5 0 2-1 4-2 5-1 1-3 2-4 2zM85 253c-2 0-4-1-5-2-1-1-2-3-2-5s1-4 2-5c1-1 3-2 4-2 2 0 4 1 5 2 1 1 2 3 2 5s-1 4-2 5c-1 1-3 2-4 2zM68 237c-2 0-4-1-5-2-1-1-2-3-2-5 0-2 1-4 2-5 1-1 3-2 4-2 2 0 4 1 5 2s2 3 2 5-1 4-2 5c-1 1-3 2-4 2zM52 221c-2 0-4-1-5-2-1-1-2-3-2-5 0-2 1-4 2-5s2-2 4-2c2 0 4 1 5 2 1 1 2 3 2 5 0 2-1 4-2 5-1 1-3 2-4 2zM36 205c-2 0-4-1-5-2-1-1-2-3-2-5 0-2 1-4 2-5 1-1 3-2 4-2s4 1 5 2c1 1 2 3 2 5-1 2-1 4-2 5-1 1-3 2-4 2zM21 189c-2 0-4-1-5-2-1-1-2-3-2-5s1-4 2-5c1-1 3-2 4-2c2 0 4 1 5 2s2 3 2 5-1 4-2 5c-1 1-3 2-4 2zM20 173c-2 0-4-1-5-2-1-1-2-3-2-5 0-2 1-4 2-5 1-1 3-2 4-2 2 0 4 1 5 2 1 1 2 3 2 5 0 2-1 4-2 5-1 1-3 2-4 2zM21 157c-2 0-4-1-5-2-1-1-2-3-2-5 0-2 1-4 2-5s2-2 4-2c2 0 4 1 5 2 1 1 2 3 2 5s-1 4-2 5c-1 1-3 2-4 2zM22 142c-2 0-4-1-5-2-1-1-2-3-2-5 0-2 1-4 2-5 1-1 3-2 4-2 2 0 4 1 5 2s2 3 2 5-1 4-2 5-3 2-4 2zM25 127c-2 0-4-1-5-2-1-1-2-3-2-5s1-4 2-5c1-1 3-2 4-2c2 0 4 1 5 2 1 1 2 3 2 5 0 2-1 4-2 5-1 1-3 2-4 2zM28 113c-2 0-4-1-5-2-1-1-2-3-2-5 0-2 1-4 2-5s3-2 4-2c2 0 4 1 5 2s2 3 2 5-1 4-2 5c-1 1-3 2-4 2zM32 99c-2 0-4-1-5-2-1-1-2-3-2-5s1-4 2-5c1-1 3-2 4-2 2 0 4 1 5 2s2 3 2 5-1 4-2 5c-1 1-3 2-4 2zM38 86c-2 0-4-1-5-2-1-1-2-3-2-5 0-2 1-4 2-5 1-1 3-2 4-2s4 1 5 2c1 1 2 3 2 5-1 2-1 4-2 5-1 1-3 2-4 2zM45 74c-2 0-4-1-5-2-1-1-2-3-2-5 0-2 1-4 2-5s3-2 4-2c2 0 4 1 5 2s2 3 2 5c0 2-1 4-2 5-1 1-3 2-4 2zM53 63c-2 0-4-1-5-2-1-1-2-3-2-5s1-4 2-5c1-1 3-2 4-2 2 0 4 1 5 2 1 1 2 3 2 5 0 2-1 4-2 5-1 1-3 2-4 2zM62 53c-2 0-4-1-5-2-1-1-2-3-2-5s1-4 2-5c1-1 3-2 4-2 2 0 4 1 5 2 1 1 2 3 2 5-1 2-1 4-2 5-1 1-3 2-4 2zM73 44c-2 0-4-1-5-2-1-1-2-3-2-5 0-2 1-4 2-5 1-1 3-2 4-2 2 0 4 1 5 2s2 3 2 5-1 4-2 5c-1 1-3 2-4 2zM85 36c-2 0-4-1-5-2-1-1-2-3-2-5 0-2 1-4 2-5 1-1 3-2 4-2s4 1 5 2c1 1 2 3 2 5s-1 4-2 5c-1 1-3 2-4 2zM98 30c-2 0-4-1-5-2-1-1-2-3-2-5 0-2 1-4 2-5 1-1 3-2 4-2 2 0 4 1 5 2s2 3 2 5-1 4-2 5c-1 1-3 2-4 2zM111 25c-2 0-4-1-5-2-1-1-2-3-2-5 0-2 1-4 2-5 1-1 3-2 4-2s4 1 5 2c1 1 2 3 2 5-1 2-1 4-2 5-1 1-3 2-4 2zM125 21c-2 0-4-1-5-2-1-1-2-3-2-5 0-2 1-4 2-5s3-2 4-2c2 0 4 1 5 2s2 3 2 5-1 4-2 5c-1 1-3 2-4 2zM140 18c-2 0-4-1-5-2-1-1-2-3-2-5 0-2 1-4 2-5s3-2 4-2c2 0 4 1 5 2s2 3 2 5-1 4-2 5c-1 1-3 2-4 2zM156 16c-2 0-4-1-5-2-1-1-2-3-2-5 0-2 1-4 2-5s2-2 4-2c2 0 4 1 5 2 1 1 2 3 2 5 0 2-1 4-2 5-1 1-3 2-4 2zM172 15c-2 0-4-1-5-2-1-1-2-3-2-5 0-2 1-4 2-5 1-1 3-2 4-2s4 1 5 2c1 1 2 3 2 5s-1 4-2 5c-1 1-3 2-4 2zM189 15c-2 0-4-1-5-2-1-1-2-3-2-5 0-2 1-4 2-5s3-2 4-2c2 0 4 1 5 2s2 3 2 5c0 2-1 4-2 5-1 1-3 2-4 2zM207 16c-2 0-4-1-5-2-1-1-2-3-2-5s1-4 2-5c1-1 3-2 4-2 2 0 4 1 5 2 1 1 2 3 2 5 0 2-1 4-2 5-1 1-3 2-4 2zM224 18c-2 0-4-1-5-2-1-1-2-3-2-5 0-2 1-4 2-5 1-1 3-2 4-2 2 0 4 1 5 2s2 3 2 5-1 4-2 5c-1 1-3 2-4 2zM242 21c-2 0-4-1-5-2-1-1-2-3-2-5 0-2 1-4 2-5s3-2 4-2c2 0 4 1 5 2s2 3 2 5-1 4-2 5-3 2-4 2zM260 25c-2 0-4-1-5-2-1-1-2-3-2-5 0-2 1-4 2-5s3-2 4-2c2 0 4 1 5 2 1 1 2 3 2 5-1 2-1 4-2 5-1 1-3 2-4 2zM277 30c-2 0-4-1-5-2-1-1-2-3-2-5s1-4 2-5c1-1 3-2 4-2 2 0 4 1 5 2s2 3 2 5c0 2-1 4-2 5-1 1-3 2-4 2zM294 36c-2 0-4-1-5-2-1-1-2-3-2-5s1-4 2-5c1-1 3-2 4-2 2 0 4 1 5 2s2 3 2 5c0 2-1 4-2 5-1 1-3 2-4 2zM310 44c-2 0-4-1-5-2-1-1-2-3-2-5 0-2 1-4 2-5 1-1 3-2 4-2s4 1 5 2c1 1 2 3 2 5-1 2-1 4-2 5-1 1-3 2-4 2zM327 53c-2 0-4-1-5-2-1-1-2-3-2-5s1-4 2-5c1-1 3-2 4-2c2 0 4 1 5 2s2 3 2 5-1 4-2 5c-1 1-3 2-4 2zM344 63c-2 0-4-1-5-2-1-1-2-3-2-5 0-2 1-4 2-5s3-2 4-2c2 0 4 1 5 2s2 3 2 5c0 2-1 4-2 5-1 1-3 2-4 2zM361 74c-2 0-4-1-5-2-1-1-2-3-2-5 0-2 1-4 2-5s2-2 4-2c2 0 4 1 5 2 1 1 2 3 2 5s-1 4-2 5c-1 1-3 2-4 2zM378 86c-2 0-4-1-5-2-1-1-2-3-2-5 0-2 1-4 2-5 1-1 3-2 4-2s4 1 5 2c1 1 2 3 2 5-1 2-1 4-2 5-1 1-3 2-4 2zM394 99c-2 0-4-1-5-2-1-1-2-3-2-5 0-2 1-4 2-5 1-1 3-2 4-2 2 0 4 1 5 2s2 3 2 5-1 4-2 5c-1 1-3 2-4 2zM410 113c-2 0-4-1-5-2-1-1-2-3-2-5s1-4 2-5c1-1 3-2 4-2c2 0 4 1 5 2s2 3 2 5c0 2-1 4-2 5-1 1-3 2-4 2zM425 127c-2 0-4-1-5-2-1-1-2-3-2-5 0-2 1-4 2-5s3-2 4-2c2 0 4 1 5 2s2 3 2 5-1 4-2 5c-1 1-3 2-4 2zM438 142c-2 0-4-1-5-2-1-1-2-3-2-5 0-2 1-4 2-5 1-1 3-2 4-2 2 0 4 1 5 2s2 3 2 5-1 4-2 5-3 2-4 2zM450 157c-2 0-4-1-5-2-1-1-2-3-2-5 0-2 1-4 2-5s3-2 4-2c2 0 4 1 5 2s2 3 2 5-1 4-2 5c-1 1-3 2-4 2zM459 173c-2 0-4-1-5-2-1-1-2-3-2-5s1-4 2-5c1-1 3-2 4-2 2 0 4 1 5 2s2 3 2 5-1 4-2 5c-1 1-3 2-4 2zM466 189c-2 0-4-1-5-2-1-1-2-3-2-5s1-4 2-5c1-1 3-2 4-2 2 0 4 1 5 2 1 1 2 3 2 5s-1 4-2 5c-1 1-3 2-4 2zM470 205c-2 0-4-1-5-2-1-1-2-3-2-5 0-2 1-4 2-5s3-2 4-2c2 0 4 1 5 2s2 3 2 5-1 4-2 5c-1 1-3 2-4 2zM472 221c-2 0-4-1-5-2-1-1-2-3-2-5 0-2 1-4 2-5s3-2 4-2c2 0 4 1 5 2 1 1 2 3 2 5-1 2-1 4-2 5-1 1-3 2-4 2zM470 237c-2 0-4-1-5-2-1-1-2-3-2-5s1-4 2-5c1-1 3-2 4-2 2 0 4 1 5 2s2 3 2 5c0 2-1 4-2 5-1 1-3 2-4 2zM466 253c-2 0-4-1-5-2-1-1-2-3-2-5s1-4 2-5c1-1 3-2 4-2 2 0 4 1 5 2 1 1 2 3 2 5s-1 4-2 5c-1 1-3 2-4 2zM459 268c-2 0-4-1-5-2-1-1-2-3-2-5s1-4 2-5c1-1 3-2 4-2c2 0 4 1 5 2s2 3 2 5-1 4-2 5c-1 1-3 2-4 2zM450 283c-2 0-4-1-5-2-1-1-2-3-2-5 0-2 1-4 2-5s3-2 4-2c2 0 4 1 5 2 1 1 2 3 2 5s-1 4-2 5c-1 1-3 2-4 2zM438 297c-2 0-4-1-5-2-1-1-2-3-2-5 0-2 1-4 2-5s2-2 4-2c2 0 4 1 5 2 1 1 2 3 2 5-1 2-1 4-2 5-1 1-3 2-4 2zM425 310c-2 0-4-1-5-2-1-1-2-3-2-5s1-4 2-5c1-1 3-2 4-2c2 0 4 1 5 2s2 3 2 5c0 2-1 4-2 5-1 1-3 2-4 2zM410 322c-2 0-4-1-5-2-1-1-2-3-2-5s1-4 2-5c1-1 3-2 4-2c2 0 4 1 5 2 1 1 2 3 2 5s-1 4-2 5c-1 1-3 2-4 2zM533 227c-3-1-7-1-10 1-3 2-5 5-5 9 0 3 2 6 5 8 2 2 5 3 8 2 3-1 6-4 7-7 0-4-2-7-5-9zM556 195c-1 0-2 0-2-1-1-1-2-3-2-4 0-2 1-3 2-4 1-1 2-2 4-2 2 0 3 1 4 2 1 1 2 3 1 5 0 2-1 3-2 4-1 1-2 1-3 1zM580 178c-1-2-1-5 0-7 1-2 3-3 5-3 2 0 4 1 5 2s2 4 1 6-3 4-5 4c-2 0-3-1-4-2zM604 163c-1-2-1-5 0-7s3-3 5-3c2 0 4 1 5 2 1 2 2 4 1 6s-3 4-5 4c-2 0-3-1-4-2zM627 152c-1-2-1-5 0-7s3-3 5-3c2 0 4 1 5 2 1 2 2 4 1 6s-3 4-5 4c-2-1-3-1-4-2zM650 144c-1-2-1-5 0-7s3-3 5-3c2 0 4 1 5 2 1 2 2 4 1 6s-3 4-5 4c-2 0-3-1-4-2zM672 138c-1-2-1-5 0-7s3-3 5-3c2 0 4 1 5 2 1 2 2 4 1 6s-3 4-5 4c-2 0-3-1-4-2zM694 134c-1-2-1-5 0-7s3-3 5-3c2 0 4 1 5 2 1 2 2 4 1 6s-3 4-5 4c-2 0-3-1-4-2zM715 131c-1-2-1-5 0-7s3-3 5-3c2 0 4 1 5 2 1 2 2 4 1 6s-3 4-5 4c-2 0-3-1-4-2zM735 129c-1-2-1-5 0-7s3-3 5-3c2 0 4 1 5 2 1 2 2 4 1 6s-3 4-5 4c-2 0-3-1-4-2zM755 128c-1-2-1-5 0-7s3-3 5-3c2 0 4 1 5 2 1 2 2 4 1 6-1 3-3 4-5 4-2 0-3-1-4-2zM773 128c-1-2-1-5 0-7s3-3 5-3c2 0 4 1 5 2 1 2 2 4 1 6s-3 4-5 4c-2 0-3-1-4-2zM790 128c-1-2-1-5 0-7s3-3 5-3c2 0 4 1 5 2 1 2 2 4 1 6-1 3-3 4-5 4-2 0-3-1-4-2zM806 128c-1-2-1-5 0-7s3-3 5-3c2 0 4 1 5 2 1 2 2 4 1 6-1 3-3 4-5 4-2 0-3-1-4-2zM822 128c-1-2-1-5 0-7s3-3 5-3c2 0 4 1 5 2 1 2 2 4 1 6-1 3-3 4-5 4-2 0-3-1-4-2zM837 127c-1-2-1-5 0-7s3-3 5-3c2 0 4 1 5 2 1 2 2 4 1 6-1 3-3 4-5 4-2 0-3-1-4-2zM852 125c-1-2-1-5 0-7s3-3 5-3c2 0 4 1 5 2 1 2 2 4 1 6s-3 4-5 4c-2 0-3-1-4-2zM866 122c-1-2-1-5 0-7s3-3 5-3c2 0 4 1 5 2 1 2 2 4 1 6s-3 4-5 4c-2 0-3-1-4-2zM880 119c-1-2-1-5 0-7s3-3 5-3c2 0 4 1 5 2 1 2 2 4 1 6s-3 4-5 4c-2 0-3-1-4-2zM893 115c-1-2-1-5 0-7s3-3 5-3c2 0 4 1 5 2 1 2 2 4 1 6s-3 4-5 4c-2 0-3-1-4-2zM906 111c-1-2-1-5 0-7s3-3 5-3c2 0 4 1 5 2 1 2 2 4 1 6-1 3-3 4-5 4-2 0-3-1-4-2zM919 107c-1-2-1-5 0-7s3-3 5-3c2 0 4 1 5 2 1 2 2 4 1 6s-3 4-5 4c-2 0-3-1-4-2zM931 103c-1-2-1-5 0-7s3-3 5-3c2 0 4 1 5 2 1 2 2 4 1 6s-3 4-5 4-3-1-4-2zM943 99c-1-2-1-5 0-7s3-3 5-3c2 0 4 1 5 2 1 2 2 4 1 6-1 3-3 4-5 4-2 0-3-1-4-2zM955 95c-1-2-1-5 0-7s3-3 5-3c2 0 4 1 5 2 1 2 2 4 1 6s-3 4-5 4c-2 0-3-1-4-2zM966 91c-1-2-1-5 0-7s3-3 5-3c2 0 4 1 5 2 1 2 2 4 1 6s-3 4-5 4c-2 0-3-1-4-2zM976 87c-1-2-1-5 0-7s3-3 5-3c2 0 4 1 5 2 1 2 2 4 1 6-1 3-3 4-5 4-2 0-3-1-4-2zM700 196c-1 0-2 0-2-1-1-1-2-3-2-4 0-2 1-3 2-4s2-2 4-2c2 0 3 1 4 2 1 1 2 3 1 5 0 2-1 3-2 4-1 1-2 1-3 1zM678 206c-1 0-2-1-3-1-2-1-3-3-3-5s1-4 2-5c1-1 3-2 5-2 2 0 4 1 5 2 1 1 2 3 2 5 0 2-1 4-2 5-1 1-3 2-4 2zM656 215c-1 0-2 0-3-1-1-1-2-2-2-4 0-1 0-3 1-4 1-1 2-2 3-2s3 1 4 2c1 1 2 3 1 4 0 2-1 3-2 4-1 1-2 1-3 1zM633 222c-2 0-3-1-4-2-2-1-3-3-3-5s1-4 2-5c1-1 3-2 4-2 2 0 4 1 5 2s2 3 2 5c0 2-1 4-2 5-1 1-3 2-4 2zM611 228c-2 0-4-1-5-2-1-1-2-3-2-5 0-2 1-4 2-5s2-2 4-2c2 0 4 1 5 2 1 1 2 3 2 5s-1 4-2 5-3 2-4 2zM589 232c-2 0-4-1-5-2-1-1-2-3-2-5 0-2 1-4 2-5s3-2 4-2c2 0 4 1 5 2 1 1 2 3 2 5 0 2-1 4-2 5-1 1-3 2-4 2zM567 234c-2 0-4-1-5-2-1-1-2-3-2-5 0-2 1-4 2-5s3-2 4-2c2 0 4 1 5 2s2 3 2 5-1 4-2 5c-1 1-3 2-4 2z"/>
        </svg>
    </div>
);

const SessionTimeConverter: React.FC = () => {
    const now = useTime();

    const marketData = useMemo(() => {
        return FOREX_MARKETS_CONFIG.map(market => {
            const today = new Date(now);
            const marketOffset = getOffsetInHours(market.timeZone, today);
            const utcOpenHour = (market.localOpen - marketOffset + 24) % 24;

            const getMarketTime = (hour: number) => {
                const marketTime = new Date(today);
                marketTime.setUTCHours(hour - marketOffset, 0, 0, 0);
                return marketTime;
            };

            let openTime = getMarketTime(market.localOpen);
            let closeTime = getMarketTime(market.localClose);

            if (now < openTime && openTime.getTime() - now.getTime() > 12 * 60 * 60 * 1000) {
                openTime.setDate(openTime.getDate() - 1);
                closeTime.setDate(closeTime.getDate() - 1);
            } else if (now > closeTime && now.getTime() - closeTime.getTime() > 12 * 60 * 60 * 1000) {
                openTime.setDate(openTime.getDate() + 1);
                closeTime.setDate(closeTime.getDate() + 1);
            }

            const isWeekend = now.getUTCDay() === 6 || (now.getUTCDay() === 5 && now.getUTCHours() >= 21) || (now.getUTCDay() === 0 && now.getUTCHours() < 21);
            const isOpen = !isWeekend && now >= openTime && now < closeTime;
            
            let statusText = '';
            if (isOpen) {
                statusText = `closes in ${formatCountdown(closeTime.getTime() - now.getTime())}`;
            } else if (!isWeekend) {
                let nextOpen = openTime;
                if (now > closeTime) { // It's after today's session, calculate for next session
                     nextOpen = new Date(openTime);
                     nextOpen.setDate(nextOpen.getDate() + 1);
                }
                if (nextOpen.getUTCDay() === 6) { // If next open is Saturday, skip to Monday
                    nextOpen.setDate(nextOpen.getDate() + 2);
                } else if (nextOpen.getUTCDay() === 0) { // If next open is Sunday, skip to Monday
                     nextOpen.setDate(nextOpen.getDate() + 1);
                }
                statusText = `opens in ${formatCountdown(nextOpen.getTime() - now.getTime())}`;
            } else {
                 statusText = 'Market Closed';
            }
            
            const localTime = new Date(now.toLocaleString('en-US', { timeZone: market.timeZone }));
            const localHour = localTime.getHours();

            return { ...market, isOpen, statusText, localHour, utcOpenHour, openTime, closeTime };
        }).sort((a, b) => {
            // Adjust hours for sorting: treat hours >= 20 as "early" part of the day
            const aHour = a.utcOpenHour >= 20 ? a.utcOpenHour - 24 : a.utcOpenHour;
            const bHour = b.utcOpenHour >= 20 ? b.utcOpenHour - 24 : b.utcOpenHour;
            return aHour - bHour;
        });
    }, [now]);

    return (
         <div className="bg-white/80 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-xl shadow-lg shadow-slate-200/20 dark:shadow-black/20 overflow-hidden">
            <div className="p-4 border-b border-slate-200 dark:border-slate-800">
                <h2 className="font-semibold text-slate-600 dark:text-slate-300 flex items-center gap-2">
                    Market Hours <ChevronRightIcon className="w-4 h-4" />
                </h2>
            </div>
            
            <div className="py-4 bg-slate-50 dark:bg-slate-900/50 border-b border-slate-200 dark:border-slate-800">
                <DigitalFlipClock time={now} />
                <p className="text-center text-xs text-slate-500 dark:text-slate-400 mt-2">Your Local Time ({Intl.DateTimeFormat().resolvedOptions().timeZone.replace('_', ' ')})</p>
            </div>

            <div className="relative aspect-[16/9] w-full max-w-4xl mx-auto overflow-hidden">
                <WorldMapBackground />
                <div className="absolute top-0 left-1/2 -translate-x-1/2 h-full w-px bg-slate-300/50 dark:bg-slate-700/50"></div>
                {marketData.map(market => {
                     const isDay = market.localHour >= 6 && market.localHour < 18;
                     return (
                        <div key={market.name} className="absolute transition-all duration-300 transform -translate-x-1/2" style={market.mapPosition}>
                           <div className={`bg-white/70 dark:bg-slate-900/70 backdrop-blur-sm rounded-full shadow-md px-2 py-1 sm:px-3 sm:py-1.5 flex items-center gap-1 sm:gap-2 border border-slate-200/50 dark:border-slate-700/50 ${market.isOpen ? 'pulsing-glow' : ''}`}>
                               <span className="text-xs sm:text-sm">{market.flag}</span>
                               <span className="text-xs sm:text-sm font-medium text-slate-800 dark:text-slate-200">{market.name}</span>
                               {isDay ? <SunIcon className="w-4 h-4 sm:w-5 sm:h-5 text-yellow-500" /> : <MoonIcon className="w-4 h-4 sm:w-5 sm:h-5 text-slate-400" />}
                           </div>
                        </div>
                    );
                })}
            </div>

            <div className="p-4 space-y-3">
                {marketData.map(market => {
                    const isDay = market.localHour >= 6 && market.localHour < 18;
                    return (
                        <div key={market.name} className="flex justify-between items-center text-sm">
                            <div className="flex items-center gap-3">
                                {isDay ? <SunIcon className="w-6 h-6 text-yellow-500" /> : <MoonIcon className="w-6 h-6 text-slate-400" />}
                                <span className="font-medium text-slate-800 dark:text-slate-200">{market.flag} {market.name}</span>
                            </div>
                            <span className="text-slate-500 dark:text-slate-400 font-mono">{market.statusText}</span>
                        </div>
                    );
                })}
            </div>

            <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900">
                <h3 className="font-semibold text-slate-600 dark:text-slate-300 mb-3">Session Times (Your Local Time)</h3>
                <div className="space-y-2 text-sm">
                    {marketData.map(market => (
                        <div key={market.name + '-local-time'} className="flex justify-between items-center bg-slate-100 dark:bg-slate-800/50 p-2.5 rounded-md">
                            <span className="font-medium text-slate-800 dark:text-slate-200">{market.flag} {market.name}</span>
                            <span className="font-mono text-slate-600 dark:text-slate-300">
                                {market.openTime.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })} - {market.closeTime.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}
                            </span>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default SessionTimeConverter;