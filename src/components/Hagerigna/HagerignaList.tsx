import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  FlatList,
  Text,
  View,
  TextInput,
  TouchableWithoutFeedback,
  TouchableOpacity,
  ActivityIndicator,
  Platform,
  Animated,
  LayoutChangeEvent,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useFloatingButtonLayout } from '../../utils/platformUtils';
import { useSelector, useDispatch } from 'react-redux';
import { RootState, AppDispatch } from '../../store';
import { RootStackParamList } from '../../../App';
import { hymnalService, HagerignaHymn } from '../../services/hymnalService';
import { loadFavorites, toggleFavorite } from '../../store/favoritesSlice';
import NumpadModal from './../NumpadModal';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import tw from '../../../tailwind';
import { MusicalNoteIcon, MagnifyingGlassIcon as OutlineSearchIcon } from 'react-native-heroicons/outline';
import { HeartIcon as SolidHeartIcon, XMarkIcon as SolidXMarkIcon, HashtagIcon as SolidHashtagIcon } from 'react-native-heroicons/solid';
import { HeartIcon as OutlineHeartIcon, ChevronLeftIcon } from 'react-native-heroicons/outline';
import { GlassBackground, GlassGradientBorder, glassSurface, useGlassTheme } from '../glass/GlassBackground';


type SongListNavigationProp = NativeStackNavigationProp<RootStackParamList, 'HagerignaList'>;

type ViewMode = 'songs' | 'singers' | 'singerSongs' | 'albums' | 'albumSongs';

type SingerItem = {
  name: string;
  count: number;
};

type AlbumItem = {
  key: string;
  title: string;
  singer: string;
  count: number;
};

const HagerignaList = () => {
  const { floatingButtonBottom, listBottomPadding } = useFloatingButtonLayout();
  const insets = useSafeAreaInsets();
  const [songs, setSongs] = useState<HagerignaHymn[]>([]);
  const headerTopPadding = Platform.OS === 'android'
    ? Math.max(insets.top + 8, 18)
    : Math.max(insets.top + 8, 16);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isNumpadVisible, setNumpadVisible] = useState(false);
  const [isSearchVisible, setSearchVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<ViewMode>('songs');
  const [selectedSinger, setSelectedSinger] = useState<string | null>(null);
  const [selectedAlbum, setSelectedAlbum] = useState<AlbumItem | null>(null);
  const [segmentWidth, setSegmentWidth] = useState(0);
  const slideAnim = useRef(new Animated.Value(0)).current;

  const navigation = useNavigation<SongListNavigationProp>();
  const glass = useGlassTheme();
  const dispatch: AppDispatch = useDispatch();
  const { favoriteIds = [], isLoaded: favoritesLoaded = false } = useSelector((state: RootState) => state.favorites) || {};

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
      setLoading(true);
      setError(null);

      try {
        const immediateSongs = await hymnalService.getImmediateHagerignaHymns();
        setSongs(immediateSongs);
      } catch (e) {
        if (__DEV__) {
          console.error('Failed to load local Hagerigna hymns', e);
        }
        setError('Failed to load songs.');
      }
      setLoading(false);

      try {
        const apiSongs = await hymnalService.getHagerignaHymnsFromApi();
        if (apiSongs && apiSongs.length > 0) {
          setSongs(apiSongs);
        }
      } catch (e) {
        if (__DEV__) {
          console.error('Failed to refresh Hagerigna hymns in background', e);
        }
      }
    };

    loadSongs();
  }, []);

  const normalizedSongs = useMemo(() => {
    return songs.map((song) => {
      const isAlbum = Boolean(song.isAlbum);
      const albumLabel = (
        song.albumTitle ||
        song.albumName ||
        song.album ||
        song.category ||
        (isAlbum ? song.title : '') ||
        ''
      ).trim();
      const albumKey = (
        song.albumId ||
        song.albumTitle ||
        song.albumName ||
        song.album ||
        song.category ||
        (isAlbum ? song.id || song.title : '') ||
        ''
      ).trim();

      return {
        ...song,
        isAlbum,
        normalizedArtist: (song.artist || '').trim() || 'Unknown',
        normalizedAlbum: albumLabel,
        normalizedAlbumKey: albumKey,
      };
    });
  }, [songs]);

  const songIndexById = useMemo(() => {
    return new Map(normalizedSongs.map((song, index) => [song.id, index]));
  }, [normalizedSongs]);

  const singers = useMemo<SingerItem[]>(() => {
    const counts = new Map<string, number>();
    normalizedSongs.forEach((song) => {
      const artist = song.normalizedArtist;
      counts.set(artist, (counts.get(artist) || 0) + 1);
    });

    return Array.from(counts.entries())
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [normalizedSongs]);

  const albums = useMemo<AlbumItem[]>(() => {
    const grouped = new Map<string, AlbumItem>();
    // Only songs marked with isAlbum go into the Albums section
    normalizedSongs.forEach((song) => {
      if (!song.isAlbum) return;
      if (!song.normalizedAlbum || !song.normalizedAlbumKey) return;
      const key = song.normalizedAlbumKey;
      const existing = grouped.get(key);
      if (existing) {
        existing.count += 1;
        if (existing.singer === 'Unknown' && song.normalizedArtist !== 'Unknown') {
          existing.singer = song.normalizedArtist;
        }
        return;
      }
      grouped.set(key, {
        key,
        title: song.normalizedAlbum,
        singer: song.normalizedArtist,
        count: 1,
      });
    });

    return Array.from(grouped.values())
      .sort((a, b) => a.title.localeCompare(b.title));
  }, [normalizedSongs]);

  const filteredSongs = useMemo(() => {
    let list = normalizedSongs;
    if (viewMode === 'singerSongs' && selectedSinger) {
      list = list.filter((song) => song.normalizedArtist === selectedSinger);
    } else if (viewMode === 'albumSongs' && selectedAlbum) {
      list = list
        .filter((song) => song.isAlbum && song.normalizedAlbumKey === selectedAlbum.key)
        .sort((a, b) => (a.trackNumber ?? 0) - (b.trackNumber ?? 0));
    }

    const query = searchQuery.trim().toLowerCase();
    if (!query) return list;

    return list.filter((song) =>
      song.title.toLowerCase().includes(query) ||
      (song.artist || '').toLowerCase().includes(query) ||
      song.id.toString().includes(query) ||
      (song.song || '').toLowerCase().includes(query)
    );
  }, [normalizedSongs, viewMode, selectedSinger, selectedAlbum, searchQuery]);

  const filteredSingers = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return singers;
    return singers.filter((singer) => singer.name.toLowerCase().includes(query));
  }, [singers, searchQuery]);

  const filteredAlbums = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return albums;
    return albums.filter((album) =>
      album.title.toLowerCase().includes(query) ||
      album.singer.toLowerCase().includes(query)
    );
  }, [albums, searchQuery]);

  const handleOpenNumpad = () => setNumpadVisible(true);
  const handleCloseNumpad = () => setNumpadVisible(false);
  const handleToggleSearch = () => {
    setSearchVisible(!isSearchVisible);
    if (isSearchVisible) {
      setSearchQuery('');
    }
  };

  const handleSelect = (song: HagerignaHymn) => {
    const songIndex = songIndexById.get(song.id);
    if (songIndex === undefined) return;
    navigation.navigate('HagerignaDetail', { song, songNumber: songIndex + 1 });
  };

  const handleJumpToSong = (songNumber: number) => {
    const song = normalizedSongs[songNumber - 1];
    if (song) {
      handleSelect(song);
    }
    handleCloseNumpad();
  };

  const handleToggleFavorite = (songId: string, songTitle: string) => {
    dispatch(toggleFavorite(songId, songTitle));
  };

  const handleSelectSinger = (singer: string) => {
    setSelectedSinger(singer);
    setSelectedAlbum(null);
    setViewMode('singerSongs');
    setSearchQuery('');
    setSearchVisible(false);
  };

  const handleSelectAlbum = (album: AlbumItem) => {
    setSelectedAlbum(album);
    setSelectedSinger(null);
    setViewMode('albumSongs');
    setSearchQuery('');
    setSearchVisible(false);
  };

  const handleBackToSingers = () => {
    setViewMode('singers');
    setSelectedSinger(null);
    setSelectedAlbum(null);
    setSearchQuery('');
  };

  const handleBackToAlbums = () => {
    setViewMode('albums');
    setSelectedAlbum(null);
    setSearchQuery('');
  };

  const activeSegmentIndex = viewMode === 'singers' || viewMode === 'singerSongs'
    ? 1
    : viewMode === 'albums' || viewMode === 'albumSongs'
      ? 2
      : 0;

  useEffect(() => {
    if (segmentWidth <= 0) return;
    Animated.spring(slideAnim, {
      toValue: activeSegmentIndex,
      useNativeDriver: true,
      friction: 8,
      tension: 120,
    }).start();
  }, [activeSegmentIndex, segmentWidth, slideAnim]);

  const segmentPadding = 6;
  const onSegmentLayout = (e: LayoutChangeEvent) => {
    const { width } = e.nativeEvent.layout;
    const w = (width - segmentPadding * 2) / 3;
    if (w > 0) setSegmentWidth(w);
  };

  const dynamicStyles = {
    songItem: [
      tw`flex-row items-center rounded-2xl mt-2 mx-4 p-4`,
      glassSurface(glass),
    ],
    singerItem: [
      tw`flex-row items-center rounded-2xl mt-2 mx-4 p-4`,
      glassSurface(glass, true),
    ],
    songNumber: [tw`text-2xl font-nokia-bold mr-4 min-w-[35px]`, { color: glass.accent }],
    songTitle: [tw`text-2xl font-nokia-bold leading-6`, { color: glass.text }],
    artistName: [tw`font-nokia-bold`, { color: glass.mutedText }],
    sectionTitle: [tw`text-lg font-nokia-bold`, { color: glass.text }],
    segmentTrack: [tw`flex-row rounded-full overflow-hidden`, glassSurface(glass, true)],
    segmentButton: [tw`flex-1 py-3 items-center justify-center`, { zIndex: 1 }],
    segmentText: [tw`text-center font-nokia-bold`, { color: glass.text }],
    segmentTextActive: tw`text-center font-nokia-bold text-white`,
  };

  const renderSongItem = ({ item }: { item: HagerignaHymn }) => {
    const isFavorite = favoriteIds.includes(item.id);
    const songIndex = songIndexById.get(item.id) ?? 0;

    return (
      <TouchableOpacity onPress={() => handleSelect(item)} style={dynamicStyles.songItem}>
        <GlassGradientBorder radius={16} />
        <Text style={[dynamicStyles.songNumber, tw`ml font-nokia-bold`]}>
          {songIndex + 1}
        </Text>
        <View style={tw`ml-3 flex-1`}>
          <Text style={[dynamicStyles.songTitle, tw`font-nokia-bold`]} numberOfLines={2}>
            {item.title}
          </Text>
          <Text style={[dynamicStyles.artistName, tw`mt-1 font-nokia-bold`]} numberOfLines={1}>
            {item.artist || ''}
          </Text>
        </View>
        <TouchableOpacity onPress={(e) => { e.stopPropagation(); handleToggleFavorite(item.id, item.title); }} style={tw`p-2 -mr-2`}>
          {isFavorite ? (
            <SolidHeartIcon size={24} color={tw.color('red-500')} />
          ) : (
            <OutlineHeartIcon size={24} color={tw.color('gray-500')} />
          )}
        </TouchableOpacity>
      </TouchableOpacity>
    );
  };

  const renderSingerItem = ({ item }: { item: SingerItem }) => (
    <TouchableOpacity onPress={() => handleSelectSinger(item.name)} style={dynamicStyles.singerItem}>
      <GlassGradientBorder radius={16} />
      <View style={tw`flex-1`}>
        <Text style={dynamicStyles.songTitle} numberOfLines={1}>
          {item.name}
        </Text>
        <Text style={[dynamicStyles.artistName, tw`mt-1`]}>
          {item.count} {item.count === 1 ? 'song' : 'songs'}
        </Text>
      </View>
    </TouchableOpacity>
  );

  const renderAlbumItem = ({ item }: { item: AlbumItem }) => (
    <TouchableOpacity onPress={() => handleSelectAlbum(item)} style={dynamicStyles.singerItem}>
      <GlassGradientBorder radius={16} />
      <View style={tw`flex-1`}>
        <Text style={dynamicStyles.songTitle} numberOfLines={1}>
          {item.title}
        </Text>
        <Text style={[dynamicStyles.artistName, tw`mt-1`]} numberOfLines={1}>
          {item.singer} - {item.count} {item.count === 1 ? 'song' : 'songs'}
        </Text>
      </View>
    </TouchableOpacity>
  );

  const renderToggleButtons = () => {
    const slideTranslate = slideAnim.interpolate({
      inputRange: [0, 1, 2],
      outputRange: [0, segmentWidth, segmentWidth * 2],
    });
    return (
      <View style={tw`px-4 pb-2`}>
        <View style={[dynamicStyles.segmentTrack, { padding: segmentPadding }]} onLayout={onSegmentLayout}>
          <Animated.View
            style={[
              tw`absolute rounded-full`,
              {
                left: segmentPadding,
                top: segmentPadding,
                bottom: segmentPadding,
                width: segmentWidth,
                backgroundColor: glass.accent,
                transform: [{ translateX: slideTranslate }],
              },
            ]}
          />
          <TouchableOpacity
            style={dynamicStyles.segmentButton}
            onPress={() => {
              setViewMode('songs');
              setSelectedSinger(null);
              setSelectedAlbum(null);
              setSearchQuery('');
            }}
          >
            <Text style={viewMode === 'songs' ? dynamicStyles.segmentTextActive : dynamicStyles.segmentText}>
              Songs
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={dynamicStyles.segmentButton}
            onPress={() => {
              setViewMode('singers');
              setSelectedSinger(null);
              setSelectedAlbum(null);
              setSearchQuery('');
            }}
          >
            <Text style={viewMode === 'singers' || viewMode === 'singerSongs' ? dynamicStyles.segmentTextActive : dynamicStyles.segmentText}>
              Singers
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={dynamicStyles.segmentButton}
            onPress={() => {
              setViewMode('albums');
              setSelectedSinger(null);
              setSelectedAlbum(null);
              setSearchQuery('');
            }}
          >
            <Text style={viewMode === 'albums' || viewMode === 'albumSongs' ? dynamicStyles.segmentTextActive : dynamicStyles.segmentText}>
              Albums
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  const searchPlaceholder = viewMode === 'singers'
    ? 'Search singers...'
    : viewMode === 'albums'
      ? 'Search albums or singers...'
    : viewMode === 'singerSongs'
      ? 'Search titles or lyrics...'
      : viewMode === 'albumSongs'
        ? 'Search album songs...'
      : 'Search titles, artist or lyrics...';

  return (
    <GlassBackground>
      <SafeAreaView style={tw`flex-1`} edges={['left', 'right']}>
        {/* Fixed Header */}
        <View style={[tw`flex-row items-center justify-between px-5 pb-4`, { paddingTop: headerTopPadding }]}>
          <View style={tw`flex-row items-center flex-1`}>
            <MusicalNoteIcon size={28} color={glass.accent} />
            <Text style={[tw`text-2xl font-nokia-bold ml-3`, { color: glass.text }]}>
              Hagerigna Songs
            </Text>
          </View>
          <TouchableWithoutFeedback onPress={handleToggleSearch}>
            <View style={tw`p-2`}>
              {isSearchVisible ?
                <SolidXMarkIcon size={24} color={glass.text} /> :
                <OutlineSearchIcon size={24} color={glass.text} />
              }
            </View>
          </TouchableWithoutFeedback>
        </View>

        {renderToggleButtons()}

        {/* Content */}
        <View style={tw`flex-1`}>
          {isSearchVisible && (
            <View style={tw`px-5 pb-4`}>
              <TextInput
                style={[
                  tw`h-12 rounded-2xl px-4 font-nokia-bold`,
                  glassSurface(glass, true),
                  { color: glass.text },
                ]}
                placeholder={searchPlaceholder}
                placeholderTextColor={glass.mutedText}
                value={searchQuery}
                onChangeText={setSearchQuery}
                autoFocus
              />
            </View>
          )}

          {loading ? (
            <ActivityIndicator size="large" color={tw.color('accent-6')} style={tw`mt-10`} />
          ) : error ? (
            <View style={tw`p-8 items-center`}><Text style={tw`text-lg font-nokia-bold text-center text-red-500`}>{error}</Text></View>
          ) : viewMode === 'singers' ? (
            <FlatList
              {...listPerformanceProps}
              data={filteredSingers}
              keyExtractor={(item) => item.name}
              renderItem={renderSingerItem}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={{ paddingBottom: listBottomPadding }}
              ListEmptyComponent={
                <View style={tw`p-8 items-center`}>
                  <Text style={[tw`text-lg font-nokia-bold text-center`, { color: glass.mutedText }]}>
                    No singers found.
                  </Text>
                </View>
              }
            />
          ) : viewMode === 'albums' ? (
            <FlatList
              {...listPerformanceProps}
              data={filteredAlbums}
              keyExtractor={(item) => item.key}
              renderItem={renderAlbumItem}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={{ paddingBottom: listBottomPadding }}
              ListEmptyComponent={
                <View style={tw`p-8 items-center`}>
                  <Text style={[tw`text-lg font-nokia-bold text-center`, { color: glass.mutedText }]}>
                    No albums found.
                  </Text>
                </View>
              }
            />
          ) : (
            <FlatList
              {...listPerformanceProps}
              data={filteredSongs}
              keyExtractor={(item) => item.id}
              renderItem={renderSongItem}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={{ paddingBottom: listBottomPadding }}
              keyboardShouldPersistTaps="handled"
              ListHeaderComponent={
                viewMode === 'singerSongs' && selectedSinger ? (
                  <View style={tw`px-5 pb-3`}>
                    <TouchableOpacity onPress={handleBackToSingers} style={tw`flex-row items-center mb-2`}>
                      <ChevronLeftIcon size={20} color={glass.text} />
                      <Text style={[dynamicStyles.sectionTitle, tw`ml-1`]}>Back to singers</Text>
                    </TouchableOpacity>
                    <Text style={dynamicStyles.sectionTitle} numberOfLines={2}>
                      {selectedSinger}
                    </Text>
                  </View>
                ) : viewMode === 'albumSongs' && selectedAlbum ? (
                  <View style={tw`px-5 pb-3`}>
                    <TouchableOpacity onPress={handleBackToAlbums} style={tw`flex-row items-center mb-2`}>
                      <ChevronLeftIcon size={20} color={glass.text} />
                      <Text style={[dynamicStyles.sectionTitle, tw`ml-1`]}>Back to albums</Text>
                    </TouchableOpacity>
                    <Text style={dynamicStyles.sectionTitle} numberOfLines={2}>
                      {selectedAlbum.title}
                    </Text>
                    <Text style={[dynamicStyles.artistName, tw`mt-1`]} numberOfLines={1}>
                      {selectedAlbum.singer}
                    </Text>
                  </View>
                ) : null
              }
              ListEmptyComponent={
                <View style={tw`p-8 items-center`}>
                  <Text style={[tw`text-lg font-nokia-bold text-center`, { color: glass.mutedText }]}>
                    No songs found.
                  </Text>
                </View>
              }
            />
          )}
        </View>
      </SafeAreaView>

      {/* Floating Circular Numpad Button */}
      {viewMode !== 'singers' && viewMode !== 'albums' ? (
        <TouchableOpacity
          onPress={handleOpenNumpad}
          style={[
            tw`absolute right-5 w-16 h-16 rounded-full items-center justify-center`,
            { bottom: floatingButtonBottom },
            {
              backgroundColor: glass.accent,
              shadowColor: glass.accent,
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.3,
              shadowRadius: 8,
              elevation: 8,
            },
          ]}
          activeOpacity={0.8}
        >
          <SolidHashtagIcon size={28} color="#FDFDFD" />
        </TouchableOpacity>
      ) : null}

      <NumpadModal
        visible={isNumpadVisible}
        onClose={handleCloseNumpad}
        onJumpToSong={handleJumpToSong}
        maxSongs={songs.length}
        title="Hagerigna"
      />
    </GlassBackground>
  );
};

export default HagerignaList;
