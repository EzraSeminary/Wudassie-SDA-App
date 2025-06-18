import React, {useEffect, useState} from 'react';
import {FlatList, Text, View, TextInput, TouchableWithoutFeedback, SafeAreaView} from 'react-native';
import {useNavigation} from '@react-navigation/native';
import {NativeStackNavigationProp} from '@react-navigation/native-stack';
import {useSelector} from 'react-redux';
import {RootState} from '../../store';
import {RootStackParamList} from '../../../App';
import hymnalData from './HagerignaData.json';
import { MusicalNoteIcon, HashtagIcon, MagnifyingGlassIcon, XMarkIcon } from 'react-native-heroicons/outline';
import NumpadModal from './../NumpadModal';
import { getCardStyle } from '../../utils/platformUtils';
import tw from '../../../tailwind';
import { hymnalService, HagerignaHymn } from '../../services/hymnalService';

type SongListNavigationProp = NativeStackNavigationProp<RootStackParamList, 'HagerignaList'>;

const HagerignaList = () => {
  const [songs, setSongs] = useState<HagerignaHymn[]>([]);
  const [filteredSongs, setFilteredSongs] = useState<HagerignaHymn[]>([]);
  const [isNumpadVisible, setNumpadVisible] = useState(false);
  const [isSearchVisible, setSearchVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const navigation = useNavigation<SongListNavigationProp>();
  const isDarkMode = useSelector((state: RootState) => state.theme.isDarkMode);

  const handleOpenNumpad = () => setNumpadVisible(true);
  const handleCloseNumpad = () => setNumpadVisible(false);
  const handleToggleSearch = () => {
    setSearchVisible(!isSearchVisible);
    if (isSearchVisible) {
      setSearchQuery('');
      setFilteredSongs(songs);
    }
  };

  useEffect(() => {
    const parseLocalJson = (): HagerignaHymn[] => {
      try {
        const newTitles = hymnalData.resources.array[2].item;
        const newArtist = hymnalData.resources.array[0].item;
        const newSongs = hymnalData.resources.array[1].item;
        return newTitles.map((title: string, index: number) => ({
          id: `hagerigna-${index}`,
          title,
          song: newSongs[index],
          artist: newArtist[index],
        }));
      } catch (err) {
        console.error('Error reading JSON file:', err);
        return [];
      }
    };

    const loadData = async () => {
      // 1. Try to load from cache (AsyncStorage) for a fast start
      const cachedSongs = await hymnalService.getLocalHagerignaHymns();
      if (cachedSongs && cachedSongs.length > 0) {
        setSongs(cachedSongs);
        setFilteredSongs(cachedSongs);
      } else {
        // 2. If no cache, load from bundled JSON immediately
        const localSongs = parseLocalJson();
        setSongs(localSongs);
        setFilteredSongs(localSongs);
      }

      // 3. Fetch from API in the background to get latest updates
      try {
        const apiSongs = await hymnalService.getHagerignaHymns();
        setSongs(apiSongs);
        setFilteredSongs(apiSongs);
      } catch (error) {
        console.error('Failed to fetch API updates, using cached/local data.', error);
      }
    };

    loadData();
  }, []);

  useEffect(() => {
    if (searchQuery.trim() === '') {
      setFilteredSongs(songs);
    } else {
      const filtered = songs.filter((song, _index) =>
        song.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (song.artist || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        song.song.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredSongs(filtered);
    }
  }, [searchQuery, songs]);

  const handleSelect = (song: HagerignaHymn, _index: number) => {
    const songNumber = songs.findIndex(s => s.id === song.id) + 1;
    navigation.navigate('HagerignaDetail', { song: { ...song, artist: song.artist || '' }, songNumber });
  };

  const handleJumpToSong = (songNumber: number) => {
    const songIndex = songNumber - 1;
    const song = songs[songIndex];
    if (song) {
      navigation.navigate('HagerignaDetail', { song: { ...song, artist: song.artist || '' }, songNumber });
    }
  };


  const dynamicStyles = {
    container: tw`flex-1 ${isDarkMode ? 'bg-dark-primary-10' : 'bg-primary-1'}`,
    songItem: [
      tw`flex-row items-center rounded-xl mt-2 mx-4 ${isDarkMode ? 'bg-dark-primary-8' : 'bg-primary-3'}`,
      getCardStyle()
    ],
    songNumber: tw`text-2xl font-nokia-bold mr-4 text-accent-6 min-w-[35px]`,
    songTitle: tw`text-2xl font-nokia-bold leading-6 ${isDarkMode ? 'text-dark-secondary-1' : 'text-secondary-10'}`,
    artistName: tw`font-nokia-bold ${isDarkMode ? 'text-primary-7' : 'text-primary-10'}`
  };

  const renderSongItem = ({item, index}: {item: HagerignaHymn; index: number}) => {
    // Find the original song number
    const originalIndex = songs.findIndex(s => s.id === item.id);
    const songNumber = originalIndex + 1;
    
    return (
      <View style={dynamicStyles.songItem}>
        <TouchableWithoutFeedback onPress={() => handleSelect(item, index)}>
          <View style={tw`flex-1 p-4`}>
            <View style={tw`flex-row items-center`}>
              <Text style={[dynamicStyles.songNumber, tw`ml font-nokia-bold`]}>
                {songNumber}
              </Text>
              <View style={tw`ml-3 flex-1`}>
                <Text style={[dynamicStyles.songTitle, tw`font-nokia-bold`]} numberOfLines={2}>
                  {item.title}
                </Text>
                <Text style={[dynamicStyles.artistName, tw`mt-1 font-nokia-bold`]} numberOfLines={1}>
                  {item.artist || ''}
                </Text>
              </View>
            </View>
          </View>
        </TouchableWithoutFeedback>
      
      </View>
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
              {isSearchVisible ? (
                <XMarkIcon size={24} color={isDarkMode ? '#FDFDFD' : '#1A2024'} />
              ) : (
                <MagnifyingGlassIcon size={24} color={isDarkMode ? '#FDFDFD' : '#1A2024'} />
              )}
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
              placeholder="Search titles, artists, or lyrics..."
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
          contentContainerStyle={tw`pb-24`}
          keyboardShouldPersistTaps="handled"
          ListEmptyComponent={
            searchQuery ? (
              <View style={tw`p-8 items-center`}>
                <Text style={tw`text-lg font-nokia-bold text-center ${isDarkMode ? 'text-primary-7' : 'text-primary-10'}`}>
                  No songs found for "{searchQuery}"
                </Text>
              </View>
            ) : null
          }
        />

        {/* Floating Numpad Button */}
        <TouchableWithoutFeedback onPress={handleOpenNumpad}>
          <View style={[
            tw`absolute bottom-24 right-5 bg-accent-6 rounded-full p-4`,
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