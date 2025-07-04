
import { PrayerTimesData } from '../types';

export async function getPrayerTimes(latitude: number, longitude: number): Promise<PrayerTimesData> {
  const date = new Date();
  const dateStr = `${date.getDate()}-${date.getMonth() + 1}-${date.getFullYear()}`;
  const url = `https://api.aladhan.com/v1/timings/${dateStr}?latitude=${latitude}&longitude=${longitude}&method=2`;

  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Prayer Times API request failed with status ${response.status}`);
    }
    const data = await response.json();
    if (data.code !== 200) {
      throw new Error(data.data || 'Failed to fetch prayer times from API.');
    }
    return data.data as PrayerTimesData;
  } catch (error) {
    console.error("Error fetching prayer times:", error);
    throw error;
  }
}
