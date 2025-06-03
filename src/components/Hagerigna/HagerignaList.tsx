import React, {useEffect, useState} from 'react';
import {FlatList, Text, View, TextInput, TouchableWithoutFeedback} from 'react-native';
import {useNavigation} from '@react-navigation/native';
import {NativeStackNavigationProp} from '@react-navigation/native-stack';
import {useSelector} from 'react-redux';
import {RootState} from '../../store';
import {RootStackParamList} from '../../../App';
import hymnalData from './HagerignaData.json';
import { MusicalNoteIcon, PlayIcon, HashtagIcon, MagnifyingGlassIcon, XMarkIcon } from 'react-native-heroicons/outline';
import NumpadModal from './../NumpadModal';
import { getHeaderPaddingTop, getCardStyle } from '../../utils/platformUtils';
import tw from '../../../tailwind';

type Song = {
  title: string;
  lyrics: string;
  singer: string;
};

type SongListNavigationProp = NativeStackNavigationProp<RootStackParamList, 'HagerignaList'>;

const HagerignaList = () => {
  const [songs, setSongs] = useState<Song[]>([]);
  const [filteredSongs, setFilteredSongs] = useState<Song[]>([]);
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
    const loadFile = () => {
      try {
        const newTitles = hymnalData.resources.array[2].item; // Titles array
        const newSinger = hymnalData.resources.array[0].item; // Singer array
        const newSongs = hymnalData.resources.array[1].item; // Lyrics array

        const combinedSongs = newTitles.map((title: string, index: number) => ({
          title,
          lyrics: newSongs[index],
          singer: newSinger[index],
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
        song.singer.toLowerCase().includes(searchQuery.toLowerCase()) ||
        song.lyrics.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredSongs(filtered);
    }
  }, [searchQuery, songs]);

  const handleSelect = (song: Song, _index: number) => {
    // Find the original index in the full songs array
    const originalIndex = songs.findIndex(s => s.title === song.title && s.lyrics === song.lyrics && s.singer === song.singer);
    navigation.navigate('HagerignaDetail', {song, songNumber: originalIndex + 1});
  };

  const handleJumpToSong = (songNumber: number) => {
    const songIndex = songNumber - 1;
    const song = songs[songIndex];
    navigation.navigate('HagerignaDetail', {song, songNumber});
  };

  const handlePlay = (song: Song, _index: number) => {
    console.log('Playing song:', song.title);
  };

  const dynamicStyles = {
    container: tw`flex-1 ${isDarkMode ? 'bg-dark-primary-10' : 'bg-primary-1'}`,
    songItem: [
      tw`flex-row items-center rounded-xl mt-2 ${isDarkMode ? 'bg-dark-primary-8' : 'bg-primary-3'}`,
      getCardStyle()
    ],
    songNumber: tw`text-2xl font-nokia-bold mr-4 text-accent-6 min-w-[35px]`,
    songTitle: tw`text-2xl font-nokia-bold leading-6 ${isDarkMode ? 'text-dark-secondary-1' : 'text-secondary-10'}`,
    singerName: tw`font-nokia-bold ${isDarkMode ? 'text-primary-7' : 'text-primary-10'}`
  };

  const renderSongItem = ({item, index}: {item: Song; index: number}) => {
    // Find the original song number
    const originalIndex = songs.findIndex(s => s.title === item.title && s.lyrics === item.lyrics && s.singer === item.singer);
    const songNumber = originalIndex + 1;
    
    return (
      <View style={dynamicStyles.songItem}>
        <TouchableWithoutFeedback onPress={() => handleSelect(item, index)}>
          <View style={tw`flex-1 p-4`}>
            <View style={tw`flex-row items-center`}>
              <Text style={[dynamicStyles.songNumber, tw`ml-3 font-nokia-bold`]}>
                {songNumber}
              </Text>
              <View style={tw`ml-3 flex-1`}>
                <Text style={[dynamicStyles.songTitle, tw`font-nokia-bold`]} numberOfLines={2}>
                  {item.title}
                </Text>
                <Text style={[dynamicStyles.singerName, tw`mt-1 font-nokia-bold`]} numberOfLines={1}>
                  {item.singer}
                </Text>
              </View>
            </View>
          </View>
        </TouchableWithoutFeedback>
        
        <TouchableWithoutFeedback onPress={() => handlePlay(item, index)}>
          <View style={tw`p-4 justify-center`}>
            <PlayIcon size={24} color="#EA9215" />
          </View>
        </TouchableWithoutFeedback>
      </View>
    );
  };

  const headerPaddingTop = getHeaderPaddingTop();

  return (
    <View style={dynamicStyles.container}>
      <View style={[
        tw`flex-row items-center justify-between p-5 pb-4`,
        { paddingTop: headerPaddingTop }
      ]}>
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
            placeholder="Search titles, singers, or lyrics..."
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
          tw`absolute bottom-28 right-5 bg-accent-6 rounded-full p-4`,
          getCardStyle()
        ]}>
          <HashtagIcon size={24} color="#FDFDFD" />
        </View>
      </TouchableWithoutFeedback>

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