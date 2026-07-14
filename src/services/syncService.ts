import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';
import { hymnalService } from './hymnalService';

export const LAST_SYNC_KEY = 'last_sync_timestamp';

const SYNC_INTERVAL_MS = 24 * 60 * 60 * 1000;

type SyncOptions = {
  respectSyncInterval?: boolean;
};

const hasChanged = <T>(previousItems: T[], nextItems: T[]): boolean => {
  return JSON.stringify(previousItems) !== JSON.stringify(nextItems);
};

export const syncService = {
  async checkForUpdates(options: SyncOptions = {}) {
    try {
      const { respectSyncInterval = true } = options;
      await hymnalService.seedBundledDataIfNeeded();

      const netInfo = await NetInfo.fetch();
      if (!netInfo.isConnected || netInfo.isInternetReachable === false) {
        if (__DEV__) {
          console.log('No internet connection available');
        }
        return false;
      }

      const lastSync = await AsyncStorage.getItem(LAST_SYNC_KEY);
      const currentTime = new Date().getTime();

      // Check for updates every 24 hours
      if (respectSyncInterval && lastSync && currentTime - parseInt(lastSync, 10) < SYNC_INTERVAL_MS) {
        if (__DEV__) {
          console.log('Skipping sync - last sync was less than 24 hours ago');
        }
        return false;
      }

      const [previousHagerigna, previousHymnal] = await Promise.all([
        hymnalService.getImmediateHagerignaHymns(),
        hymnalService.getImmediateSDAHymns(),
      ]);

      // Fetch latest data from backend API
      const [hymnalResult, hagerignaResult] = await Promise.allSettled([
        hymnalService.getSDAHymnsFromApi(),
        hymnalService.getHagerignaHymnsFromApi(),
      ]);

      if (hymnalResult.status === 'rejected' && hagerignaResult.status === 'rejected') {
        if (__DEV__) {
          console.error('Error syncing data:', hymnalResult.reason, hagerignaResult.reason);
        }
        return false;
      }

      await AsyncStorage.setItem(LAST_SYNC_KEY, currentTime.toString());

      const nextHymnal = hymnalResult.status === 'fulfilled'
        ? hymnalResult.value
        : previousHymnal;
      const nextHagerigna = hagerignaResult.status === 'fulfilled'
        ? hagerignaResult.value
        : previousHagerigna;
      const songsChanged =
        hasChanged(previousHymnal, nextHymnal) ||
        hasChanged(previousHagerigna, nextHagerigna);

      if (__DEV__) {
        console.log(songsChanged
          ? 'Successfully synced updated data from backend API'
          : 'Backend data matches cached songs');
      }
      return songsChanged;
    } catch (error) {
      if (__DEV__) {
        console.error('Error syncing data:', error);
      }
      return false;
    }
  },

  async getLocalData(type: 'hymnal' | 'hagerigna') {
    try {
      return type === 'hymnal'
        ? await hymnalService.getImmediateSDAHymns()
        : await hymnalService.getImmediateHagerignaHymns();
    } catch (error) {
      if (__DEV__) {
        console.error(`Error getting local ${type} data:`, error);
      }
      return null;
    }
  },

  async getLastSyncTimestamp() {
    try {
      const lastSync = await AsyncStorage.getItem(LAST_SYNC_KEY);
      return lastSync ? parseInt(lastSync, 10) : null;
    } catch (error) {
      if (__DEV__) {
        console.error('Error getting last sync timestamp:', error);
      }
      return null;
    }
  },
};
