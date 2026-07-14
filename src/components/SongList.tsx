import React, {useEffect, useMemo, useState} from 'react';
import {FlatList, Text, View, TextInput, TouchableWithoutFeedback, TouchableOpacity, Platform} from 'react-native';
import {useFocusEffect, useNavigation} from '@react-navigation/native';
import {NativeStackNavigationProp} from '@react-navigation/native-stack';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import {useSelector, useDispatch} from 'react-redux';
import {RootState, AppDispatch} from '../store';
import {RootStackParamList} from '../../App';
import { BookOpenIcon, MagnifyingGlassIcon as OutlineSearchIcon, XMarkIcon as SolidXMarkIcon } from 'react-native-heroicons/outline';
import { HeartIcon as SolidHeartIcon, HashtagIcon as SolidHashtagIcon } from 'react-native-heroicons/solid';
import { HeartIcon as OutlineHeartIcon } from 'react-native-heroicons/outline';
import NumpadModal from './NumpadModal';
import { useFloatingButtonLayout } from '../utils/platformUtils';
import {loadFavorites, toggleFavorite} from '../store/favoritesSlice';
import { hymnalService, SDAHymn } from '../services/hymnalService';
import tw from '../../tailwind';
import { GlassBackground, GlassGradientBorder, glassSurface, useGlassTheme } from './glass/GlassBackground';

type Song = {
  id: string;
  title: string;
  englishTitle: string;
  lyrics: string;
};

type SongListNavigationProp = NativeStackNavigationProp<RootStackParamList, 'SongList'>;

const mapApiSongs = (items: SDAHymn[]): Song[] => {
  return items.map((item, index) => {
    const resolvedNumber = item.number ?? index + 1;
    const title = item.newHymnalTitle || item.title || item.oldHymnalTitle || `Song ${resolvedNumber}`;
    const lyrics = item.newHymnalLyrics || item.lyrics || item.oldHymnalLyrics || '';
    return {
      id: item.id || `hymnal-${resolvedNumber}`,
      title,
      englishTitle: item.englishTitleOld || '',
      lyrics,
    };
  });
};

const SongList = () => {
  const { floatingButtonBottom, listBottomPadding } = useFloatingButtonLayout();
  const insets = useSafeAreaInsets();
  const [isNumpadVisible, setNumpadVisible] = useState(false);
  const headerTopPadding = Platform.OS === 'android'
    ? Math.max(insets.top + 8, 18)
    : Math.max(insets.top + 8, 16);

  const [isSearchVisible, setSearchVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const navigation = useNavigation<SongListNavigationProp>();
  const glass = useGlassTheme();
  const dispatch: AppDispatch = useDispatch();
  const { favoriteIds = [], isLoaded: favoritesLoaded = false } = useSelector((state: RootState) => state.favorites) || {};
  const [songs, setSongs] = useState<Song[]>([]);
  const listPerformanceProps = Platform.OS === 'android'
    ? {
        removeClippedSubviews: true,
        initialNumToRender: 8,
        maxToRenderPerBatch: 6,
        updateCellsBatchingPeriod: 50,
        windowSize: 7,
      }
    : {};

  useEffect(() => {
    if (!favoritesLoaded) {
      dispatch(loadFavorites());
    }
  }, [dispatch, favoritesLoaded]);

  useEffect(() => {
    const loadSongs = async () => {
      const immediateSongs = await hymnalService.getImmediateSDAHymns();
      setSongs(mapApiSongs(immediateSongs));

      try {
        const apiData = await hymnalService.getSDAHymnsFromApi();
        if (apiData && apiData.length > 0) {
          setSongs(mapApiSongs(apiData));
        }
      } catch (e) {
        if (__DEV__) {
          console.error('Failed to refresh SDA hymns in background', e);
        }
      }
    };

    loadSongs();
  }, []);

  useFocusEffect(
    React.useCallback(() => {
      let isActive = true;

      const reloadCachedSongs = async () => {
        try {
          const cachedSongs = await hymnalService.getImmediateSDAHymns();
          if (isActive && cachedSongs.length > 0) {
            setSongs(mapApiSongs(cachedSongs));
          }
        } catch (e) {
          if (__DEV__) {
            console.error('Failed to reload cached SDA hymns on focus', e);
          }
        }
      };

      reloadCachedSongs();

      return () => {
        isActive = false;
      };
    }, []),
  );

  const handleOpenNumpad = () => setNumpadVisible(true);
  const handleCloseNumpad = () => setNumpadVisible(false);
  const handleToggleSearch = () => {
    setSearchVisible(!isSearchVisible);
    if (isSearchVisible) {
      setSearchQuery('');
    }
  };

  const handleToggleFavorite = (songId: string, songTitle: string) => {
    dispatch(toggleFavorite(songId, songTitle));
  };

  const filteredSongs = useMemo(() => {
    if (searchQuery.trim() === '') return songs;
    const query = searchQuery.toLowerCase();
    return songs.filter((song) =>
      song.title.toLowerCase().includes(query) ||
      song.englishTitle.toLowerCase().includes(query) ||
      song.lyrics.toLowerCase().includes(query)
    );
  }, [searchQuery, songs]);

  const songIndexById = useMemo(() => {
    return new Map(songs.map((song, index) => [song.id, index]));
  }, [songs]);

  const handleSelect = (song: Song, _index: number) => {
    // Find the original index in the full songs array
    const originalIndex = songIndexById.get(song.id);
    if (originalIndex === undefined) return;
    navigation.navigate('SongDetail', {song, songNumber: originalIndex + 1});
  };

  const handleJumpToSong = (songNumber: number) => {
    const songIndex = songNumber - 1;
    const song = songs[songIndex];
    if (!song) return;
    navigation.navigate('SongDetail', {song, songNumber});
  };

  const renderSongItem = ({item, index}: {item: Song; index: number}) => {
    // Find the original song number
    const originalIndex = songIndexById.get(item.id) ?? index;
    const songNumber = originalIndex + 1;
    const songId = item.id;
    const isFavorite = favoriteIds.includes(songId);

    return (
      <TouchableOpacity onPress={() => handleSelect(item, index)} style={[
        tw`flex-row items-center rounded-2xl mt-2 mx-4 p-4`,
        glassSurface(glass, songNumber % 7 === 0),
        songNumber % 7 === 0 && Platform.OS !== 'android' ? { shadowColor: glass.accent, shadowOpacity: 0.24 } : null,
      ]} activeOpacity={0.82}>
        <GlassGradientBorder radius={16} />
        <Text style={[tw`text-2xl font-nokia-bold mr-4 min-w-[35px]`, { color: glass.accent }]}>
          {songNumber}
        </Text>
        <View style={tw`ml-3 flex-1`}>
          <Text style={[tw`text-2xl font-nokia-bold leading-6`, { color: glass.text }]} numberOfLines={2}>
            {item.title}
          </Text>
          {item.englishTitle && (
            <Text style={[tw`font-nokia-bold mt-1`, { color: glass.accent }]} numberOfLines={1}>
              {item.englishTitle}
            </Text>
          )}
        </View>
        <TouchableOpacity onPress={(e) => { e.stopPropagation(); handleToggleFavorite(songId, item.title); }} style={tw`p-2 -mr-2`}>
          {isFavorite ? (
            <SolidHeartIcon size={24} color={tw.color('red-500')} />
          ) : (
            <OutlineHeartIcon size={24} color={tw.color('gray-500')} />
          )}
        </TouchableOpacity>
      </TouchableOpacity>
    );
  };

  return (
    <GlassBackground>
      <SafeAreaView style={tw`flex-1`} edges={['left', 'right']}>
        {/* Fixed Header */}
        <View style={[tw`flex-row items-center justify-between px-4 pb-4`, { paddingTop: headerTopPadding }]}>
          <View style={tw`flex-row items-center flex-1`}>
            <BookOpenIcon size={28} color={glass.accent} />
            <Text style={[tw`text-2xl font-nokia-bold ml-3`, { color: glass.text }]}>
              Hymnal Songs
            </Text>
          </View>
          <TouchableWithoutFeedback onPress={handleToggleSearch}>
            <View style={tw`p-2`}>
              {isSearchVisible ? (
                <SolidXMarkIcon size={24} color={glass.text} />
              ) : (
                <OutlineSearchIcon size={24} color={glass.text} />
              )}
            </View>
          </TouchableWithoutFeedback>
        </View>

        {/* Content */}
        <View style={tw`flex-1`}>
          {isSearchVisible && (
            <View style={tw`px-4 pb-4`}>
              <TextInput
                style={[
                  tw`h-12 rounded-2xl px-4 font-nokia-bold`,
                  glassSurface(glass, true),
                  { color: glass.text },
                ]}
                placeholder="Search titles or lyrics..."
                placeholderTextColor={glass.mutedText}
                value={searchQuery}
                onChangeText={setSearchQuery}
                autoFocus
              />
            </View>
          )}

          <FlatList
            {...listPerformanceProps}
            data={filteredSongs}
            keyExtractor={(item) => item.id}
            renderItem={renderSongItem}
            showsVerticalScrollIndicator={false}
            scrollEnabled={true}
            bounces={true}
            contentContainerStyle={[{ paddingBottom: listBottomPadding }]}
            keyboardShouldPersistTaps="handled"
            ListEmptyComponent={
              searchQuery ? (
                <View style={tw`py-8 px-4 items-center`}>
                  <Text style={[tw`text-lg text-center font-nokia-bold`, { color: glass.mutedText }]}>
                    No songs found for "{searchQuery}"
                  </Text>
                </View>
              ) : null
            }
          />
        </View>
      </SafeAreaView>

      {/* Floating Circular Numpad Button */}
      <TouchableOpacity
        onPress={handleOpenNumpad}
        style={[
          tw`absolute right-5 w-16 h-16 rounded-full items-center justify-center`,
          { bottom: floatingButtonBottom },
          {
            backgroundColor: glass.accent,
            shadowColor: glass.accent,
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.3,
            shadowRadius: 8,
            elevation: 4,
          },
        ]}
        activeOpacity={0.8}
      >
        <SolidHashtagIcon size={28} color="#FDFDFD" />
      </TouchableOpacity>

      <NumpadModal
        visible={isNumpadVisible}
        onClose={handleCloseNumpad}
        onJumpToSong={handleJumpToSong}
        maxSongs={songs.length}
        title="Hymnal"
      />
    </GlassBackground>
  );
};

export default SongList;
