import React, {useEffect, useState} from 'react';
import {FlatList, Text, TouchableOpacity, View} from 'react-native';
import {useNavigation} from '@react-navigation/native';
import {NativeStackNavigationProp} from '@react-navigation/native-stack';
import {useSelector} from 'react-redux';
import {RootState} from '../../store';
import {RootStackParamList} from '../../../App';
import hymnalData from './HagerignaData.json';
import { MusicalNoteIcon, PlayIcon, HashtagIcon } from 'react-native-heroicons/outline';
import NumpadModal from './../NumpadModal';
import tw from '../../../tailwind';

type Song = {
  title: string;
  lyrics: string;
  singer: string;
};

type SongListNavigationProp = NativeStackNavigationProp<RootStackParamList, 'HagerignaList'>;

const HagerignaList = () => {
  const [songs, setSongs] = useState<Song[]>([]);
  const [isNumpadVisible, setNumpadVisible] = useState(false);
  const navigation = useNavigation<SongListNavigationProp>();
  const isDarkMode = useSelector((state: RootState) => state.theme.isDarkMode);

  const handleOpenNumpad = () => setNumpadVisible(true);
  const handleCloseNumpad = () => setNumpadVisible(false);

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
        console.log('Parsed JSON successfully');
      } catch (err) {
        console.error('Error reading JSON file:', err);
      }
    };

    loadFile();
  }, []);

  const handleSelect = (song: Song, index: number) => {
    navigation.navigate('HagerignaDetail', {song, songNumber: index + 1});
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
    songItem: tw`flex-row items-center rounded-xl shadow-sm mt-2 ${isDarkMode ? 'bg-dark-primary-8' : 'bg-primary-3'}`,
    songNumber: tw`text-2xl font-nokia-bold mr-4 text-accent-6 min-w-[35px]`,
    songTitle: tw`text-2xl font-nokia-bold leading-6 ${isDarkMode ? 'text-dark-secondary-1' : 'text-secondary-10'}`,
    singerName: tw`font-nokia-bold ${isDarkMode ? 'text-primary-7' : 'text-primary-10'}`
  };

  const renderSongItem = ({item, index}: {item: Song; index: number}) => (
    <View style={dynamicStyles.songItem}>
      <TouchableOpacity
        style={tw`flex-1 p-4`}
        onPress={() => handleSelect(item, index)}
      >
        <View style={tw`flex-row items-center`}>
          {/* <MusicalNoteIcon size={20} color="#EA9215" /> */}
          <Text style={[dynamicStyles.songNumber, tw`ml-3 font-nokia-bold`]}>
            {index + 1}
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
      </TouchableOpacity>
      
      <TouchableOpacity 
        style={tw`p-4 justify-center`}
        onPress={() => handlePlay(item, index)}
      >
        <PlayIcon size={24} color="#EA9215" />
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={dynamicStyles.container}>
      <View style={tw`flex-row items-center p-5 pb-4 pt-12`}>
        <MusicalNoteIcon size={28} color="#EA9215" />
        <Text style={tw`text-2xl font-nokia-bold ml-3 ${isDarkMode ? 'text-dark-secondary-1' : 'text-secondary-10'}`}>
          Hagerigna Songs
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
        title="Hagerigna"
      />
    </View>
  );
};

export default HagerignaList;