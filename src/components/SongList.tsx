import React, {useEffect, useState} from 'react';
import {FlatList, Text, View, TextInput, TouchableWithoutFeedback, TouchableOpacity} from 'react-native';
import {useNavigation} from '@react-navigation/native';
import {NativeStackNavigationProp} from '@react-navigation/native-stack';
//
import { SafeAreaView } from 'react-native-safe-area-context';
import {useSelector, useDispatch} from 'react-redux';
import {RootState, AppDispatch} from '../store';
import {RootStackParamList} from '../../App';
import hymnalData from './SDA_Hymnal.json';
import { BookOpenIcon, MagnifyingGlassIcon as OutlineSearchIcon, XMarkIcon as SolidXMarkIcon } from 'react-native-heroicons/outline';
import { HeartIcon as SolidHeartIcon, HashtagIcon as SolidHashtagIcon } from 'react-native-heroicons/solid';
import { HeartIcon as OutlineHeartIcon } from 'react-native-heroicons/outline';
import NumpadModal from './NumpadModal';
import { getCardStyle, useBottomContentPadding, useTabBarHeight } from '../utils/platformUtils';
import {loadFavorites, toggleFavorite} from '../store/favoritesSlice';
import tw from '../../tailwind';

type Song = {
  title: string;
  englishTitle: string;
  lyrics: string;
};

type SongListNavigationProp = NativeStackNavigationProp<RootStackParamList, 'SongList'>;

const SongList = () => {
  const { getFloatingButtonBottom } = useTabBarHeight();
  const contentBottomPadding = useBottomContentPadding(24);
  const [songs, setSongs] = useState<Song[]>([]);
  const [filteredSongs, setFilteredSongs] = useState<Song[]>([]);
  const [isNumpadVisible, setNumpadVisible] = useState(false);
  const [isSearchVisible, setSearchVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const navigation = useNavigation<SongListNavigationProp>();
  const isDarkMode = useSelector((state: RootState) => state.theme.isDarkMode);
  const dispatch: AppDispatch = useDispatch();
  const { favoriteIds = [], isLoaded: favoritesLoaded = false } = useSelector((state: RootState) => state.favorites) || {};

  useEffect(() => {
    if (!favoritesLoaded) {
      dispatch(loadFavorites());
    }
  }, [dispatch, favoritesLoaded]);

  const handleOpenNumpad = () => setNumpadVisible(true);
  const handleCloseNumpad = () => setNumpadVisible(false);
  const handleToggleSearch = () => {
    setSearchVisible(!isSearchVisible);
    if (isSearchVisible) {
      setSearchQuery('');
      setFilteredSongs(songs);
    }
  };

  const handleToggleFavorite = (songId: string, songTitle: string) => {
    dispatch(toggleFavorite(songId, songTitle));
  };



  useEffect(() => {
    const loadFile = () => {
      try {
        const newTitles = hymnalData.resources.array[0].item; // Amharic titles array
        const englishTitles = hymnalData.resources.array[3].item; // English titles array
        const newSongs = hymnalData.resources.array[2].item; // Lyrics array

        const combinedSongs = newTitles.map((title: string, index: number) => ({
          title,
          englishTitle: englishTitles[index] || '', // English title with fallback
          lyrics: newSongs[index],
        }));

        setSongs(combinedSongs);
        setFilteredSongs(combinedSongs);
        console.log('Parsed JSON successfully');
      } catch (err) {
        console.error('Error reading JSON file:', err);
      }
    };

    loadFile();
  }, []);

  useEffect(() => {
    if (searchQuery.trim() === '') {
      setFilteredSongs(songs);
    } else {
      const filtered = songs.filter((song, _index) =>
        song.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        song.englishTitle.toLowerCase().includes(searchQuery.toLowerCase()) ||
        song.lyrics.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredSongs(filtered);
    }
  }, [searchQuery, songs]);

  const handleSelect = (song: Song, _index: number) => {
    // Find the original index in the full songs array
    const originalIndex = songs.findIndex(s => s.title === song.title && s.lyrics === song.lyrics);
    navigation.navigate('SongDetail', {song, songNumber: originalIndex + 1});
  };

  const handleJumpToSong = (songNumber: number) => {
    const songIndex = songNumber - 1;
    const song = songs[songIndex];
    navigation.navigate('SongDetail', {song, songNumber});
  };

  const renderSongItem = ({item, index}: {item: Song; index: number}) => {
    // Find the original song number
    const originalIndex = songs.findIndex(s => s.title === item.title && s.lyrics === item.lyrics);
    const songNumber = originalIndex + 1;
    const songId = `hymnal-${originalIndex + 1}`;
    const isFavorite = favoriteIds.includes(songId);
    
    return (
      <TouchableOpacity onPress={() => handleSelect(item, index)} style={[
        tw`flex-row items-center rounded-xl mt-2 mx-4 p-4 ${isDarkMode ? 'bg-dark-primary-8' : 'bg-primary-3'}`,
        getCardStyle()
      ]}>
        <Text style={tw`text-2xl font-nokia-bold mr-4 text-accent-6 min-w-[35px]`}>
          {songNumber}
        </Text>
        <View style={tw`ml-3 flex-1`}>
          <Text style={tw`text-2xl font-nokia-bold leading-6 ${isDarkMode ? 'text-dark-secondary-1' : 'text-secondary-10'}`} numberOfLines={2}>
            {item.title}
          </Text>
          {item.englishTitle && (
            <Text style={tw`font-nokia-bold mt-1 text-accent-6`} numberOfLines={1}>
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
    <View style={tw`flex-1 ${isDarkMode ? 'bg-dark-primary-10' : 'bg-primary-1'}`}>
      <SafeAreaView style={tw`flex-1`}>
        {/* Fixed Header */}
        <View style={[tw`flex-row items-center justify-between px-4 py-4`,]}>
          <View style={tw`flex-row items-center flex-1`}>
            <BookOpenIcon size={28} color="#EA9215" />
            <Text style={tw`text-2xl font-nokia-bold ml-3 ${isDarkMode ? 'text-dark-secondary-1' : 'text-secondary-10'}`}>
              Hymnal Songs
            </Text>
          </View>
          <TouchableWithoutFeedback onPress={handleToggleSearch}>
            <View style={tw`p-2`}>
              {isSearchVisible ? (
                <SolidXMarkIcon size={24} color={isDarkMode ? '#FDFDFD' : '#1A2024'} />
              ) : (
                <OutlineSearchIcon size={24} color={isDarkMode ? '#FDFDFD' : '#1A2024'} />
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
                  tw`h-12 rounded-lg px-4 border-2 font-nokia-bold ${isDarkMode ? 'bg-dark-primary-8 border-dark-primary-6 text-dark-secondary-1' : 'bg-primary-3 border-primary-6 text-secondary-10'}`,
                  getCardStyle()
                ]}
                placeholder="Search titles or lyrics..."
                placeholderTextColor={isDarkMode ? '#9CA3AF' : '#6B7280'}
                value={searchQuery}
                onChangeText={setSearchQuery}
                autoFocus
              />
            </View>
          )}

          <FlatList
            data={filteredSongs}
            keyExtractor={(item, index) => index.toString()}
            renderItem={renderSongItem}
            showsVerticalScrollIndicator={false}
            scrollEnabled={true}
            bounces={true}
            removeClippedSubviews={true}
            contentContainerStyle={[tw`pb-24`, { paddingBottom: contentBottomPadding }]}
            keyboardShouldPersistTaps="handled"
            ListEmptyComponent={
              searchQuery ? (
                <View style={tw`py-8 px-4 items-center`}>
                  <Text style={tw`text-lg text-center font-nokia-bold ${isDarkMode ? 'text-primary-7' : 'text-primary-10'}`}>
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
          tw`absolute right-5 w-16 h-16 bg-accent-6 rounded-full items-center justify-center`,
          { bottom: getFloatingButtonBottom() },
          {
            shadowColor: '#000',
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
    </View>
  );
};

export default SongList;
