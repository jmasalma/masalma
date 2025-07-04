
import React, { useState, useEffect, useCallback } from 'react';
import { PrayerTimesData, QuranVerse, AsmaulHusna } from './types';
import { getPrayerTimes } from './services/prayerTimeService';
import { getRandomVerse } from './services/quranService';
import Header from './components/Header';
import PrayerTimesDashboard from './components/PrayerTimesDashboard';
import QiblaCompass from './components/QiblaCompass';
import VerseOfTheDay from './components/VerseOfTheDay';
import AsmaulHusnaGrid from './components/AsmaulHusnaGrid';
import Loader from './components/Loader';
import { ASMA_UL_HUSNA } from './constants';
import NameDetailModal from './components/NameDetailModal';

const App: React.FC = () => {
  const [prayerTimes, setPrayerTimes] = useState<PrayerTimesData | null>(null);
  const [quranVerse, setQuranVerse] = useState<QuranVerse | null>(null);
  const [location, setLocation] = useState<{ lat: number; lon: number } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedName, setSelectedName] = useState<AsmaulHusna | null>(null);

  const fetchAllData = useCallback(async (lat: number, lon: number) => {
    try {
      setLoading(true);
      setError(null);
      const [prayerData, verseData] = await Promise.all([
        getPrayerTimes(lat, lon),
        getRandomVerse()
      ]);
      setPrayerTimes(prayerData);
      setQuranVerse(verseData);
    } catch (err) {
      setError('Failed to fetch necessary data. Please check your connection and try again.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        setLocation({ lat: latitude, lon: longitude });
        fetchAllData(latitude, longitude);
      },
      (geoError) => {
        console.warn('Geolocation failed, using default location (London).', geoError.message);
        const defaultLocation = { lat: 51.5074, lon: -0.1278 };
        setLocation(defaultLocation);
        fetchAllData(defaultLocation.lat, defaultLocation.lon);
        setError('Could not get your location. Showing times for London.');
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 600000 }
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fetchAllData]);

  if (loading && !prayerTimes) {
    return <Loader message="Setting up your spiritual companion..." />;
  }

  return (
    <div className="min-h-screen bg-base-100 font-sans p-4 sm:p-6 lg:p-8 relative">
      <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/arabesque.png')] opacity-5"></div>
      <div className="max-w-7xl mx-auto relative z-10">
        <Header prayerTimes={prayerTimes} error={error} />

        <main className="mt-8 grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-8">
            <PrayerTimesDashboard prayerTimes={prayerTimes} />
            <AsmaulHusnaGrid names={ASMA_UL_HUSNA} onNameClick={setSelectedName} />
          </div>
          <div className="space-y-8">
            <QiblaCompass userLocation={location} />
            <VerseOfTheDay verse={quranVerse} />
          </div>
        </main>
      </div>
      {selectedName && (
        <NameDetailModal
          name={selectedName}
          onClose={() => setSelectedName(null)}
        />
      )}
    </div>
  );
};

export default App;
