import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, Switch, ScrollView, TouchableOpacity, ActivityIndicator, Alert, Platform } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import Slider from '@react-native-community/slider';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useSelector, useDispatch } from 'react-redux';
import { RootState, setFontSizeWithPersistence, toggleDarkModeWithPersistence, setGlassPaletteWithPersistence, AppDispatch } from '../../store';
import { Cog6ToothIcon, MusicalNoteIcon, BookOpenIcon, HeartIcon, ArrowPathIcon } from 'react-native-heroicons/outline';
import { hymnalService, type HagerignaHymn, type SDAHymn } from '../../services/hymnalService';
import { syncService } from '../../services/syncService';
import { notificationService } from '../../services/notificationService';
import tw from '../../../tailwind';
import { useBottomContentPadding } from '../../utils/platformUtils';
import { GlassBackground, GlassGradientBorder, glassPaletteOptions, glassSurface, useGlassTheme } from '../glass/GlassBackground';

const Settings = () => {
  const fontSize = useSelector((state: RootState) => state.fontSize.fontSize);
  const isDarkMode = useSelector((state: RootState) => state.theme.isDarkMode);
  const selectedPalette = useSelector((state: RootState) => state.theme.glassPalette);
  const glass = useGlassTheme();
  const dispatch = useDispatch<AppDispatch>();
  const insets = useSafeAreaInsets();
  const headerTopPadding = Platform.OS === 'android' ? Math.max(insets.top + 8, 18) : Math.max(insets.top + 8, 16);
  const [isUpdating, setIsUpdating] = useState(false);
  const [lastSyncTimestamp, setLastSyncTimestamp] = useState<number | null>(null);
  const [lastUpdatePreview, setLastUpdatePreview] = useState<UpdatePreview | null>(null);
  const [notificationTime, setNotificationTime] = useState<{ hour: number; minute: number; formatted: string } | null>(null);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [previewFontSize, setPreviewFontSize] = useState(fontSize);
  const contentBottomPadding = useBottomContentPadding(40);

  useEffect(() => {
    setPreviewFontSize(fontSize);
  }, [fontSize]);

  useEffect(() => {
    const loadMeta = async () => {
      const [lastSync, reminderTime] = await Promise.all([
        syncService.getLastSyncTimestamp(),
        notificationService.getStoredReminderTime(),
      ]);
      setLastSyncTimestamp(lastSync);
      setNotificationTime(reminderTime);
    };
    loadMeta();
  }, []);

  const handleToggleTheme = () => {
    dispatch(toggleDarkModeWithPersistence());
  };

  const handleUpdateSongs = async () => {
    try {
      setIsUpdating(true);
      setLastUpdatePreview(null);
      const [previousHagerigna, previousHymnal] = await Promise.all([
        hymnalService.getImmediateHagerignaHymns(),
        hymnalService.getImmediateSDAHymns(),
      ]);
      const updated = await hymnalService.forceUpdate();
      if (__DEV__) {
        console.log('[Update Now] fetched counts:', {
          hagerigna: updated.hagerigna.length,
          hymnal: updated.hymnal.length,
        });
        console.log('[Update Now] fetched JSON:', JSON.stringify(updated, null, 2));
      }
      setLastUpdatePreview({
        hagerigna: buildCollectionUpdatePreview(
          'Hagerigna',
          previousHagerigna,
          updated.hagerigna,
          getHagerignaPreviewTitle,
          getHagerignaComparableText,
        ),
        hymnal: buildCollectionUpdatePreview(
          'Hymnal',
          previousHymnal,
          updated.hymnal,
          getSdaPreviewTitle,
          getSdaComparableText,
        ),
      });
      const latest = await syncService.getLastSyncTimestamp();
      setLastSyncTimestamp(latest);
      Alert.alert('Success', 'Songs updated successfully!');
    } catch (error) {
      Alert.alert('Error', 'Failed to update songs. Please try again later.');
      console.error('Update error:', error);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleNotificationTimeChange = async (_: any, selectedDate?: Date) => {
    setShowTimePicker(false);
    if (!selectedDate) {
      return;
    }

    const hour = selectedDate.getHours();
    const minute = selectedDate.getMinutes();
    await notificationService.scheduleDailyReminder(hour, minute);
    setNotificationTime({
      hour,
      minute,
      formatted: `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`,
    });
  };

  const lastUpdatedLabel = useMemo(() => {
    if (!lastSyncTimestamp) {
      return 'Never updated';
    }
    const date = new Date(lastSyncTimestamp);
    return date.toLocaleString();
  }, [lastSyncTimestamp]);

  return (
    <GlassBackground>
      <SafeAreaView style={tw`flex-1`} edges={['left', 'right']}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          scrollEnabled={true}
          bounces={true}
          contentContainerStyle={[tw`pb-2` as any, { paddingBottom: contentBottomPadding }]}
        >
          <View style={tw`px-5`}>
            <View style={[tw`flex-row items-center mb-8 pb-5 border-b`, { paddingTop: headerTopPadding, borderColor: glass.border }]}>
              <Cog6ToothIcon size={40} color={glass.accent} />
              <Text style={[tw`text-3xl font-nokia-bold ml-4`, { color: glass.text }]}>
                Settings
              </Text>
            </View>

            {/* Font Size Section */}
            <View style={[
              tw`p-5 mb-6 rounded-3xl overflow-hidden`,
              glassSurface(glass, true),
            ]}>
              <GlassGradientBorder radius={24} />
              <Text style={[tw`text-xl font-nokia-bold mb-3`, { color: glass.accent }]}>Font Size</Text>
              <Text style={[tw`text-sm mb-4 opacity-70`, { color: glass.mutedText }]}>
                Adjust the font size for better readability
              </Text>
              <View style={tw`flex-row items-center mb-4`}>
                <Text style={[tw`text-base`, { color: glass.text }]}>Small</Text>
                <Slider
                  style={tw`flex-1 h-10 mx-4`}
                  minimumValue={12}
                  maximumValue={32}
                  step={1}
                  value={previewFontSize}
                  onValueChange={value => setPreviewFontSize(Math.round(value))}
                  onSlidingComplete={value => dispatch(setFontSizeWithPersistence(Math.round(value)))}
                  minimumTrackTintColor={glass.accent}
                  maximumTrackTintColor={glass.border}
                />
                <Text style={[tw`text-base`, { color: glass.text }]}>Large</Text>
              </View>
              <Text
                numberOfLines={1}
                adjustsFontSizeToFit
                minimumFontScale={0.72}
                style={[
                  tw`text-center font-nokia-bold mt-2`,
                  {
                    color: glass.text,
                    fontSize: previewFontSize,
                    lineHeight: Math.round(previewFontSize * 1.35),
                    paddingTop: 6,
                    paddingBottom: 10,
                    includeFontPadding: true,
                  },
                ]}
              >
                የሱስ ክርስቶስ የኔ ወዳጅ
              </Text>
            </View>

            {/* Theme Section */}
            <View style={[
              tw`p-5 mb-6 rounded-3xl overflow-hidden`,
              glassSurface(glass, true),
            ]}>
              <GlassGradientBorder radius={24} />
              <Text style={[tw`text-xl font-nokia-bold mb-3`, { color: glass.accent }]}>Appearance</Text>
              <View style={tw`flex-row justify-between items-center`}>
                <View style={tw`flex-1`}>
                  <Text style={[tw`text-base`, { color: glass.text }]}>Dark Mode</Text>
                  <Text style={[tw`text-sm opacity-70`, { color: glass.mutedText }]}>
                    Switch between light and dark themes
                  </Text>
                </View>
                <Switch
                  value={isDarkMode}
                  onValueChange={handleToggleTheme}
                  trackColor={{ false: '#CACACA', true: glass.accent }}
                  thumbColor={isDarkMode ? '#FDFDFD' : '#FDFDFD'}
                />
              </View>
              <View style={tw`mt-5`}>
                <Text style={[tw`text-base font-nokia-bold mb-3`, { color: glass.text }]}>Spiritual Palette</Text>
                <View style={tw`flex-row flex-wrap -mx-1`}>
                  {glassPaletteOptions.map((palette) => {
                    const active = selectedPalette === palette.id;
                    return (
                      <TouchableOpacity
                        key={palette.id}
                        onPress={() => dispatch(setGlassPaletteWithPersistence(palette.id))}
                        activeOpacity={0.82}
                        style={[
                          tw`px-3 py-3 m-1 rounded-2xl flex-row items-center`,
                          glassSurface(glass),
                          { flexBasis: '47%', minHeight: 48 },
                          active ? { backgroundColor: glass.accent } : null,
                        ]}
                      >
                        <View
                          style={[
                            tw`w-4 h-4 rounded-full mr-2`,
                            { backgroundColor: palette.accent, borderWidth: 1, borderColor: 'rgba(255,255,255,0.7)' },
                          ]}
                        />
                        <Text style={[tw`font-nokia-bold`, { color: active ? '#FFFFFF' : glass.text }]}>
                          {palette.name}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>
            </View>

            {/* Update Songs Section */}
            <View style={[
              tw`p-5 mb-6 rounded-3xl overflow-hidden`,
              glassSurface(glass, true),
            ]}>
              <GlassGradientBorder radius={24} />
              <Text style={[tw`text-xl font-nokia-bold mb-3`, { color: glass.accent }]}>Update Songs</Text>
              <Text style={[tw`text-sm mb-4 opacity-70`, { color: glass.mutedText }]}>
                Get the latest songs from the server
              </Text>
              <Text style={[tw`text-xs mb-4 opacity-70`, { color: glass.mutedText }]}>
                Last updated: {lastUpdatedLabel}
              </Text>
              <TouchableOpacity
                onPress={handleUpdateSongs}
                disabled={isUpdating}
                style={[
                  tw`flex-row items-center justify-center p-4 rounded-2xl overflow-hidden`,
                  glassSurface(glass),
                  { backgroundColor: isUpdating ? '#9CA3AF' : glass.accent },
                ]}
              >
                {isUpdating ? (
                  <ActivityIndicator color="white" size="small" />
                ) : (
                  <ArrowPathIcon size={20} color="white" />
                )}
                <Text style={tw`text-white font-nokia-bold ml-2`}>
                  {isUpdating ? 'Updating...' : 'Update Now'}
                </Text>
              </TouchableOpacity>
              {lastUpdatePreview ? (
                <View style={tw`mt-5`}>
                  {[lastUpdatePreview.hagerigna, lastUpdatePreview.hymnal].map((preview) => {
                    const hasVisibleChanges = preview.totalAdded > 0 || preview.totalChanged > 0;
                    return (
                      <View
                        key={preview.label}
                        style={[
                          tw`p-4 rounded-2xl mb-3`,
                          glassSurface(glass),
                        ]}
                      >
                        <View style={tw`flex-row items-center justify-between mb-2`}>
                          <Text style={[tw`font-nokia-bold text-base`, { color: glass.text }]}>
                            {preview.label}
                          </Text>
                          <Text style={[tw`text-xs font-nokia-bold`, { color: glass.accent }]}>
                            {preview.previousCount} {'->'} {preview.fetchedCount}
                          </Text>
                        </View>
                        {hasVisibleChanges ? (
                          <>
                            {preview.added.length > 0 ? (
                              <View style={tw`mb-2`}>
                                <Text style={[tw`text-xs font-nokia-bold mb-1`, { color: glass.accent }]}>
                                  Newly fetched ({preview.totalAdded})
                                </Text>
                                {preview.added.map((title, index) => (
                                  <Text
                                    key={`${preview.label}-added-${title}-${index}`}
                                    numberOfLines={1}
                                    style={[tw`text-sm mb-1`, { color: glass.text }]}
                                  >
                                    {index + 1}. {title}
                                  </Text>
                                ))}
                              </View>
                            ) : null}
                            {preview.changed.length > 0 ? (
                              <View>
                                <Text style={[tw`text-xs font-nokia-bold mb-1`, { color: glass.accent }]}>
                                  Updated from previous data ({preview.totalChanged})
                                </Text>
                                {preview.changed.map((title, index) => (
                                  <Text
                                    key={`${preview.label}-changed-${title}-${index}`}
                                    numberOfLines={1}
                                    style={[tw`text-sm mb-1`, { color: glass.text }]}
                                  >
                                    {index + 1}. {title}
                                  </Text>
                                ))}
                              </View>
                            ) : null}
                          </>
                        ) : (
                          <Text style={[tw`text-sm`, { color: glass.mutedText }]}>
                            Fetched data matches the songs already saved on this device.
                          </Text>
                        )}
                      </View>
                    );
                  })}
                </View>
              ) : null}
            </View>

            {/* Daily Reminder Section */}
            <View style={[
              tw`p-5 mb-6 rounded-3xl overflow-hidden`,
              glassSurface(glass, true),
            ]}>
              <GlassGradientBorder radius={24} />
              <Text style={[tw`text-xl font-nokia-bold mb-3`, { color: glass.accent }]}>Daily Reminder</Text>
              <Text style={[tw`text-sm mb-4 opacity-70`, { color: glass.mutedText }]}>
                Set a daily reminder to open today’s hymn.
              </Text>
              <View style={tw`flex-row items-center justify-between`}>
                <View>
                  <Text style={[tw`text-base`, { color: glass.text }]}>
                    Reminder time
                  </Text>
                  <Text style={[tw`text-sm opacity-70`, { color: glass.mutedText }]}>
                    {notificationTime?.formatted ?? '07:00'}
                  </Text>
                </View>
                <TouchableOpacity
                  onPress={() => setShowTimePicker(true)}
                  style={[tw`px-4 py-2 rounded-2xl`, glassSurface(glass), { backgroundColor: glass.accent }]}
                >
                  <Text style={tw`text-white font-nokia-bold`}>Change</Text>
                </TouchableOpacity>
              </View>
              {showTimePicker ? (
                <DateTimePicker
                  mode="time"
                  value={notificationTime
                    ? new Date(0, 0, 0, notificationTime.hour, notificationTime.minute)
                    : new Date(0, 0, 0, 7, 0)}
                  onChange={handleNotificationTimeChange}
                />
              ) : null}
            </View>

            {/* About Section */}
            <View style={[
              tw`p-5 mb-6 rounded-3xl overflow-hidden`,
              glassSurface(glass, true),
            ]}>
              <GlassGradientBorder radius={24} />
              <Text style={[tw`text-xl font-nokia-bold mb-4`, { color: glass.accent }]}>About</Text>
              <View style={tw`flex-row items-center mb-4`}>
                <BookOpenIcon size={20} color={glass.accent} />
                <Text style={[tw`ml-4 text-base`, { color: glass.text }]}>
                  Hymnal Songs Collection
                </Text>
              </View>
              <View style={tw`flex-row items-center mb-4`}>
                <MusicalNoteIcon size={20} color={glass.accent} />
                <Text style={[tw`ml-4 text-base`, { color: glass.text }]}>
                  Hagerigna Songs Collection
                </Text>
              </View>
              <View style={tw`flex-row items-center`}>
                <HeartIcon size={20} color={glass.accent} />
                <Text style={[tw`ml-4 text-base`, { color: glass.text }]}>
                  Made with love for worship
                </Text>
              </View>
            </View>

            {/* Version and Credits Section */}
            <View style={tw`items-center mb-6 mt-2`}>
              <Text style={[tw`text-sm opacity-60`, { color: glass.mutedText }]}>
                Version 1.1
              </Text>
              <Text style={[tw`text-sm opacity-60 mt-2`, { color: glass.mutedText }]}>
                Prepared by Yetnbit-Kal Ministry
              </Text>
              <Text style={[tw`text-sm opacity-60 mt-2`, { color: glass.mutedText }]}>
                Developed by Amen Devs
              </Text>
            </View>
          </View>
        </ScrollView>
      </SafeAreaView>
    </GlassBackground>
  );
};

export default Settings;

type CollectionUpdatePreview = {
  label: string;
  previousCount: number;
  fetchedCount: number;
  totalAdded: number;
  totalChanged: number;
  added: string[];
  changed: string[];
};

type UpdatePreview = {
  hagerigna: CollectionUpdatePreview;
  hymnal: CollectionUpdatePreview;
};

const UPDATE_PREVIEW_LIMIT = 8;

const normalizeComparableText = (value: string): string => value.trim().replace(/\s+/g, ' ');

const buildCollectionUpdatePreview = <T extends { id?: string }>(
  label: string,
  previousItems: T[],
  fetchedItems: T[],
  getTitle: (item: T, index: number) => string,
  getComparableText: (item: T) => string,
): CollectionUpdatePreview => {
  const previousById = new Map(previousItems.map((item) => [item.id, normalizeComparableText(getComparableText(item))]));
  const previousTitles = new Set(previousItems.map((item, index) => normalizeComparableText(getTitle(item, index)).toLowerCase()));
  const added: string[] = [];
  const changed: string[] = [];
  let totalAdded = 0;
  let totalChanged = 0;

  fetchedItems.forEach((item, index) => {
    const title = getTitle(item, index);
    const comparableText = normalizeComparableText(getComparableText(item));
    const previousText = item.id ? previousById.get(item.id) : undefined;

    if (item.id && previousText !== undefined) {
      if (previousText !== comparableText) {
        totalChanged += 1;
        if (changed.length < UPDATE_PREVIEW_LIMIT) {
          changed.push(title);
        }
      }
      return;
    }

    const normalizedTitle = normalizeComparableText(title).toLowerCase();
    if (!previousTitles.has(normalizedTitle)) {
      totalAdded += 1;
      if (added.length < UPDATE_PREVIEW_LIMIT) {
        added.push(title);
      }
    }
  });

  return {
    label,
    previousCount: previousItems.length,
    fetchedCount: fetchedItems.length,
    totalAdded,
    totalChanged,
    added,
    changed,
  };
};

const getHagerignaPreviewTitle = (song: HagerignaHymn, index: number): string => (
  song.title || song.artist || `Hagerigna song ${index + 1}`
);

const getHagerignaComparableText = (song: HagerignaHymn): string => [
  song.title,
  song.song,
  song.artist,
  song.album,
  song.albumTitle,
  song.albumName,
  song.audio,
  song.sheet_music?.join(','),
].filter(Boolean).join('|');

const getSdaPreviewTitle = (song: SDAHymn, index: number): string => (
  song.newHymnalTitle || song.title || song.oldHymnalTitle || `Hymnal song ${song.number ?? index + 1}`
);

const getSdaComparableText = (song: SDAHymn): string => [
  song.newHymnalTitle,
  song.title,
  song.oldHymnalTitle,
  song.englishTitleOld,
  song.newHymnalLyrics,
  song.lyrics,
  song.oldHymnalLyrics,
  song.audio,
  song.sheet_music?.join(','),
].filter(Boolean).join('|');
