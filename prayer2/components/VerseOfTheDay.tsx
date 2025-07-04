
import React from 'react';
import { QuranVerse } from '../types';

interface VerseOfTheDayProps {
  verse: QuranVerse | null;
}

const VerseOfTheDay: React.FC<VerseOfTheDayProps> = ({ verse }) => {
  return (
    <div className="bg-base-200 p-6 rounded-2xl shadow-lg border border-white/10">
      <h2 className="text-xl font-bold text-text-primary mb-4">Verse of the Day</h2>
      {verse ? (
        <div className="space-y-4">
          <p className="text-lg text-text-primary leading-relaxed italic">"{verse.text}"</p>
          <p className="text-right text-secondary font-semibold">
            {verse.surah.englishName} ({verse.surah.englishNameTranslation}) {verse.surah.number}:{verse.numberInSurah}
          </p>
        </div>
      ) : (
        <div className="text-text-secondary">Loading verse...</div>
      )}
    </div>
  );
};

export default VerseOfTheDay;
