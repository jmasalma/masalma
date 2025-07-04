
import React, { useState, useEffect } from 'react';
import { AsmaulHusna } from '../types';
import { getExplanationForName } from '../services/geminiService';

interface NameDetailModalProps {
  name: AsmaulHusna;
  onClose: () => void;
}

const NameDetailModal: React.FC<NameDetailModalProps> = ({ name, onClose }) => {
  const [explanation, setExplanation] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const fetchExplanation = async () => {
      setLoading(true);
      const result = await getExplanationForName(name.name, name.transliteration);
      setExplanation(result);
      setLoading(false);
    };

    fetchExplanation();
  }, [name]);

  // Handle closing modal with Escape key
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [onClose]);


  return (
    <div
      className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div
        className="bg-base-200 w-full max-w-md rounded-2xl shadow-2xl p-6 sm:p-8 border border-white/20 relative transform transition-all animate-in fade-in-0 zoom-in-95"
        onClick={(e) => e.stopPropagation()}
      >
        <button onClick={onClose} className="absolute top-4 right-4 text-text-secondary hover:text-white transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
        </button>
        <div className="text-center">
          <h2 className="font-serif text-5xl text-secondary mb-2">{name.name}</h2>
          <h3 className="text-2xl font-bold text-primary">{name.transliteration}</h3>
          <p className="text-lg text-text-secondary mb-6">"{name.meaning}"</p>
        </div>
        <div className="text-left min-h-[80px]">
          {loading ? (
            <div className="flex justify-center items-center h-full">
              <div className="w-8 h-8 border-2 border-primary border-t-transparent border-solid rounded-full animate-spin"></div>
            </div>
          ) : (
            <p className="text-text-primary text-lg leading-relaxed">{explanation}</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default NameDetailModal;
