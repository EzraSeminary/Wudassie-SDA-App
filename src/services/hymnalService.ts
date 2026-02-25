import AsyncStorage from '@react-native-async-storage/async-storage';
import api from './api';
import { LAST_SYNC_KEY } from './syncService';

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

/** Extract array from API response without changing order (MongoDB order preserved). */
function getOrderedArray<T>(payload: unknown): T[] {
  if (Array.isArray(payload)) {
    return payload;
  }
  if (payload && typeof payload === 'object') {
    const obj = payload as Record<string, unknown>;
    const arr = obj.data ?? obj.items ?? obj.results ?? obj.hymns;
    if (Array.isArray(arr)) {
      return arr;
    }
  }
  return [];
}

class HymnalService {
  async getHagerignaHymnsFromApi(): Promise<HagerignaHymn[]> {
    const response = await api.get('/hagerigna');
    const data = getOrderedArray<HagerignaHymn>(response.data);
    await AsyncStorage.setItem('hagerigna', JSON.stringify(data));
    return data;
  }

  async getSDAHymnsFromApi(): Promise<SDAHymn[]> {
    const response = await api.get('/sda');
    const data = getOrderedArray<SDAHymn>(response.data);
    await AsyncStorage.setItem('hymnal', JSON.stringify(data));
    return data;
  }

  async getHagerignaHymns(): Promise<HagerignaHymn[]> {
    try {
      const data = await this.getHagerignaHymnsFromApi();
      if (__DEV__) {
        console.log('Hagerigna hymns updated successfully');
      }
      return data;
    } catch (error) {
      if (__DEV__) {
        console.error('Error fetching Hagerigna hymns:', error);
      }
      const cachedData = await AsyncStorage.getItem('hagerigna');
      if (cachedData) {
        if (__DEV__) {
          console.log('Using cached Hagerigna data');
        }
        return JSON.parse(cachedData);
      }
      throw error;
    }
  }

  async getSDAHymns(): Promise<SDAHymn[]> {
    try {
      const data = await this.getSDAHymnsFromApi();
      if (__DEV__) {
        console.log('SDA hymns updated successfully');
      }
      return data;
    } catch (error) {
      if (__DEV__) {
        console.error('Error fetching SDA hymns:', error);
      }
      const cachedData = await AsyncStorage.getItem('hymnal');
      if (cachedData) {
        if (__DEV__) {
          console.log('Using cached SDA data');
        }
        return JSON.parse(cachedData);
      }
      throw error;
    }
  }

  async searchHymns(query: string, type: HymnalType): Promise<HagerignaHymn[] | SDAHymn[]> {
    try {
      const response = await api.get(`/${type}/search?q=${encodeURIComponent(query)}`);
      return response.data;
    } catch (error) {
      if (__DEV__) {
        console.error(`Error searching ${type} hymns:`, error);
      }
      throw error;
    }
  }

  async forceUpdate(): Promise<{ hagerigna: HagerignaHymn[], hymnal: SDAHymn[] }> {
    try {
      if (__DEV__) {
        console.log('Starting force update...');
      }
      const [hagerignaData, hymnalData] = await Promise.all([
        this.getHagerignaHymns(),
        this.getSDAHymns()
      ]);

      await AsyncStorage.setItem(LAST_SYNC_KEY, Date.now().toString());

      return {
        hagerigna: hagerignaData,
        hymnal: hymnalData
      };
    } catch (error) {
      if (__DEV__) {
        console.error('Error forcing update:', error);
      }
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
      if (__DEV__) {
        console.error('Error getting local Hagerigna hymns:', error);
      }
      return null;
    }
  }

  async getLocalSDAHymns(): Promise<SDAHymn[] | null> {
    try {
      const cachedData = await AsyncStorage.getItem('hymnal');
      if (cachedData) {
        return JSON.parse(cachedData);
      }
      return null;
    } catch (error) {
      if (__DEV__) {
        console.error('Error getting local SDA hymns:', error);
      }
      return null;
    }
  }

  async getSDAHymnByTitle(title: string): Promise<SDAHymn | null> {
    const local = await this.getLocalSDAHymns();
    if (local && local.length > 0) {
      const foundLocal = local.find(
        (song) => song.newHymnalTitle === title || song.title === title || song.oldHymnalTitle === title
      );
      if (foundLocal) return foundLocal;
    }

    const remote = await this.getSDAHymns();
    const foundRemote = remote.find(
      (song) => song.newHymnalTitle === title || song.title === title || song.oldHymnalTitle === title
    );
    return foundRemote ?? null;
  }
}

export const hymnalService = new HymnalService(); 
