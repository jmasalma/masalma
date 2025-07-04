
import React from 'react';
import { AsmaulHusna } from '../types';

interface AsmaulHusnaGridProps {
  names: AsmaulHusna[];
  onNameClick: (name: AsmaulHusna) => void;
}

const AsmaulHusnaGrid: React.FC<AsmaulHusnaGridProps> = ({ names, onNameClick }) => {
  return (
    <div className="bg-base-300/50 backdrop-blur-sm p-6 rounded-2xl shadow-2xl border border-white/10">
      <h2 className="text-2xl font-bold text-center text-text-primary mb-6">The 99 Names of Allah</h2>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
        {names.map((name, index) => (
          <button
            key={index}
            onClick={() => onNameClick(name)}
            className="text-center p-3 bg-base-200 rounded-lg hover:bg-primary/20 hover:scale-105 transform transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-primary"
          >
            <p className="font-serif text-2xl text-secondary">{name.name}</p>
            <p className="text-sm font-semibold text-text-primary">{name.transliteration}</p>
            <p className="text-xs text-text-secondary">{name.meaning}</p>
          </button>
        ))}
      </div>
    </div>
  );
};

export default AsmaulHusnaGrid;
