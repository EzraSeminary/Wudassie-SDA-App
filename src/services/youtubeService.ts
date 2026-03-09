import AsyncStorage from '@react-native-async-storage/async-storage';
import api from './api';
import type { AxiosError } from 'axios';

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
const YOUTUBE_DAILY_PICK_KEY = 'youtube_daily_pick';
const YOUTUBE_REQUEST_TIMEOUT_MS = 30000;
const YOUTUBE_MAX_RETRIES = 2;

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const isRetryableYouTubeError = (error: unknown): boolean => {
  const axiosError = error as AxiosError;
  if (!axiosError) return false;

  const status = axiosError.response?.status;
  const code = axiosError.code;

  // Retry network hiccups and temporary server failures.
  return (
    code === 'ECONNABORTED' ||
    code === 'ERR_NETWORK' ||
    !status ||
    status >= 500
  );
};

const extractVideoId = (url?: string): string | undefined => {
  if (!url) return undefined;

  // Handles: youtu.be/VIDEOID, youtube.com/watch?v=VIDEOID, youtube.com/embed/VIDEOID
  const match = url.match(
    /(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/
  );
  return match?.[1];
};

const getArrayPayload = (payload: unknown): unknown[] => {
  if (Array.isArray(payload)) return payload;
  if (!payload || typeof payload !== 'object') return [];

  const container = payload as Record<string, unknown>;
  const candidates = [
    container.data,
    container.results,
    container.items,
    container.links,
    container.youtubeLinks,
  ];

  for (const candidate of candidates) {
    if (Array.isArray(candidate)) {
      return candidate;
    }
  }

  // Handle nested envelopes like { data: { items: [...] } }.
  if (container.data && typeof container.data === 'object') {
    return getArrayPayload(container.data);
  }

  return [];
};

const toYouTubeLink = (item: unknown): YouTubeLink | null => {
  if (!item || typeof item !== 'object') return null;

  const raw = item as Record<string, unknown>;
  const url =
    (typeof raw.url === 'string' && raw.url) ||
    (typeof raw.link === 'string' && raw.link) ||
    (typeof raw.youtubeUrl === 'string' && raw.youtubeUrl) ||
    (typeof raw.videoUrl === 'string' && raw.videoUrl) ||
    (typeof raw.video_link === 'string' && raw.video_link) ||
    '';

  const videoId =
    (typeof raw.videoId === 'string' && raw.videoId) ||
    (typeof raw.video_id === 'string' && raw.video_id) ||
    extractVideoId(url);

  if (!videoId) return null;

  const idValue =
    (typeof raw.id === 'string' && raw.id) ||
    (typeof raw._id === 'string' && raw._id) ||
    videoId;

  return {
    id: String(idValue),
    url,
    videoId,
    title:
      (typeof raw.title === 'string' && raw.title) ||
      (typeof raw.name === 'string' && raw.name) ||
      'YouTube Video',
    channelTitle:
      (typeof raw.channelTitle === 'string' && raw.channelTitle) ||
      (typeof raw.channel === 'string' && raw.channel) ||
      undefined,
    duration: typeof raw.duration === 'string' ? raw.duration : undefined,
    thumbnailUrl:
      (typeof raw.thumbnailUrl === 'string' && raw.thumbnailUrl) ||
      (typeof raw.thumbnail === 'string' && raw.thumbnail) ||
      undefined,
    description: typeof raw.description === 'string' ? raw.description : undefined,
    createdAt: typeof raw.createdAt === 'string' ? raw.createdAt : undefined,
  };
};

const normalizeLinks = (data: unknown): YouTubeLink[] => {
  const items = getArrayPayload(data);
  if (!items.length) return [];

  return items
    .map((item) => {
      return toYouTubeLink(item);
    })
    .filter((link): link is YouTubeLink => Boolean(link?.videoId));
};

const getDedupeKey = (link: YouTubeLink): string => {
  if (link.id) return `id:${link.id}`;
  if (link.videoId) return `video:${link.videoId}`;
  return `url:${link.url}`;
};

const mergeLinks = (cached: YouTubeLink[], fetched: YouTubeLink[]): YouTubeLink[] => {
  const merged = new Map<string, YouTubeLink>();

  // Keep cached as baseline.
  for (const link of cached) {
    merged.set(getDedupeKey(link), link);
  }

  // Prefer freshest backend values for overlapping records.
  for (const link of fetched) {
    merged.set(getDedupeKey(link), link);
  }

  return Array.from(merged.values()).sort((a, b) => {
    const aTime = a.createdAt ? new Date(a.createdAt).getTime() : 0;
    const bTime = b.createdAt ? new Date(b.createdAt).getTime() : 0;
    return bTime - aTime;
  });
};

const getLocalDayKey = () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
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
      let lastError: unknown = null;
      let responseData: unknown = [];

      for (let attempt = 0; attempt <= YOUTUBE_MAX_RETRIES; attempt += 1) {
        try {
          const response = await api.get('/youtube-links', {
            timeout: YOUTUBE_REQUEST_TIMEOUT_MS,
          });
          responseData = response.data;
          lastError = null;
          break;
        } catch (error) {
          lastError = error;
          if (!isRetryableYouTubeError(error) || attempt === YOUTUBE_MAX_RETRIES) {
            break;
          }

          // Small backoff helps with transient timeout/cold-start failures.
          await sleep(1200 * (attempt + 1));
        }
      }

      if (lastError) {
        throw lastError;
      }

      const fetchedLinks = normalizeLinks(responseData);
      const cachedLinks = (await this.getCachedLinks()) ?? [];

      // Merge instead of replacing so newly added backend videos are appended
      // while preserving previously cached playable entries.
      const mergedLinks = mergeLinks(cachedLinks, fetchedLinks);
      const linksToPersist = mergedLinks.length > 0 ? mergedLinks : cachedLinks;

      if (linksToPersist.length > 0) {
        await AsyncStorage.setItem(YOUTUBE_CACHE_KEY, JSON.stringify(linksToPersist));
      }

      return linksToPersist;
    } catch (error) {
      if (__DEV__) {
        console.error('Error fetching YouTube links:', error);
      }
      const cached = await this.getCachedLinks();
      return cached ?? [];
    }
  },

  async getDailyRandomLink(links: YouTubeLink[]): Promise<YouTubeLink | null> {
    if (links.length === 0) return null;

    const today = getLocalDayKey();

    try {
      const raw = await AsyncStorage.getItem(YOUTUBE_DAILY_PICK_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as { date?: string; id?: string };
        if (parsed?.date === today && parsed?.id) {
          const existing = links.find((link) => link.id === parsed.id);
          if (existing) return existing;
        }
      }
    } catch {
      // Ignore corrupt daily-pick cache and re-generate.
    }

    const randomIndex = Math.floor(Math.random() * links.length);
    const picked = links[randomIndex];

    try {
      await AsyncStorage.setItem(
        YOUTUBE_DAILY_PICK_KEY,
        JSON.stringify({ date: today, id: picked.id })
      );
    } catch {
      // Non-fatal cache write failure.
    }

    return picked;
  },
};
