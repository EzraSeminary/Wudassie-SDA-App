import React from 'react';
import {View, Text, StyleSheet} from 'react-native';
import {RouteProp, useRoute} from '@react-navigation/native';
import {RootStackParamList} from '../../App';
import tw from './../../tailwind';

type SongDetailRouteProp = RouteProp<RootStackParamList, 'SongDetail'>;

const SongDetail = () => {
  const route = useRoute<SongDetailRouteProp>();
  const {song, songNumber} = route.params;

  return (
    <View style={styles.container}>
      <Text style={tw`text-4xl font-nokia-bold text-secondary-6`}>
        {songNumber}. {song.title}
      </Text>
      <View style={tw`mt-8`}>
      {song.lyrics.split('\\n').map((line, index) => (
        <Text key={index} style={tw`font-nokia-bold text-accent-7 text-xl`}>
          {line}
        </Text>
      ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  lyrics: {
    fontSize: 16,
    marginTop: 10,
  },
});

export default SongDetail;