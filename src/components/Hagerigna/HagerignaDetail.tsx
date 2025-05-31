import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { RouteProp, useRoute, useNavigation } from '@react-navigation/native';
import { useSelector } from 'react-redux';
import { RootState } from '../../store';
import { RootStackParamList } from '../../../App';
import { ArrowLeftIcon, ArrowsPointingOutIcon, ArrowsPointingInIcon, AdjustmentsHorizontalIcon, HashtagIcon } from 'react-native-heroicons/outline';
import FontSizePopup from './../CustomBottomSheet';
import NumpadModal from './../NumpadModal';
import tw from '../../../tailwind';
import { PanGestureHandler, State } from 'react-native-gesture-handler';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import hagerignaData from './HagerignaData.json';

type SongDetailRouteProp = RouteProp<RootStackParamList, 'HagerignaDetail'>;
type HagerignaDetailNavigationProp = NativeStackNavigationProp<RootStackParamList, 'HagerignaDetail'>;

const HagerignaDetail = () => {
  const route = useRoute<SongDetailRouteProp>();
  const navigation = useNavigation<HagerignaDetailNavigationProp>();
  const { song, songNumber } = route.params;
  const fontSize = useSelector((state: RootState) => state.fontSize.fontSize);
  const isDarkMode = useSelector((state: RootState) => state.theme.isDarkMode);
  const [isPopupVisible, setPopupVisible] = useState(false);
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [isNumpadVisible, setNumpadVisible] = useState(false);

  const handleOpenPopup = () => setPopupVisible(true);
  const handleClosePopup = () => setPopupVisible(false);
  const toggleFullScreen = () => setIsFullScreen(!isFullScreen);
  const handleOpenNumpad = () => setNumpadVisible(true);
  const handleCloseNumpad = () => setNumpadVisible(false);

  // Get total songs count
  const totalSongs = hagerignaData.resources.array[2].item.length;

  const handleBackPress = () => {
    navigation.navigate('HagerignaList');
  };

  const handleJumpToSong = (songNumber: number) => {
    const newSongIndex = songNumber - 1;
    const newTitle = hagerignaData.resources.array[2].item[newSongIndex]; // Titles array
    const newSinger = hagerignaData.resources.array[0].item[newSongIndex]; // Singer array
    const newLyrics = hagerignaData.resources.array[1].item[newSongIndex]; // Lyrics array
    
    const newSong = {
      title: newTitle,
      lyrics: newLyrics,
      singer: newSinger,
    };

    navigation.setParams({
      song: newSong,
      songNumber: songNumber,
    });
  };

  const navigateToSong = (direction: 'next' | 'previous') => {
    let newSongNumber = songNumber;
    
    if (direction === 'next' && songNumber < totalSongs) {
      newSongNumber = songNumber + 1;
    } else if (direction === 'previous' && songNumber > 1) {
      newSongNumber = songNumber - 1;
    } else {
      return; // Don't navigate if at boundaries
    }

    const newSongIndex = newSongNumber - 1;
    const newTitle = hagerignaData.resources.array[2].item[newSongIndex]; // Titles array
    const newSinger = hagerignaData.resources.array[0].item[newSongIndex]; // Singer array
    const newLyrics = hagerignaData.resources.array[1].item[newSongIndex]; // Lyrics array
    
    const newSong = {
      title: newTitle,
      lyrics: newLyrics,
      singer: newSinger,
    };

    navigation.setParams({
      song: newSong,
      songNumber: newSongNumber,
    });
  };

  const onSwipeGesture = (event: any) => {
    if (event.nativeEvent.state === State.END) {
      const { translationX } = event.nativeEvent;
      
      if (translationX > 50) {
        // Swiped right - go to previous song
        navigateToSong('previous');
      } else if (translationX < -50) {
        // Swiped left - go to next song
        navigateToSong('next');
      }
    }
  };

  const dynamicStyles = {
    container: tw`flex-1 pt-4 ${isDarkMode ? 'bg-dark-primary-10' : 'bg-primary-1'}`,
    title: [
      tw`font-nokia-bold ${isDarkMode ? 'text-dark-secondary-1' : 'text-secondary-10'}`,
      { 
        fontSize: fontSize + 6,
        lineHeight: 32
      }
    ],
    singer: tw`font-nokia-bold text-accent-6 text-sm`,
    lyrics: [
      tw`font-nokia-bold mb-2 ${isDarkMode ? 'text-primary-6' : 'text-secondary-6'}`,
      { 
        fontSize,
        lineHeight: 28
      }
    ],
    header: tw`flex-row justify-between items-center p-5 border-b pt-12 font-nokia-bold ${isDarkMode ? 'border-dark-primary-8' : 'border-primary-6'}`
  };

  if (isFullScreen) {
    return (
      <View style={[dynamicStyles.container, tw`pt-12`]}>
        <View style={tw`flex-row justify-between items-center absolute top-12 left-5 right-5 z-10`}>
          <TouchableOpacity 
            style={tw`p-2`}
            onPress={toggleFullScreen}
          >
            <ArrowsPointingInIcon size={24} color={isDarkMode ? '#FDFDFD' : '#1A2024'} />
          </TouchableOpacity>
          <TouchableOpacity 
            style={tw`p-2`}
            onPress={handleOpenPopup}
          >
            <AdjustmentsHorizontalIcon size={24} color={isDarkMode ? '#FDFDFD' : '#1A2024'} />
          </TouchableOpacity>
        </View>
        <PanGestureHandler onHandlerStateChange={onSwipeGesture}>
          <ScrollView 
            contentContainerStyle={tw`p-5 pt-16`}
            showsVerticalScrollIndicator={false}
          >
            <Text style={[dynamicStyles.title, tw`text-center mb-2 font-nokia-bold`]}>
              {songNumber}. {song.title}
            </Text>
            {song.singer && (
              <Text style={[dynamicStyles.singer, tw`text-center mb-8 font-nokia-bold`]}>
                {song.singer}
              </Text>
            )}
            <View style={tw`px-2`}>
              {song.lyrics.split('\\n').map((line, index) => (
                <Text key={index} style={[dynamicStyles.lyrics, tw`text-center mb-3 font-nokia-bold`, { lineHeight: 32 }]}>
                  {line}
                </Text>
              ))}
            </View>
          </ScrollView>
        </PanGestureHandler>
        <FontSizePopup visible={isPopupVisible} onClose={handleClosePopup} />
        <NumpadModal 
          visible={isNumpadVisible}
          onClose={handleCloseNumpad}
          onJumpToSong={handleJumpToSong}
          maxSongs={totalSongs}
          title="Hagerigna"
        />
      </View>
    );
  }

  return (
    <View style={dynamicStyles.container}>
      <View style={dynamicStyles.header}>
        <TouchableOpacity 
          onPress={handleBackPress}
          style={tw`p-2`}
        >
          <ArrowLeftIcon size={24} color="#EA9215" />
        </TouchableOpacity>
        
        <View style={tw`flex-row items-center flex-1 mx-3`}>
          <View style={tw`flex-1`}>
            <Text style={[dynamicStyles.title, tw`font-nokia-bold`]} numberOfLines={2}>
              {songNumber}. {song.title}
            </Text>
            {song.singer && (
              <Text style={[dynamicStyles.singer, tw`mt-1 font-nokia-bold`]}>
                {song.singer}
              </Text>
            )}
          </View>
        </View>
        
        <TouchableOpacity onPress={toggleFullScreen} style={tw`p-2 mr-2`}>
          <ArrowsPointingOutIcon size={20} color={isDarkMode ? '#9CA3AF' : '#6B7280'} />
        </TouchableOpacity>
        
        <TouchableOpacity 
          onPress={handleOpenPopup}
          style={tw`p-2`}
        >
          <AdjustmentsHorizontalIcon size={24} color={isDarkMode ? '#9CA3AF' : '#6B7280'} />
        </TouchableOpacity>
      </View>

      <PanGestureHandler onHandlerStateChange={onSwipeGesture}>
        <ScrollView 
          style={tw`flex-1`}
          showsVerticalScrollIndicator={false}
        >
          <View style={tw`p-5`}>

            {song.lyrics.split('\\n').map((line, index) => (
              <Text key={index} style={dynamicStyles.lyrics}>
                {line}
              </Text>
            ))}
          </View>
        </ScrollView>
      </PanGestureHandler>

      {/* Floating Numpad Button */}
      <TouchableOpacity 
        style={tw`absolute bottom-28 right-5 bg-accent-6 rounded-full p-4 shadow-lg`}
        onPress={handleOpenNumpad}
      >
        <HashtagIcon size={24} color="#FDFDFD" />
      </TouchableOpacity>

      <FontSizePopup visible={isPopupVisible} onClose={handleClosePopup} />
      <NumpadModal 
        visible={isNumpadVisible}
        onClose={handleCloseNumpad}
        onJumpToSong={handleJumpToSong}
        maxSongs={totalSongs}
        title="Hagerigna"
      />
    </View>
  );
};

export default HagerignaDetail;