import React, {useEffect, useState} from 'react';
import {FlatList, Text, TouchableOpacity, View, StyleSheet} from 'react-native';
import {useNavigation} from '@react-navigation/native';
import {NativeStackNavigationProp} from '@react-navigation/native-stack';
import {RootStackParamList} from '../../App';
import hymnalData from './SDA_Hymnal.json';
import tw from './../../tailwind';

type Song = {
  title: string;
  lyrics: string;
};

type SongListNavigationProp = NativeStackNavigationProp<RootStackParamList, 'SongList'>;

const SongList = () => {
  const [songs, setSongs] = useState<Song[]>([]);
  const navigation = useNavigation<SongListNavigationProp>();

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

  return (
    <View style={styles.container}>
      <FlatList
        data={songs}
        keyExtractor={item => item.title}
        renderItem={({item, index}) => (
          <TouchableOpacity onPress={() => handleSelect(item, index)}>
            <Text style={tw` text-2xl font-nokia-bold border-b border-accent-7 p-4`}>
              {index + 1} - {item.title}
            </Text>
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

export default SongList;