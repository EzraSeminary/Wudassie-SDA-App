import { API_BASE_URL } from '../config/api';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface HagerignaHymn {
  id: string;
  title: string;
  song: string;
  artist?: string;
  sheet_music?: string[];
  audio?: string;
  category?: string;
}

export interface SDAHymn {
  id: string;
  title: string;
  lyrics: string;
  number: number;
  newHymnalTitle?: string;
  oldHymnalTitle?: string;
  newHymnalLyrics?: string;
  englishTitleOld?: string;
  oldHymnalLyrics?: string;
  sheet_music?: string[];
  audio?: string;
  category?: string;
}

export type HymnalType = 'hagerigna' | 'sda';

class HymnalService {
  private baseUrl = API_BASE_URL;
  private fetchOptions = {
    headers: {
      'Content-Type': 'application/json',
    }
  };

  async getHagerignaHymns(): Promise<HagerignaHymn[]> {
    try {
      const response = await fetch(`${this.baseUrl}/hagerigna`, this.fetchOptions);
      if (!response.ok) {
        throw new Error(`Failed to fetch Hagerigna hymns: ${response.status}`);
      }
      const data = await response.json();
      await AsyncStorage.setItem('hagerigna', JSON.stringify(data));
      console.log('Hagerigna hymns updated successfully');
      return data;
    } catch (error) {
      console.error('Error fetching Hagerigna hymns:', error);
      // Try to get cached data if fetch fails
      const cachedData = await AsyncStorage.getItem('hagerigna');
      if (cachedData) {
        console.log('Using cached Hagerigna data');
        return JSON.parse(cachedData);
      }
      throw error;
    }
  }

  async getSDAHymns(): Promise<SDAHymn[]> {
    try {
      const response = await fetch(`${this.baseUrl}/sda`, this.fetchOptions);
      if (!response.ok) {
        throw new Error(`Failed to fetch SDA hymns: ${response.status}`);
      }
      const data = await response.json();
      await AsyncStorage.setItem('hymnal', JSON.stringify(data));
      console.log('SDA hymns updated successfully');
      return data;
    } catch (error) {
      console.error('Error fetching SDA hymns:', error);
      // Try to get cached data if fetch fails
      const cachedData = await AsyncStorage.getItem('hymnal');
      if (cachedData) {
        console.log('Using cached SDA data');
        return JSON.parse(cachedData);
      }
      throw error;
    }
  }

  async searchHymns(query: string, type: HymnalType): Promise<HagerignaHymn[] | SDAHymn[]> {
    try {
      const response = await fetch(`${this.baseUrl}/${type}/search?q=${encodeURIComponent(query)}`);
      if (!response.ok) {
        throw new Error(`Failed to search ${type} hymns`);
      }
      return await response.json();
    } catch (error) {
      console.error(`Error searching ${type} hymns:`, error);
      throw error;
    }
  }

  async forceUpdate(): Promise<{ hagerigna: HagerignaHymn[], hymnal: SDAHymn[] }> {
    try {
      console.log('Starting force update...');
      const [hagerignaData, hymnalData] = await Promise.all([
        this.getHagerignaHymns(),
        this.getSDAHymns()
      ]);

      return {
        hagerigna: hagerignaData,
        hymnal: hymnalData
      };
    } catch (error) {
      console.error('Error forcing update:', error);
      throw error;
    }
  }

  async getLocalHagerignaHymns(): Promise<HagerignaHymn[] | null> {
    try {
      const cachedData = await AsyncStorage.getItem('hagerigna');
      if (cachedData) {
        return JSON.parse(cachedData);
      }
      return null;
    } catch (error) {
      console.error('Error getting local Hagerigna hymns:', error);
      return null;
    }
  }
}

export const hymnalService = new HymnalService(); 