import AsyncStorage from '@react-native-async-storage/async-storage';
import notifee, {
  AndroidImportance,
  TimestampTrigger,
  TriggerType,
} from '@notifee/react-native';
import { hymnalService, HagerignaHymn, SDAHymn } from './hymnalService';
import { navigate, isNavigationReady } from '../navigation/navigationRef';
import localHagerignaHymns from '../components/Hagerigna/HagerignaData.json';
import localSdaHymns from '../components/SDA_Hymnal.json';

const REMINDER_TIME_KEY = 'daily_reminder_time';
const DAILY_REMINDER_ID = 'daily-hymn-reminder';
const PENDING_NAV_KEY = 'pending_notification_nav';
const DEFAULT_TIME = { hour: 7, minute: 0 };

const formatTime = (hour: number, minute: number) => {
  const h = hour.toString().padStart(2, '0');
  const m = minute.toString().padStart(2, '0');
  return `${h}:${m}`;
};

const parseTime = (time: string | null) => {
  if (!time) return DEFAULT_TIME;
  const [hour, minute] = time.split(':').map((value) => parseInt(value, 10));
  if (Number.isNaN(hour) || Number.isNaN(minute)) {
    return DEFAULT_TIME;
  }
  return { hour, minute };
};

const ensureChannel = async () => {
  await notifee.createChannel({
    id: 'daily-reminders',
    name: 'Daily Reminders',
    importance: AndroidImportance.DEFAULT,
  });
};

type SongNotificationPayload = {
  type: 'sda' | 'hagerigna';
  title: string;
  number: number;
};

const mapLocalSdaSongs = (): SDAHymn[] => {
  try {
    const titles = localSdaHymns.resources.array[0].item;
    const englishTitles = localSdaHymns.resources.array[3].item;
    const lyrics = localSdaHymns.resources.array[2].item;
    return titles.map((title: string, index: number) => ({
      id: `hymnal-${index + 1}`,
      title,
      lyrics: lyrics[index] ?? '',
      number: index + 1,
      englishTitleOld: englishTitles[index] ?? '',
    }));
  } catch {
    return [];
  }
};

const mapLocalHagerignaSongs = (): HagerignaHymn[] => {
  try {
    const titles = localHagerignaHymns.resources.array[2].item;
    const artists = localHagerignaHymns.resources.array[0].item;
    const songs = localHagerignaHymns.resources.array[1].item;
    return titles.map((title: string, index: number) => ({
      id: `hagerigna-${index + 1}`,
      title,
      song: songs[index] ?? '',
      artist: artists[index] ?? '',
    }));
  } catch {
    return [];
  }
};

const pickRandomSong = async (): Promise<SongNotificationPayload> => {
  const [cachedSda, cachedHagerigna] = await Promise.all([
    hymnalService.getLocalSDAHymns(),
    hymnalService.getLocalHagerignaHymns(),
  ]);

  const sdaSongs = (cachedSda && cachedSda.length > 0) ? cachedSda : mapLocalSdaSongs();
  const hagerignaSongs = (cachedHagerigna && cachedHagerigna.length > 0) ? cachedHagerigna : mapLocalHagerignaSongs();

  const combined: SongNotificationPayload[] = [];

  sdaSongs.forEach((song, index) => {
    const number = song.number ?? index + 1;
    const title = song.newHymnalTitle || song.title || song.oldHymnalTitle || `Song ${number}`;
    combined.push({ type: 'sda', title, number });
  });

  hagerignaSongs.forEach((song, index) => {
    const number = index + 1;
    combined.push({ type: 'hagerigna', title: song.title, number });
  });

  if (combined.length === 0) {
    return { type: 'sda', title: 'Hymn', number: 1 };
  }

  const randomIndex = Math.floor(Math.random() * combined.length);
  return combined[randomIndex];
};

const getNextTriggerDate = (hour: number, minute: number) => {
  const now = new Date();
  const next = new Date();
  next.setHours(hour, minute, 0, 0);
  if (next.getTime() <= now.getTime()) {
    next.setDate(next.getDate() + 1);
  }
  return next;
};

export const notificationService = {
  async getStoredReminderTime() {
    const stored = await AsyncStorage.getItem(REMINDER_TIME_KEY);
    const resolved = parseTime(stored);
    return { ...resolved, formatted: formatTime(resolved.hour, resolved.minute) };
  },

  async scheduleDailyReminder(hour: number, minute: number) {
    await AsyncStorage.setItem(REMINDER_TIME_KEY, formatTime(hour, minute));
    await notifee.requestPermission();
    await ensureChannel();
    await notifee.cancelTriggerNotifications([DAILY_REMINDER_ID]);

    const song = await pickRandomSong();
    const triggerDate = getNextTriggerDate(hour, minute);
    const trigger: TimestampTrigger = {
      type: TriggerType.TIMESTAMP,
      timestamp: triggerDate.getTime(),
    };

    await notifee.createTriggerNotification(
      {
        id: DAILY_REMINDER_ID,
        title: `Song of the Day: ${song.title}`,
        body: 'Tap to open the song.',
        data: song,
        android: {
          channelId: 'daily-reminders',
          pressAction: { id: 'default' },
        },
      },
      trigger
    );
  },

  async ensureDailyReminder() {
    const stored = await this.getStoredReminderTime();
    await this.scheduleDailyReminder(stored.hour, stored.minute);
  },

  async scheduleNextDailyReminder() {
    const stored = await this.getStoredReminderTime();
    await this.scheduleDailyReminder(stored.hour, stored.minute);
  },

  async handleNotificationPress(data?: Record<string, any> | null) {
    if (!data) return;
    const type = data.type as 'sda' | 'hagerigna' | undefined;
    const number = typeof data.number === 'number' ? data.number : parseInt(data.number, 10);
    if (!type || Number.isNaN(number)) return;

    if (type === 'sda') {
      const cached = await hymnalService.getLocalSDAHymns();
      const local = cached && cached.length > 0 ? cached : mapLocalSdaSongs();
      const song = local[number - 1];
      if (!song) return;
      const title = song.newHymnalTitle || song.title || song.oldHymnalTitle || `Song ${number}`;
      const lyrics = song.newHymnalLyrics || song.lyrics || song.oldHymnalLyrics || '';
      const englishTitle = song.englishTitleOld || '';
      const payload = { screen: 'SongDetail', params: { song: { title, lyrics, englishTitle }, songNumber: number } };
      if (!isNavigationReady()) {
        await AsyncStorage.setItem(PENDING_NAV_KEY, JSON.stringify(payload));
        return;
      }
      navigate('SongDetail', payload.params);
      return;
    }

    const cachedHagerigna = await hymnalService.getLocalHagerignaHymns();
    const localHagerigna = cachedHagerigna && cachedHagerigna.length > 0 ? cachedHagerigna : mapLocalHagerignaSongs();
    const song = localHagerigna[number - 1];
    if (!song) return;
    const payload = { screen: 'HagerignaDetail', params: { song, songNumber: number } };
    if (!isNavigationReady()) {
      await AsyncStorage.setItem(PENDING_NAV_KEY, JSON.stringify(payload));
      return;
    }
    navigate('HagerignaDetail', payload.params);
  },

  async consumePendingNavigation() {
    const pending = await AsyncStorage.getItem(PENDING_NAV_KEY);
    if (!pending) return;
    await AsyncStorage.removeItem(PENDING_NAV_KEY);
    try {
      const parsed = JSON.parse(pending) as { screen: string; params?: Record<string, unknown> };
      if (parsed?.screen) {
        navigate(parsed.screen, parsed.params);
      }
    } catch {
      // Ignore malformed payload.
    }
  },
};
