import React, { useState, useEffect, useRef } from 'react';

const usePrevious = <T,>(value: T): T => {
    const ref = useRef<T>(value);
    useEffect(() => {
        ref.current = value;
    });
    return ref.current;
};


const AnimatedCard: React.FC<{ animation: string; digit: string }> = ({ animation, digit }) => {
    return (
        <div className={`flip-card ${animation}`}>
            <span>{digit}</span>
        </div>
    );
};

const StaticCard: React.FC<{ position: 'upper' | 'lower'; digit: string }> = ({ position, digit }) => {
    return (
        <div className={position}>
            <span>{digit}</span>
        </div>
    );
};

const FlipUnitContainer: React.FC<{ digit: string }> = ({ digit }) => {
    const currentDigit = digit;
    const previousDigit = usePrevious(digit);
    const [isFlipping, setFlipping] = useState(false);

    useEffect(() => {
        if (currentDigit !== previousDigit) {
            setFlipping(true);
            const timer = setTimeout(() => setFlipping(false), 700); // Must be >= animation duration
            return () => clearTimeout(timer);
        }
    }, [currentDigit, previousDigit]);

    return (
        <div className={'flip-unit'}>
            {/* Static top card always shows the new digit */}
            <StaticCard position={'upper'} digit={currentDigit} />
            {/* Static bottom card shows the old digit during flip, new digit otherwise */}
            <StaticCard position={'lower'} digit={isFlipping ? previousDigit : currentDigit} />
            
            {/* Animated cards only render during the flip animation */}
            {isFlipping && <AnimatedCard animation={'fold'} digit={previousDigit} />}
            {isFlipping && <AnimatedCard animation={'unfold'} digit={currentDigit} />}
        </div>
    );
};


const DigitalFlipClock: React.FC<{ time: Date }> = ({ time }) => {
    const hours = time.getHours();
    const minutes = time.getMinutes();
    const seconds = time.getSeconds();
    
    const hourStr = hours.toString().padStart(2, '0');
    const minuteStr = minutes.toString().padStart(2, '0');
    const secondStr = seconds.toString().padStart(2, '0');

    return (
        <div className="flip-clock-container">
            <div className="flip-clock-group">
                <FlipUnitContainer digit={hourStr[0]} />
                <FlipUnitContainer digit={hourStr[1]} />
            </div>
            <div className="flip-clock-separator">:</div>
            <div className="flip-clock-group">
                <FlipUnitContainer digit={minuteStr[0]} />
                <FlipUnitContainer digit={minuteStr[1]} />
            </div>
            <div className="flip-clock-separator">:</div>
            <div className="flip-clock-group">
                <FlipUnitContainer digit={secondStr[0]} />
                <FlipUnitContainer digit={secondStr[1]} />
            </div>
        </div>
    );
};

export default DigitalFlipClock;