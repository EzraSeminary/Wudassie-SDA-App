import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';
import api from './api';

const LAST_SYNC_KEY = 'last_sync_timestamp';

export const syncService = {
  async checkForUpdates() {
    try {
      const netInfo = await NetInfo.fetch();
      if (!netInfo.isConnected) {
        console.log('No internet connection available');
        return false;
      }

      const lastSync = await AsyncStorage.getItem(LAST_SYNC_KEY);
      const currentTime = new Date().getTime();

      // Check for updates every 24 hours
      if (lastSync && currentTime - parseInt(lastSync) < 24 * 60 * 60 * 1000) {
        console.log('Skipping sync - last sync was less than 24 hours ago');
        return false;
      }

      // Fetch all pages of data
      const fetchAllPages = async (endpoint: string) => {
        let allData = [];
        let currentPage = 1;
        let hasMore = true;

        while (hasMore) {
          const response = await api.get(`/${endpoint}?page=${currentPage}&limit=100`);
          const { songs, totalPages } = response.data;
          
          allData = [...allData, ...songs];
          hasMore = currentPage < totalPages;
          currentPage++;
        }

        return allData;
      };

      // Fetch latest data from backend API
      const [hymnalData, hagerignaData] = await Promise.all([
        fetchAllPages('hymnal'),
        fetchAllPages('hagerigna')
      ]);

      // Save to local storage
      await Promise.all([
        AsyncStorage.setItem('hymnal', JSON.stringify(hymnalData)),
        AsyncStorage.setItem('hagerigna', JSON.stringify(hagerignaData)),
        AsyncStorage.setItem(LAST_SYNC_KEY, currentTime.toString())
      ]);

      console.log('Successfully synced data from backend API');
      return true;
    } catch (error) {
      console.error('Error syncing data:', error);
      return false;
    }
  },

  async getLocalData(type: 'hymnal' | 'hagerigna') {
    try {
      const data = await AsyncStorage.getItem(type);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      console.error(`Error getting local ${type} data:`, error);
      return null;
    }
  }
}; 