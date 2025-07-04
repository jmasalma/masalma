
import React, { useState, useEffect } from 'react';
import { PrayerTimesData, Timings } from '../types';
import { Sun, Moon, Sunrise, Sunset, CloudDrizzle } from 'lucide-react';

interface PrayerTimesDashboardProps {
  prayerTimes: PrayerTimesData | null;
}

const prayerIcons: { [key: string]: React.ReactNode } = {
  Fajr: <CloudDrizzle size={24} className="text-accent" />,
  Sunrise: <Sunrise size={24} className="text-secondary" />,
  Dhuhr: <Sun size={24} className="text-secondary" />,
  Asr: <Sunset size={24} className="text-secondary" />,
  Maghrib: <Moon size={24} className="text-accent" />,
  Isha: <Moon size={24} className="text-accent" />,
};

const PrayerRow: React.FC<{ name: string; time: string; isNext: boolean }> = ({ name, time, isNext }) => (
  <div className={`flex justify-between items-center p-4 rounded-lg transition-all duration-300 ${isNext ? 'bg-primary/20 scale-105' : 'bg-base-200'}`}>
    <div className="flex items-center gap-4">
      {prayerIcons[name]}
      <span className={`font-medium ${isNext ? 'text-primary' : 'text-text-primary'}`}>{name}</span>
    </div>
    <span className={`font-semibold text-lg font-mono ${isNext ? 'text-primary' : 'text-text-secondary'}`}>{time}</span>
  </div>
);


const PrayerTimesDashboard: React.FC<PrayerTimesDashboardProps> = ({ prayerTimes }) => {
  const [nextPrayer, setNextPrayer] = useState<{ name: string; time: string } | null>(null);
  const [countdown, setCountdown] = useState<string>('');

  useEffect(() => {
    if (!prayerTimes) return;

    const calculateNextPrayer = () => {
      const now = new Date();
      const timings = prayerTimes.timings;

      const prayerTimesToday = Object.entries(timings).map(([name, time]) => {
        const [hour, minute] = time.split(':').map(Number);
        const prayerDate = new Date();
        prayerDate.setHours(hour, minute, 0, 0);
        return { name, time: prayerDate };
      });

      let next = null;
      for (const prayer of prayerTimesToday) {
        if (prayer.time > now) {
          next = prayer;
          break;
        }
      }

      // If all prayers for today are done, next prayer is Fajr of the next day
      if (!next) {
        next = prayerTimesToday[0];
        next.time.setDate(next.time.getDate() + 1);
      }
      
      const nextPrayerName = next.name === "Sunrise" ? "Dhuhr" : next.name;
      const nextPrayerDetails = prayerTimesToday.find(p => p.name === nextPrayerName);

      if(nextPrayerDetails) {
          setNextPrayer({ name: nextPrayerDetails.name, time: nextPrayerDetails.time.toTimeString().substring(0,5) });
          
          const interval = setInterval(() => {
              const diff = nextPrayerDetails.time.getTime() - new Date().getTime();
              if (diff <= 0) {
                  clearInterval(interval);
                  setCountdown("Time for prayer!");
                  // Recalculate after a short delay
                  setTimeout(calculateNextPrayer, 2000);
                  return;
              }
              const hours = Math.floor(diff / (1000 * 60 * 60));
              const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
              const seconds = Math.floor((diff % (1000 * 60)) / 1000);
              setCountdown(`${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`);
          }, 1000);

          return () => clearInterval(interval);
      }
    };

    calculateNextPrayer();
  }, [prayerTimes]);

  if (!prayerTimes) {
    return (
      <div className="bg-base-200 p-6 rounded-xl shadow-lg flex justify-center items-center h-full">
        <p className="text-text-secondary">Loading prayer times...</p>
      </div>
    );
  }

  const sortedTimings = Object.entries(prayerTimes.timings);

  return (
    <div className="bg-base-300/50 backdrop-blur-sm p-6 rounded-2xl shadow-2xl border border-white/10">
      <div className="text-center mb-6">
        <p className="text-text-secondary text-lg">Next Prayer: {nextPrayer?.name}</p>
        <p className="text-4xl sm:text-5xl font-bold text-primary tracking-widest font-mono">{countdown}</p>
      </div>
      <div className="space-y-3">
        {sortedTimings.map(([name, time]) => (
          <PrayerRow key={name} name={name} time={time} isNext={nextPrayer?.name === name} />
        ))}
      </div>
    </div>
  );
};

export default PrayerTimesDashboard;
