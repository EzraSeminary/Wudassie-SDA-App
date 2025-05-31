import React, {useEffect, useState} from 'react';
import {FlatList, Text, TouchableOpacity, View} from 'react-native';
import {useNavigation} from '@react-navigation/native';
import {NativeStackNavigationProp} from '@react-navigation/native-stack';
import {useSelector} from 'react-redux';
import {RootState} from '../store';
import {RootStackParamList} from '../../App';
import hymnalData from './SDA_Hymnal.json';
import { BookOpenIcon, HashtagIcon } from 'react-native-heroicons/outline';
import NumpadModal from './NumpadModal';
import tw from '../../tailwind';

type Song = {
  title: string;
  lyrics: string;
};

type SongListNavigationProp = NativeStackNavigationProp<RootStackParamList, 'SongList'>;

const SongList = () => {
  const [songs, setSongs] = useState<Song[]>([]);
  const [isNumpadVisible, setNumpadVisible] = useState(false);
  const navigation = useNavigation<SongListNavigationProp>();
  const isDarkMode = useSelector((state: RootState) => state.theme.isDarkMode);

  const handleOpenNumpad = () => setNumpadVisible(true);
  const handleCloseNumpad = () => setNumpadVisible(false);

  useEffect(() => {
    const loadFile = () => {
      try {
        const newTitles = hymnalData.resources.array[0].item; // Titles array
        const newSongs = hymnalData.resources.array[2].item; // Lyrics array

        const combinedSongs = newTitles.map((title: string, index: number) => ({
          title,
          lyrics: newSongs[index],
        }));

        setSongs(combinedSongs);
        console.log('Parsed JSON successfully');
      } catch (err) {
        console.error('Error reading JSON file:', err);
      }
    };

    loadFile();
  }, []);

  const handleSelect = (song: Song, index: number) => {
    navigation.navigate('SongDetail', {song, songNumber: index + 1});
  };

  const handleJumpToSong = (songNumber: number) => {
    const songIndex = songNumber - 1;
    const song = songs[songIndex];
    navigation.navigate('SongDetail', {song, songNumber});
  };

  const renderSongItem = ({item, index}: {item: Song; index: number}) => (
    <View style={tw`flex-row items-center mb-3 rounded-xl shadow-sm ${isDarkMode ? 'bg-dark-primary-8' : 'bg-primary-3'}`}>
      <TouchableOpacity 
        style={tw`flex-1 p-4`}
        onPress={() => handleSelect(item, index)}
      >
        <View style={tw`flex-row items-center`}>
          {/* <BookOpenIcon size={20} color="#EA9215" /> */}
          <Text style={tw`text-lg font-nokia-bold text-2xl ml-3 text-accent-6 min-w-[35px]`}>
            {index + 1}
          </Text>
          <Text style={tw`text-base font-nokia-bold flex-1 text-2xl ml-3 leading-6 ${isDarkMode ? 'text-dark-secondary-1' : 'text-secondary-10'}`} numberOfLines={2}>
            {item.title}
          </Text>
        </View>
      </TouchableOpacity>
      
      {/* <TouchableOpacity 
        style={tw`p-4 justify-center`}
        onPress={() => handlePlay(item, index)}
      >
        <PlayIcon size={24} color="#EA9215" />
      </TouchableOpacity> */}
    </View>
  );

  return (
    <View style={tw`flex-1 ${isDarkMode ? 'bg-dark-primary-10' : 'bg-primary-1'}`}>
      <View style={tw`flex-row items-center p-5 pb-4 pt-12`}>
        <BookOpenIcon size={28} color="#EA9215" />
        <Text style={tw`text-2xl font-nokia-bold ml-3 ${isDarkMode ? 'text-dark-secondary-1' : 'text-secondary-10'}`}>
          Hymnal Songs
        </Text>
      </View>
      <FlatList
        data={songs}
        keyExtractor={(item, index) => `${item.title}-${index}`}
        renderItem={renderSongItem}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={tw`px-4 pb-24`}
      />

      {/* Floating Numpad Button */}
      <TouchableOpacity 
        style={tw`absolute bottom-28 right-5 bg-accent-6 rounded-full p-4 shadow-lg`}
        onPress={handleOpenNumpad}
      >
        <HashtagIcon size={24} color="#FDFDFD" />
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