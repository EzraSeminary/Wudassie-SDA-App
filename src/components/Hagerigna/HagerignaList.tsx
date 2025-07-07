import React, {useEffect, useState} from 'react';
import {
  FlatList,
  Text,
  View,
  TextInput,
  TouchableWithoutFeedback,
  SafeAreaView,
  TouchableOpacity,
  ActivityIndicator
} from 'react-native';
import {useNavigation} from '@react-navigation/native';
import {NativeStackNavigationProp} from '@react-navigation/native-stack';
import {useSelector, useDispatch} from 'react-redux';
import {RootState, AppDispatch} from '../../store';
import {RootStackParamList} from '../../../App';
import {hymnalService, HagerignaHymn} from '../../services/hymnalService';
import {loadFavorites, toggleFavorite} from '../../store/favoritesSlice';
import NumpadModal from './../NumpadModal';
import {getCardStyle} from '../../utils/platformUtils';
import tw from '../../../tailwind';
import { MusicalNoteIcon, HashtagIcon, MagnifyingGlassIcon as OutlineSearchIcon } from 'react-native-heroicons/outline';
import { HeartIcon as SolidHeartIcon, XMarkIcon as SolidXMarkIcon } from 'react-native-heroicons/solid';
import { HeartIcon as OutlineHeartIcon } from 'react-native-heroicons/outline';
import localHagerignaHymns from './HagerignaData.json';


type SongListNavigationProp = NativeStackNavigationProp<RootStackParamList, 'HagerignaList'>;

const HagerignaList = () => {
    const [songs, setSongs] = useState<HagerignaHymn[]>([]);
    const [filteredSongs, setFilteredSongs] = useState<HagerignaHymn[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
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
    
    useEffect(() => {
        console.log('Favorites state changed:', { favoriteIds, favoritesLoaded });
    }, [favoriteIds, favoritesLoaded]);
    
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
          console.error('Error reading JSON file:', err);
          return [];
    }
  };

  useEffect(() => {
        const loadInitialData = async () => {
            let initialSongs: HagerignaHymn[] = [];
            const cachedSongs = await hymnalService.getLocalHagerignaHymns();
            
            if (cachedSongs && cachedSongs.length > 0) {
                initialSongs = cachedSongs;
            } else {
                initialSongs = parseLocalJson();
            }

            if (initialSongs.length > 0) {
                setSongs(initialSongs);
                setFilteredSongs(initialSongs);
            } else {
                setLoading(true); // Only show loading if there is no data at all
            }
        };

        const fetchApiData = async () => {
            try {
                const apiSongs = await hymnalService.getHagerignaHymns();
                setSongs(apiSongs);
            } catch (e) {
                console.error("Failed to fetch API updates for Hagerigna hymns", e);
                setError("Failed to fetch updates. Showing local version.");
            } finally {
                setLoading(false);
      }
    };

        loadInitialData().then(fetchApiData);

  }, []);

  useEffect(() => {
    if (searchQuery.trim() === '') {
      setFilteredSongs(songs);
    } else {
          const filtered = songs.filter((song) =>
        song.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            (song.artist || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
            song.id.toString().includes(searchQuery)
      );
      setFilteredSongs(filtered);
    }
  }, [searchQuery, songs]);

    const handleOpenNumpad = () => setNumpadVisible(true);
    const handleCloseNumpad = () => setNumpadVisible(false);
    const handleToggleSearch = () => {
        setSearchVisible(!isSearchVisible);
        if (isSearchVisible) {
            setSearchQuery('');
        }
    };
    
    const handleSelect = (song: HagerignaHymn) => {
        const songIndex = songs.findIndex(s => s.id === song.id);
        navigation.navigate('HagerignaDetail', { song, songNumber: songIndex + 1 });
  };

  const handleJumpToSong = (songNumber: number) => {
        const song = songs[songNumber - 1];
        if (song) {
            handleSelect(song);
        }
        handleCloseNumpad();
    };

    const handleToggleFavorite = (songId: string, songTitle: string) => {
        console.log('handleToggleFavorite called with:', songId, songTitle);
        console.log('Current favorites before toggle:', favoriteIds);
        dispatch(toggleFavorite(songId, songTitle));
        console.log('Dispatch completed');
  };

  const dynamicStyles = {
    container: tw`flex-1 ${isDarkMode ? 'bg-dark-primary-10' : 'bg-primary-1'}`,
    songItem: [
          tw`flex-row items-center rounded-xl mt-2 mx-4 p-4 ${isDarkMode ? 'bg-dark-primary-8' : 'bg-primary-3'}`,
      getCardStyle()
    ],
    songNumber: tw`text-2xl font-nokia-bold mr-4 text-accent-6 min-w-[35px]`,
    songTitle: tw`text-2xl font-nokia-bold leading-6 ${isDarkMode ? 'text-dark-secondary-1' : 'text-secondary-10'}`,
        artistName: tw`font-nokia-bold ${isDarkMode ? 'text-primary-7' : 'text-primary-10'}`
  };

    const renderSongItem = ({ item }: { item: HagerignaHymn }) => {
        const isFavorite = favoriteIds.includes(item.id);
        const songIndex = songs.findIndex(s => s.id === item.id);
        
        console.log(`Song ${item.id} (${item.title}): isFavorite=${isFavorite}, favoriteIds=${JSON.stringify(favoriteIds)}`);
    
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

  return (
    <View style={dynamicStyles.container}>
      <SafeAreaView style={tw`flex-1`}>
        <View style={tw`flex-row items-center justify-between p-5 pb-4 pt-4`}>
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

        {isSearchVisible && (
          <View style={tw`px-5 pb-4`}>
            <TextInput
              style={[
                tw`h-12 rounded-lg px-4 border-2 font-nokia-bold ${isDarkMode ? 'bg-dark-primary-8 border-dark-primary-6 text-dark-secondary-1' : 'bg-primary-3 border-primary-6 text-secondary-10'}`,
                getCardStyle()
              ]}
                            placeholder="Search by title, artist or number..."
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
                ) : (
        <FlatList
          data={filteredSongs}
                        keyExtractor={(item) => item.id}
          renderItem={renderSongItem}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={tw`pb-24`}
          ListEmptyComponent={
              <View style={tw`p-8 items-center`}>
                <Text style={tw`text-lg font-nokia-bold text-center ${isDarkMode ? 'text-primary-7' : 'text-primary-10'}`}>
                                    No songs found.
                </Text>
              </View>
          }
        />
                )}

        <TouchableWithoutFeedback onPress={handleOpenNumpad}>
          <View style={[
                        tw`absolute bottom-10 right-5 bg-accent-6 rounded-full p-4`,
            getCardStyle()
          ]}>
            <HashtagIcon size={24} color="#FDFDFD" />
          </View>
        </TouchableWithoutFeedback>
      </SafeAreaView>

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