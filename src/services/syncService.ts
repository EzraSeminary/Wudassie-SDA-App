import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';
import { hymnalService } from './hymnalService';

export const LAST_SYNC_KEY = 'last_sync_timestamp';

export const syncService = {
  async checkForUpdates() {
    try {
      await hymnalService.seedBundledDataIfNeeded();

      const netInfo = await NetInfo.fetch();
      if (!netInfo.isConnected) {
        if (__DEV__) {
          console.log('No internet connection available');
        }
        return false;
      }

      const lastSync = await AsyncStorage.getItem(LAST_SYNC_KEY);
      const currentTime = new Date().getTime();

      // Check for updates every 24 hours
      if (lastSync && currentTime - parseInt(lastSync) < 24 * 60 * 60 * 1000) {
        if (__DEV__) {
          console.log('Skipping sync - last sync was less than 24 hours ago');
        }
        return false;
      }

      // Fetch latest data from backend API
      await Promise.all([
        hymnalService.getSDAHymnsFromApi(),
        hymnalService.getHagerignaHymnsFromApi()
      ]);
      await AsyncStorage.setItem(LAST_SYNC_KEY, currentTime.toString());

      if (__DEV__) {
        console.log('Successfully synced data from backend API');
      }
      return true;
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
  }
}; 
