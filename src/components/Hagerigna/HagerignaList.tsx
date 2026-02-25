import React, { useEffect, useMemo, useState } from 'react';
import {
  FlatList,
  Text,
  View,
  TextInput,
  TouchableWithoutFeedback,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import NetInfo from '@react-native-community/netinfo';
import { useFloatingButtonLayout } from '../../utils/platformUtils';
import { useSelector, useDispatch } from 'react-redux';
import { RootState, AppDispatch } from '../../store';
import { RootStackParamList } from '../../../App';
import { hymnalService, HagerignaHymn } from '../../services/hymnalService';
import { loadFavorites, toggleFavorite } from '../../store/favoritesSlice';
import NumpadModal from './../NumpadModal';
import { getCardStyle } from '../../utils/platformUtils';
import { SafeAreaView } from 'react-native-safe-area-context';
import tw from '../../../tailwind';
import { MusicalNoteIcon, MagnifyingGlassIcon as OutlineSearchIcon } from 'react-native-heroicons/outline';
import { HeartIcon as SolidHeartIcon, XMarkIcon as SolidXMarkIcon, HashtagIcon as SolidHashtagIcon } from 'react-native-heroicons/solid';
import { HeartIcon as OutlineHeartIcon, ChevronLeftIcon } from 'react-native-heroicons/outline';
import localHagerignaHymns from './HagerignaData.json';


type SongListNavigationProp = NativeStackNavigationProp<RootStackParamList, 'HagerignaList'>;

type ViewMode = 'songs' | 'singers' | 'singerSongs';

type SingerItem = {
  name: string;
  count: number;
};

const HagerignaList = () => {
  const { floatingButtonBottom, listBottomPadding } = useFloatingButtonLayout();
  const [songs, setSongs] = useState<HagerignaHymn[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isNumpadVisible, setNumpadVisible] = useState(false);
  const [isSearchVisible, setSearchVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<ViewMode>('songs');
  const [selectedSinger, setSelectedSinger] = useState<string | null>(null);

  const navigation = useNavigation<SongListNavigationProp>();
  const isDarkMode = useSelector((state: RootState) => state.theme.isDarkMode);
  const dispatch: AppDispatch = useDispatch();
  const { favoriteIds = [], isLoaded: favoritesLoaded = false } = useSelector((state: RootState) => state.favorites) || {};

  useEffect(() => {
    if (!favoritesLoaded) {
      dispatch(loadFavorites());
    }
  }, [dispatch, favoritesLoaded]);

  const parseLocalJson = (): HagerignaHymn[] => {
    try {
      const newTitles = localHagerignaHymns.resources.array[2].item;
      const newArtist = localHagerignaHymns.resources.array[0].item;
      const newSongs = localHagerignaHymns.resources.array[1].item;
      return newTitles.map((title: string, index: number) => ({
        id: `hagerigna-${index + 1}`,
        title,
        song: newSongs[index],
        artist: newArtist[index],
      }));
    } catch (err) {
      if (__DEV__) {
        console.error('Error reading JSON file:', err);
      }
      return [];
    }
  };

  useEffect(() => {
    const loadSongs = async () => {
      setLoading(true);
      setError(null);

      const netState = await NetInfo.fetch();
      const isOnline = Boolean(netState.isConnected && netState.isInternetReachable !== false);

      if (isOnline) {
        try {
          const apiSongs = await hymnalService.getHagerignaHymnsFromApi();
          if (apiSongs && apiSongs.length > 0) {
            setSongs(apiSongs);
            setLoading(false);
            return;
          }
        } catch (e) {
          if (__DEV__) {
            console.error('Failed to fetch Hagerigna hymns, using cache/local', e);
          }
          setError('Failed to fetch updates. Showing cached or local version.');
        }
      }

      const cachedSongs = await hymnalService.getLocalHagerignaHymns();
      if (cachedSongs && cachedSongs.length > 0) {
        setSongs(cachedSongs);
      } else {
        setSongs(parseLocalJson());
      }
      setLoading(false);
    };

    loadSongs();
  }, []);

  const normalizedSongs = useMemo(() => {
    return songs.map((song) => ({
      ...song,
      normalizedArtist: (song.artist || '').trim() || 'Unknown',
    }));
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

  const filteredSongs = useMemo(() => {
    let list = normalizedSongs;
    if (viewMode === 'singerSongs' && selectedSinger) {
      list = list.filter((song) => song.normalizedArtist === selectedSinger);
    }

    const query = searchQuery.trim().toLowerCase();
    if (!query) return list;

    return list.filter((song) =>
      song.title.toLowerCase().includes(query) ||
      (song.artist || '').toLowerCase().includes(query) ||
      song.id.toString().includes(query)
    );
  }, [normalizedSongs, viewMode, selectedSinger, searchQuery]);

  const filteredSingers = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return singers;
    return singers.filter((singer) => singer.name.toLowerCase().includes(query));
  }, [singers, searchQuery]);

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
    setViewMode('singerSongs');
    setSearchQuery('');
    setSearchVisible(false);
  };

  const handleBackToSingers = () => {
    setViewMode('singers');
    setSelectedSinger(null);
    setSearchQuery('');
  };

  const dynamicStyles = {
    container: tw`flex-1 mt-8 ${isDarkMode ? 'bg-dark-primary-10' : 'bg-primary-1'}`,
    songItem: [
      tw`flex-row items-center rounded-xl mt-2 mx-4 p-4 ${isDarkMode ? 'bg-dark-primary-8' : 'bg-primary-3'}`,
      getCardStyle(),
    ],
    singerItem: [
      tw`flex-row items-center rounded-xl mt-2 mx-4 p-4 ${isDarkMode ? 'bg-dark-primary-8' : 'bg-primary-3'}`,
      getCardStyle(),
    ],
    songNumber: tw`text-2xl font-nokia-bold mr-4 text-accent-6 min-w-[35px]`,
    songTitle: tw`text-2xl font-nokia-bold leading-6 ${isDarkMode ? 'text-dark-secondary-1' : 'text-secondary-10'}`,
    artistName: tw`font-nokia-bold ${isDarkMode ? 'text-primary-7' : 'text-primary-10'}`,
    sectionTitle: tw`text-lg font-nokia-bold ${isDarkMode ? 'text-dark-secondary-1' : 'text-secondary-10'}`,
    toggleButton: tw`flex-1 py-3 px-4 mx-2 rounded-lg ${isDarkMode ? 'bg-dark-primary-8' : 'bg-primary-3'}`,
    toggleButtonActive: tw`flex-1 py-3 px-4 mx-2 rounded-lg bg-accent-6`,
    toggleButtonText: tw`text-center font-nokia-bold ${isDarkMode ? 'text-dark-secondary-1' : 'text-secondary-10'}`,
    toggleButtonTextActive: tw`text-center font-nokia-bold text-white`,
  };

  const renderSongItem = ({ item }: { item: HagerignaHymn }) => {
    const isFavorite = favoriteIds.includes(item.id);
    const songIndex = songIndexById.get(item.id) ?? 0;

    return (
      <TouchableOpacity onPress={() => handleSelect(item)} style={dynamicStyles.songItem}>
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

  const renderToggleButtons = () => (
    <View style={tw`flex-row px-4 pb-2`}>
      <TouchableOpacity
        style={[
          dynamicStyles.toggleButton,
          viewMode === 'songs' ? dynamicStyles.toggleButtonActive : {},
          getCardStyle(),
        ]}
        onPress={() => {
          setViewMode('songs');
          setSelectedSinger(null);
          setSearchQuery('');
        }}
      >
        <Text style={viewMode === 'songs' ? dynamicStyles.toggleButtonTextActive : dynamicStyles.toggleButtonText}>
          Songs
        </Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={[
          dynamicStyles.toggleButton,
          viewMode === 'singers' || viewMode === 'singerSongs' ? dynamicStyles.toggleButtonActive : {},
          getCardStyle(),
        ]}
        onPress={() => {
          setViewMode('singers');
          setSelectedSinger(null);
          setSearchQuery('');
        }}
      >
        <Text style={viewMode === 'singers' || viewMode === 'singerSongs' ? dynamicStyles.toggleButtonTextActive : dynamicStyles.toggleButtonText}>
          Singers
        </Text>
      </TouchableOpacity>
    </View>
  );

  const searchPlaceholder = viewMode === 'singers'
    ? 'Search singers...'
    : viewMode === 'singerSongs'
      ? 'Search songs by title or number...'
      : 'Search by title, artist or number...';

  return (
    <View style={dynamicStyles.container}>
      <SafeAreaView style={tw`flex-1`} edges={['top']}>
        {/* Fixed Header */}
        <View style={tw`flex-row items-center justify-between px-5 py-4`}>
          <View style={tw`flex-row items-center flex-1`}>
            <MusicalNoteIcon size={28} color="#EA9215" />
            <Text style={tw`text-2xl font-nokia-bold ml-3 ${isDarkMode ? 'text-dark-secondary-1' : 'text-secondary-10'}`}>
              Hagerigna Songs
            </Text>
          </View>
          <TouchableWithoutFeedback onPress={handleToggleSearch}>
            <View style={tw`p-2`}>
              {isSearchVisible ?
                <SolidXMarkIcon size={24} color={isDarkMode ? '#FDFDFD' : '#1A2024'} /> :
                <OutlineSearchIcon size={24} color={isDarkMode ? '#FDFDFD' : '#1A2024'} />
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
                  tw`h-12 rounded-lg px-4 border-2 font-nokia-bold ${isDarkMode ? 'bg-dark-primary-8 border-dark-primary-6 text-dark-secondary-1' : 'bg-primary-3 border-primary-6 text-secondary-10'}`,
                  getCardStyle(),
                ]}
                placeholder={searchPlaceholder}
                placeholderTextColor={isDarkMode ? '#9CA3AF' : '#6B7280'}
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
              data={filteredSingers}
              keyExtractor={(item) => item.name}
              renderItem={renderSingerItem}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={{ paddingBottom: listBottomPadding }}
              ListEmptyComponent={
                <View style={tw`p-8 items-center`}>
                  <Text style={tw`text-lg font-nokia-bold text-center ${isDarkMode ? 'text-primary-7' : 'text-primary-10'}`}>
                    No singers found.
                  </Text>
                </View>
              }
            />
          ) : (
            <FlatList
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
                      <ChevronLeftIcon size={20} color={isDarkMode ? '#FDFDFD' : '#1A2024'} />
                      <Text style={[dynamicStyles.sectionTitle, tw`ml-1`]}>Back to singers</Text>
                    </TouchableOpacity>
                    <Text style={dynamicStyles.sectionTitle} numberOfLines={2}>
                      {selectedSinger}
                    </Text>
                  </View>
                ) : null
              }
              ListEmptyComponent={
                <View style={tw`p-8 items-center`}>
                  <Text style={tw`text-lg font-nokia-bold text-center ${isDarkMode ? 'text-primary-7' : 'text-primary-10'}`}>
                    No songs found.
                  </Text>
                </View>
              }
            />
          )}
        </View>
      </SafeAreaView>

      {/* Floating Circular Numpad Button */}
      {viewMode !== 'singers' ? (
        <TouchableOpacity
          onPress={handleOpenNumpad}
          style={[
            tw`absolute right-5 w-16 h-16 bg-accent-6 rounded-full items-center justify-center`,
            { bottom: floatingButtonBottom },
            {
              shadowColor: '#000',
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
    </View>
  );
};

export default HagerignaList;
