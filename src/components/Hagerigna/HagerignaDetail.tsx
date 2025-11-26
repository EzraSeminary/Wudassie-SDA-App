import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableWithoutFeedback, TouchableOpacity, Share } from 'react-native';
import { RouteProp, useRoute, useNavigation } from '@react-navigation/native';
import { useSelector, useDispatch } from 'react-redux';
import { RootState, AppDispatch } from '../../store';
import { RootStackParamList } from '../../../App';
import { ArrowLeftIcon, ArrowsPointingOutIcon, AdjustmentsHorizontalIcon, ArrowUpTrayIcon } from 'react-native-heroicons/outline';
import { HeartIcon as SolidHeartIcon, HashtagIcon as SolidHashtagIcon } from 'react-native-heroicons/solid';
import { HeartIcon as OutlineHeartIcon } from 'react-native-heroicons/outline';
import FontSizePopup from './../CustomBottomSheet';
import NumpadModal from './../NumpadModal';
import FullScreenVerse from './../FullScreenVerse';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import tw from '../../../tailwind';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { runOnJS } from 'react-native-reanimated';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import hagerignaData from './HagerignaData.json';
import { HagerignaHymn } from '../../services/hymnalService';
import { loadFavorites, toggleFavorite } from '../../store/favoritesSlice';
import Orientation from 'react-native-orientation-locker';
import { useTabBarHeight, useBottomContentPadding } from '../../utils/platformUtils';

type SongDetailRouteProp = RouteProp<RootStackParamList, 'HagerignaDetail'>;
type HagerignaDetailNavigationProp = NativeStackNavigationProp<RootStackParamList, 'HagerignaDetail'>;

const HagerignaDetail = () => {
  const { getFloatingButtonBottom } = useTabBarHeight();
  const contentBottomPadding = useBottomContentPadding(24);
  const insets = useSafeAreaInsets();
  const route = useRoute<SongDetailRouteProp>();
  const navigation = useNavigation<HagerignaDetailNavigationProp>();
  const { song: initialSong, songNumber } = route.params;

  const dispatch: AppDispatch = useDispatch();
  const fontSize = useSelector((state: RootState) => state.fontSize.fontSize);
  const isDarkMode = useSelector((state: RootState) => state.theme.isDarkMode);
  const { favoriteIds = [], isLoaded: favoritesLoaded = false } = useSelector((state: RootState) => state.favorites) || {};

  const [isPopupVisible, setPopupVisible] = useState(false);
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [isNumpadVisible, setNumpadVisible] = useState(false);
  const [song, setSong] = useState<HagerignaHymn>(initialSong);

  const handleOpenPopup = () => setPopupVisible(true);
  const handleClosePopup = () => setPopupVisible(false);
  const handleOpenNumpad = () => setNumpadVisible(true);
  const handleCloseNumpad = () => setNumpadVisible(false);

  useEffect(() => {
    if (!favoritesLoaded) {
      dispatch(loadFavorites());
    }
  }, [dispatch, favoritesLoaded]);

  // Ensure theme state is maintained when navigating
  useEffect(() => {
    console.log('HagerignaDetail - Current theme:', isDarkMode ? 'dark' : 'light');
  }, [isDarkMode]);

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

  const handleToggleFavorite = () => {
    dispatch(toggleFavorite(song.id, song.title));
  };

  // Clean lyrics by removing tags and formatting
  const cleanLyrics = (lyrics: string): string => {
    return lyrics
      .split('\\n')
      .map(line => line.trim())
      .filter(line => line.length > 0)
      .join('\n');
  };

  // Share song as plain text
  const handleShare = async () => {
    try {
      const cleanText = cleanLyrics(song.song);
      const shareText = song.artist 
        ? `${songNumber}. ${song.title}\n${song.artist}\n\n${cleanText}`
        : `${songNumber}. ${song.title}\n\n${cleanText}`;
      
      await Share.share({
        message: shareText,
        title: song.title,
      });
    } catch (error) {
      console.error('Error sharing song:', error);
    }
  };

  const totalSongs = hagerignaData.resources.array[2].item.length;

  const handleBackPress = () => {
    navigation.navigate('HagerignaList');
  };

  const handleJumpToSong = (songNum: number) => {
    const newSongIndex = songNum - 1;
    if (newSongIndex < 0 || newSongIndex >= totalSongs) return;

    setNumpadVisible(false);
    const newTitle = hagerignaData.resources.array[2].item[newSongIndex];
    const newArtist = hagerignaData.resources.array[0].item[newSongIndex];
    const newLyrics = hagerignaData.resources.array[1].item[newSongIndex];

    const newSongData: HagerignaHymn = {
      id: `hagerigna-${newSongIndex + 1}`,
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
    header: tw`flex-row justify-between items-center px-5 pb-5 border-b font-nokia-bold ${isDarkMode ? 'border-dark-primary-8' : 'border-primary-6'}`
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
        <SafeAreaView style={tw`flex-1`} edges={['top']}>
          {/* Fixed Header */}
          <View style={[dynamicStyles.header, { paddingTop: Math.max(insets.top + 8, 20) }]}>
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

            <TouchableOpacity onPress={handleToggleFavorite} style={tw`p-2`}>
              {favoriteIds.includes(song.id) ? (
                <SolidHeartIcon size={24} color={tw.color('red-500')} />
              ) : (
                <OutlineHeartIcon size={24} color={isDarkMode ? '#9CA3AF' : '#6B7280'} />
              )}
            </TouchableOpacity>

            {/* Share Button */}
            <TouchableOpacity onPress={handleShare} style={tw`p-2 mr-2`}>
              <ArrowUpTrayIcon size={20} color={isDarkMode ? '#9CA3AF' : '#6B7280'} />
            </TouchableOpacity>

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

          {/* Content */}
          <ScrollView
            style={tw`flex-1`}
            showsVerticalScrollIndicator={false}
            scrollEnabled={true}
            bounces={true}
            contentContainerStyle={{ paddingBottom: contentBottomPadding }}
          >
            <View style={tw`p-5`}>
              {song.song.split('\\n').map((line: string, index: number) => (
                <Text key={index} style={dynamicStyles.lyrics}>
                  {line}
                </Text>
              ))}
            </View>
          </ScrollView>
        </SafeAreaView>

        {/* Floating Circular Numpad Button */}
        <TouchableOpacity
          onPress={handleOpenNumpad}
        style={[
          tw`absolute right-5 w-16 h-16 bg-accent-6 rounded-full items-center justify-center`,
          { bottom: getFloatingButtonBottom() },
            {
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.3,
              shadowRadius: 8,
              elevation: 8,
            },
          ]}
          activeOpacity={0.8}
        >
          <SolidHashtagIcon size={28} color="#FDFDFD" />
        </TouchableOpacity>

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
