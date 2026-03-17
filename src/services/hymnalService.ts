import AsyncStorage from '@react-native-async-storage/async-storage';
import api from './api';
import { LAST_SYNC_KEY } from './syncService';
import localHagerignaHymns from '../components/Hagerigna/HagerignaData.json';
import localSdaHymns from '../components/SDA_Hymnal.json';

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

const HAGERIGNA_STORAGE_KEY = 'hagerigna';
const SDA_STORAGE_KEY = 'hymnal';

const getSdaIdOrder = (id?: string): number => {
  const match = String(id || '').match(/^sda-(\d+)$/);
  return match ? Number(match[1]) : Number.MAX_SAFE_INTEGER;
};

const normalizeSDAHymns = (items: SDAHymn[]): SDAHymn[] => {
  return items
    .map((item, originalIndex) => ({
      ...item,
      originalIndex,
      idOrder: getSdaIdOrder(item.id),
    }))
    .sort((a, b) => {
      if (a.idOrder === b.idOrder) {
        return a.originalIndex - b.originalIndex;
      }
      return a.idOrder - b.idOrder;
    })
    .map(({ originalIndex, idOrder, ...item }, index) => {
      const resolvedNumber = Number.isFinite(idOrder) && idOrder !== Number.MAX_SAFE_INTEGER
        ? idOrder + 1
        : (item.number ?? index + 1);

      return {
        ...item,
        id: `hymnal-${resolvedNumber}`,
        number: resolvedNumber,
      };
    });
};

const normalizeHagerignaHymns = (items: HagerignaHymn[]): HagerignaHymn[] => {
  return items.map((item, index) => ({
    ...item,
    id: `hagerigna-${index + 1}`,
  }));
};

const parseBundledSDAHymns = (): SDAHymn[] => {
  try {
    const titles = localSdaHymns.resources.array[0].item;
    const lyrics = localSdaHymns.resources.array[2].item;
    const englishTitles = localSdaHymns.resources.array[3].item;

    return titles.map((title: string, index: number) => ({
      id: `hymnal-${index + 1}`,
      title,
      lyrics: lyrics[index] ?? '',
      number: index + 1,
      newHymnalTitle: title,
      newHymnalLyrics: lyrics[index] ?? '',
      englishTitleOld: englishTitles[index] ?? '',
    }));
  } catch (error) {
    if (__DEV__) {
      console.error('Error parsing bundled SDA hymns:', error);
    }
    return [];
  }
};

const parseBundledHagerignaHymns = (): HagerignaHymn[] => {
  try {
    const artists = localHagerignaHymns.resources.array[0].item;
    const songs = localHagerignaHymns.resources.array[1].item;
    const titles = localHagerignaHymns.resources.array[2].item;

    return titles.map((title: string, index: number) => ({
      id: `hagerigna-${index + 1}`,
      title,
      song: songs[index] ?? '',
      artist: artists[index] ?? '',
    }));
  } catch (error) {
    if (__DEV__) {
      console.error('Error parsing bundled Hagerigna hymns:', error);
    }
    return [];
  }
};

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
  getBundledHagerignaHymns(): HagerignaHymn[] {
    return parseBundledHagerignaHymns();
  }

  getBundledSDAHymns(): SDAHymn[] {
    return parseBundledSDAHymns();
  }

  async getHagerignaHymnsFromApi(): Promise<HagerignaHymn[]> {
    const response = await api.get('/hagerigna');
    const data = normalizeHagerignaHymns(getOrderedArray<HagerignaHymn>(response.data));
    await AsyncStorage.setItem(HAGERIGNA_STORAGE_KEY, JSON.stringify(data));
    return data;
  }

  async getSDAHymnsFromApi(): Promise<SDAHymn[]> {
    const response = await api.get('/sda');
    const data = normalizeSDAHymns(getOrderedArray<SDAHymn>(response.data));
    await AsyncStorage.setItem(SDA_STORAGE_KEY, JSON.stringify(data));
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
      return this.getImmediateHagerignaHymns();
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
      return this.getImmediateSDAHymns();
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
      const cachedData = await AsyncStorage.getItem(HAGERIGNA_STORAGE_KEY);
      if (cachedData) {
        return normalizeHagerignaHymns(JSON.parse(cachedData));
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
      const cachedData = await AsyncStorage.getItem(SDA_STORAGE_KEY);
      if (cachedData) {
        return normalizeSDAHymns(JSON.parse(cachedData));
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
    const local = await this.getImmediateSDAHymns();
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

  async getImmediateHagerignaHymns(): Promise<HagerignaHymn[]> {
    const cachedData = await this.getLocalHagerignaHymns();
    if (cachedData && cachedData.length > 0) {
      return cachedData;
    }

    const bundledData = this.getBundledHagerignaHymns();
    if (bundledData.length > 0) {
      await AsyncStorage.setItem(HAGERIGNA_STORAGE_KEY, JSON.stringify(bundledData));
    }
    return bundledData;
  }

  async getImmediateSDAHymns(): Promise<SDAHymn[]> {
    const cachedData = await this.getLocalSDAHymns();
    if (cachedData && cachedData.length > 0) {
      return cachedData;
    }

    const bundledData = this.getBundledSDAHymns();
    if (bundledData.length > 0) {
      await AsyncStorage.setItem(SDA_STORAGE_KEY, JSON.stringify(bundledData));
    }
    return bundledData;
  }

  async seedBundledDataIfNeeded(): Promise<void> {
    const [cachedSDA, cachedHagerigna] = await Promise.all([
      AsyncStorage.getItem(SDA_STORAGE_KEY),
      AsyncStorage.getItem(HAGERIGNA_STORAGE_KEY),
    ]);

    const writes: Array<Promise<void>> = [];

    if (!cachedSDA) {
      const bundledSDA = this.getBundledSDAHymns();
      if (bundledSDA.length > 0) {
        writes.push(AsyncStorage.setItem(SDA_STORAGE_KEY, JSON.stringify(bundledSDA)));
      }
    }

    if (!cachedHagerigna) {
      const bundledHagerigna = this.getBundledHagerignaHymns();
      if (bundledHagerigna.length > 0) {
        writes.push(AsyncStorage.setItem(HAGERIGNA_STORAGE_KEY, JSON.stringify(bundledHagerigna)));
      }
    }

    await Promise.all(writes);
  }
}

export const hymnalService = new HymnalService(); 
