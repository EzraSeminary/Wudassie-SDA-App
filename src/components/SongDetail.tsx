import React, { useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { RouteProp, useRoute } from '@react-navigation/native';
import { useSelector } from 'react-redux';
import { RootState } from '../store';
import { RootStackParamList } from '../../App';
import tw from './../../tailwind';
// import CustomBottomSheet from './CustomBottomSheet';
import Icon from 'react-native-vector-icons/FontAwesome';

type SongDetailRouteProp = RouteProp<RootStackParamList, 'SongDetail'>;

const SongDetail = () => {
  // const sheetRef = useRef<BottomSheet>(null);
  const route = useRoute<SongDetailRouteProp>();
  const { song, songNumber } = route.params;
  const fontSize = useSelector((state: RootState) => state.fontSize.fontSize);

  return (
    <View style={styles.container}>
      <Text style={[tw`text-4xl font-nokia-bold text-secondary-6`, { fontSize: fontSize + 6 }]}>
        {songNumber}. {song.title}
      </Text>
      <View style={tw`mt-8`}>
        {song.lyrics.split('\\n').map((line, index) => (
          <Text key={index} style={[tw`font-nokia-bold text-accent-7`, { fontSize }]}>
            {line}
          </Text>
        ))}
      </View>
      {/* <TouchableOpacity style={styles.iconButton} onPress={() => sheetRef.current?.expand()}>
        <Icon name="font" size={30} color="black" />
      </TouchableOpacity> 
      <CustomBottomSheet ref={sheetRef} /> */}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
  iconButton: {
    position: 'absolute',
    bottom: 80,
    left: 20,
    zIndex: 10,
  },
});

export default SongDetail;