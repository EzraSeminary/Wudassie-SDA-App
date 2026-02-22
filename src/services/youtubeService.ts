import AsyncStorage from '@react-native-async-storage/async-storage';
import api from './api';

export interface YouTubeLink {
  id: string;
  url: string;
  videoId?: string;
  title: string;
  channelTitle?: string;
  duration?: string;
  thumbnailUrl?: string;
  description?: string;
  createdAt?: string;
}

const YOUTUBE_CACHE_KEY = 'youtube_links';

const extractVideoId = (url?: string): string | undefined => {
  if (!url) return undefined;

  // Handles: youtu.be/VIDEOID, youtube.com/watch?v=VIDEOID, youtube.com/embed/VIDEOID
  const match = url.match(
    /(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/
  );
  return match?.[1];
};

const normalizeLinks = (data: unknown): YouTubeLink[] => {
  if (!Array.isArray(data)) return [];

  return data
    .map((item) => {
      const link = item as YouTubeLink;
      const videoId = link.videoId || extractVideoId(link.url);
      return {
        ...link,
        videoId,
      };
    })
    .filter((link) => Boolean(link.videoId));
};

export const youtubeService = {
  async getCachedLinks(): Promise<YouTubeLink[] | null> {
    try {
      const cached = await AsyncStorage.getItem(YOUTUBE_CACHE_KEY);
      return cached ? JSON.parse(cached) : null;
    } catch (error) {
      if (__DEV__) {
        console.error('Error getting cached YouTube links:', error);
      }
      return null;
    }
  },

  async getLinks(): Promise<YouTubeLink[]> {
    try {
      const response = await api.get('/youtube-links');
      const links = normalizeLinks(response.data);
      await AsyncStorage.setItem(YOUTUBE_CACHE_KEY, JSON.stringify(links));
      return links;
    } catch (error) {
      if (__DEV__) {
        console.error('Error fetching YouTube links:', error);
      }
      const cached = await this.getCachedLinks();
      return cached ?? [];
    }
  },
};
