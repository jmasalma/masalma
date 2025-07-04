
import React from 'react';
import { PrayerTimesData } from '../types';

interface HeaderProps {
    prayerTimes: PrayerTimesData | null;
    error: string | null;
}

const Header: React.FC<HeaderProps> = ({ prayerTimes, error }) => {
    const hijriDate = prayerTimes?.date.hijri;

    return (
        <header>
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center">
                <div>
                    <h1 className="text-4xl font-bold text-primary font-serif">Nur</h1>
                    <p className="text-lg text-text-secondary">Your Islamic Prayer Companion</p>
                </div>
                <div className="text-right mt-4 sm:mt-0">
                    <p className="font-semibold text-lg text-text-primary">{prayerTimes?.date.readable || new Date().toDateString()}</p>
                    {hijriDate && (
                        <p className="text-secondary font-serif text-lg">{`${hijriDate.day} ${hijriDate.month.en} ${hijriDate.year} AH`}</p>
                    )}
                </div>
            </div>
            {error && <div className="mt-4 p-3 bg-red-500/20 text-red-300 border border-red-500/50 rounded-lg text-center">{error}</div>}
        </header>
    );
};

export default Header;
