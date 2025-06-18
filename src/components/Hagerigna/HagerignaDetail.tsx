import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableWithoutFeedback, SafeAreaView } from 'react-native';
import { RouteProp, useRoute, useNavigation } from '@react-navigation/native';
import { useSelector } from 'react-redux';
import { RootState } from '../../store';
import { RootStackParamList } from '../../../App';
import { ArrowLeftIcon, ArrowsPointingOutIcon, AdjustmentsHorizontalIcon, HashtagIcon } from 'react-native-heroicons/outline';
import FontSizePopup from './../CustomBottomSheet';
import NumpadModal from './../NumpadModal';
import FullScreenVerse from './../FullScreenVerse';
import { getCardStyle } from '../../utils/platformUtils';
import tw from '../../../tailwind';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { runOnJS } from 'react-native-reanimated';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import hagerignaData from './HagerignaData.json';
import { HagerignaHymn } from '../../services/hymnalService';
import Orientation from 'react-native-orientation-locker';

type SongDetailRouteProp = RouteProp<RootStackParamList, 'HagerignaDetail'>;
type HagerignaDetailNavigationProp = NativeStackNavigationProp<RootStackParamList, 'HagerignaDetail'>;

const HagerignaDetail = () => {
  const route = useRoute<SongDetailRouteProp>();
  const navigation = useNavigation<HagerignaDetailNavigationProp>();
  const { song: initialSong, songNumber } = route.params;
  const fontSize = useSelector((state: RootState) => state.fontSize.fontSize);
  const isDarkMode = useSelector((state: RootState) => state.theme.isDarkMode);
  const [isPopupVisible, setPopupVisible] = useState(false);
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [isNumpadVisible, setNumpadVisible] = useState(false);
  const [song, setSong] = useState<HagerignaHymn>(initialSong);

  const handleOpenPopup = () => setPopupVisible(true);
  const handleClosePopup = () => setPopupVisible(false);
  const handleOpenNumpad = () => setNumpadVisible(true);
  const handleCloseNumpad = () => setNumpadVisible(false);

  useEffect(() => {
    setSong(initialSong);
  }, [initialSong]);

  useEffect(() => {
    // Lock to portrait when not in fullscreen
    if (!isFullScreen) {
      Orientation.lockToPortrait();
    }
    // Orientation is handled by FullScreenVerse when it's visible
  }, [isFullScreen]);

  const totalSongs = hagerignaData.resources.array[2].item.length;

  const handleBackPress = () => {
    navigation.navigate('HagerignaList');
  };

  const handleJumpToSong = (songNum: number) => {
    const newSongIndex = songNum - 1;
    if (newSongIndex < 0 || newSongIndex >= totalSongs) return;

    const newTitle = hagerignaData.resources.array[2].item[newSongIndex];
    const newArtist = hagerignaData.resources.array[0].item[newSongIndex];
    const newLyrics = hagerignaData.resources.array[1].item[newSongIndex];
    
    const newSongData: HagerignaHymn = {
      id: `hagerigna-${newSongIndex}`,
      title: newTitle,
      song: newLyrics,
      artist: newArtist,
    };

    navigation.setParams({
      song: newSongData,
      songNumber: songNum,
    });
  };

  const navigateToSong = (direction: 'next' | 'previous') => {
    let newSongNum = songNumber;
    if (direction === 'next' && songNumber < totalSongs) {
      newSongNum = songNumber + 1;
    } else if (direction === 'previous' && songNumber > 1) {
      newSongNum = songNumber - 1;
    } else {
      return;
    }
    handleJumpToSong(newSongNum);
  };

  const handleSwipeNavigation = (direction: 'next' | 'previous') => {
    navigateToSong(direction);
  };

  const panGesture = Gesture.Pan()
    .minDistance(50)
    .onEnd((event) => {
      const { translationX, velocityX } = event;
      if (Math.abs(translationX) > 100 && Math.abs(velocityX) > 500) {
        if (translationX > 0) {
          runOnJS(handleSwipeNavigation)('previous');
        } else {
          runOnJS(handleSwipeNavigation)('next');
        }
      }
    })
    .simultaneousWithExternalGesture();

  const dynamicStyles = {
    container: tw`flex-1 ${isDarkMode ? 'bg-dark-primary-10' : 'bg-primary-1'}`,
    title: [
      tw`font-nokia-bold ${isDarkMode ? 'text-dark-secondary-1' : 'text-secondary-10'}`,
      { fontSize: fontSize + 6, lineHeight: 32 }
    ],
    artist: tw`font-nokia-bold text-accent-6 text-sm`,
    lyrics: [
      tw`font-nokia-bold mb-2 ${isDarkMode ? 'text-primary-6' : 'text-secondary-6'}`,
      { fontSize, lineHeight: 28 }
    ],
    header: tw`flex-row justify-between items-center p-5 border-b font-nokia-bold ${isDarkMode ? 'border-dark-primary-8' : 'border-primary-6'}`
  };

  if (!song) {
    return (
      <View style={dynamicStyles.container}>
        <Text style={{color: isDarkMode ? 'white' : 'black'}}>Loading...</Text>
      </View>
    );
  }

  return (
    <GestureDetector gesture={panGesture}>
      <View style={dynamicStyles.container}>
        <SafeAreaView style={tw`flex-1`}>
          <View style={dynamicStyles.header}>
            <TouchableWithoutFeedback onPress={handleBackPress}>
              <View style={tw`p-2`}>
                <ArrowLeftIcon size={24} color="#EA9215" />
              </View>
            </TouchableWithoutFeedback>
            
            <View style={tw`flex-row items-center flex-1 mx-3`}>
              <View style={tw`flex-1`}>
                <Text style={[ tw`font-nokia-bold text-3xl ${isDarkMode ? 'text-dark-secondary-1' : 'text-secondary-10'}`]} numberOfLines={2}>
                  {songNumber}. {song.title}
                </Text>
                {song.artist && (
                  <Text style={[dynamicStyles.artist, tw`mt-1 font-nokia-bold`]}>
                    {song.artist}
                  </Text>
                )}
              </View>
            </View>
            
            <TouchableWithoutFeedback onPress={() => setIsFullScreen(true)}>
              <View style={tw`p-2 mr-2`}>
                <ArrowsPointingOutIcon size={20} color={isDarkMode ? '#9CA3AF' : '#6B7280'} />
              </View>
            </TouchableWithoutFeedback>
            
            <TouchableWithoutFeedback onPress={handleOpenPopup}>
              <View style={tw`p-2`}>
                <AdjustmentsHorizontalIcon size={24} color={isDarkMode ? '#9CA3AF' : '#6B7280'} />
              </View>
            </TouchableWithoutFeedback>
          </View>

          <ScrollView 
            style={tw`flex-1`}
            showsVerticalScrollIndicator={false}
            scrollEnabled={true}
            bounces={true}
          >
            <View style={tw`p-5`}>
              {song.song.split('\\n').map((line: string, index: number) => (
                <Text key={index} style={dynamicStyles.lyrics}>
                  {line}
                </Text>
              ))}
            </View>
          </ScrollView>

          <TouchableWithoutFeedback onPress={handleOpenNumpad}>
            <View style={[
              tw`absolute bottom-10 right-5 bg-accent-6 rounded-full p-4`,
              getCardStyle()
            ]}>
              <HashtagIcon size={24} color="#FDFDFD" />
            </View>
          </TouchableWithoutFeedback>
        </SafeAreaView>

        <FontSizePopup visible={isPopupVisible} onClose={handleClosePopup} />
        <NumpadModal 
          visible={isNumpadVisible}
          onClose={handleCloseNumpad}
          onJumpToSong={handleJumpToSong}
          maxSongs={totalSongs}
          title="Hagerigna"
        />

        <FullScreenVerse
          song={{
            title: song.title,
            lyrics: song.song,
            singer: song.artist
          }}
          isVisible={isFullScreen}
          onClose={() => setIsFullScreen(false)}
        />
      </View>
    </GestureDetector>
  );
};

export default HagerignaDetail;