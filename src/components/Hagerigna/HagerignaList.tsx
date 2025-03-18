import React, {useEffect, useState} from 'react';
import {FlatList, Text, TouchableOpacity, View, StyleSheet} from 'react-native';
import {useNavigation} from '@react-navigation/native';
import {NativeStackNavigationProp} from '@react-navigation/native-stack';
import {RootStackParamList} from '../../../App';
import hymnalData from './HagerignaData.json';
import tw from './../../../tailwind';

type Song = {
  title: string;
  lyrics: string;
  singer: string;
};


type SongListNavigationProp = NativeStackNavigationProp<RootStackParamList, 'HagerignaList'>;

const HagerignaList = () => {
  const [songs, setSongs] = useState<Song[]>([]);
  const navigation = useNavigation<SongListNavigationProp>();

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

  return (
    <View style={styles.container}>
      <FlatList
        data={songs}
        keyExtractor={item => item.title}
        renderItem={({item, index}) => (
          <TouchableOpacity onPress={() => handleSelect(item, index)}
          style={tw`flex-row items-center border-b border-accent-7 p-4`}>
            <Text style={tw`text-3xl font-nokia-bold text-secondary-6`}> {index + 1} - </Text>
            <View style={tw`pl-2`}>
                <Text style={tw` text-2xl font-nokia-bold text-secondary-6`}>
                {item.title}
                </Text>
                <Text style={tw` text-md font-nokia-bold text-accent-7`}>
                {item.singer}
                </Text>
            </View>
          </TouchableOpacity>
        )}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  title: {
    fontSize: 18,
    padding: 10,
  },
});

export default HagerignaList;