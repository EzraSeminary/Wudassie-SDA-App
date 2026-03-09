import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';
import api from './api';

export const LAST_SYNC_KEY = 'last_sync_timestamp';

export const syncService = {
  async checkForUpdates() {
    try {
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

      // Fetch all pages of data
      const fetchAllPages = async (endpoint: string) => {
        const firstResponse = await api.get(`/${endpoint}?page=1&limit=100`);
        const firstData = firstResponse.data;

        // Handle non-paginated responses (array of items)
        if (Array.isArray(firstData)) {
          return firstData;
        }

        // Handle paginated responses { songs, totalPages }
        const songs = Array.isArray(firstData?.songs) ? firstData.songs : [];
        const totalPages = typeof firstData?.totalPages === 'number' ? firstData.totalPages : 1;

        if (totalPages <= 1) {
          return songs;
        }

        let allData = [...songs];
        let currentPage = 2;

        while (currentPage <= totalPages) {
          const response = await api.get(`/${endpoint}?page=${currentPage}&limit=100`);
          const pageSongs = Array.isArray(response.data?.songs) ? response.data.songs : [];
          allData = [...allData, ...pageSongs];
          currentPage++;
        }

        return allData;
      };

      // Fetch latest data from backend API
      const [hymnalData, hagerignaData] = await Promise.all([
        fetchAllPages('sda'),
        fetchAllPages('hagerigna')
      ]);

      // Save to local storage
      await Promise.all([
        AsyncStorage.setItem('hymnal', JSON.stringify(hymnalData)),
        AsyncStorage.setItem('hagerigna', JSON.stringify(hagerignaData)),
        AsyncStorage.setItem(LAST_SYNC_KEY, currentTime.toString())
      ]);

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
      const data = await AsyncStorage.getItem(type);
      return data ? JSON.parse(data) : null;
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
