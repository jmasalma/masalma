
import { QuranVerse } from '../types';

export async function getRandomVerse(): Promise<QuranVerse> {
  // Generate a random verse number (ayah) from 1 to 6236 (total ayahs in Quran)
  const randomAyahNumber = Math.floor(Math.random() * 6236) + 1;
  const url = `https://api.alquran.cloud/v1/ayah/${randomAyahNumber}/en.asad`;

  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Quran API request failed with status ${response.status}`);
    }
    const data = await response.json();
    if (data.code !== 200) {
      throw new Error(data.data || 'Failed to fetch Quran verse from API.');
    }
    return data.data as QuranVerse;
  } catch (error) {
    console.error("Error fetching Quran verse:", error);
    // Return a fallback verse on error
    return {
      text: "In the name of Allah, the Entirely Merciful, the Especially Merciful.",
      surah: {
        number: 1,
        name: "سُورَةُ ٱلْفَاتِحَةِ",
        englishName: "Al-Fatiha",
        englishNameTranslation: "The Opening"
      },
      numberInSurah: 1,
    };
  }
}
