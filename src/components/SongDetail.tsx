import React, { useState, useEffect } from 'react';
import { View, Text, TouchableWithoutFeedback, ScrollView, Platform, TouchableOpacity } from 'react-native';
import { RouteProp, useRoute, useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useSelector, useDispatch } from 'react-redux';
import { SafeAreaView } from 'react-native-safe-area-context';
import { RootState, AppDispatch } from '../store';
import { RootStackParamList } from '../../App';
import { ArrowLeftIcon, ArrowsPointingOutIcon, AdjustmentsHorizontalIcon, HashtagIcon } from 'react-native-heroicons/outline';
import { HeartIcon as SolidHeartIcon } from 'react-native-heroicons/solid';
import { HeartIcon as OutlineHeartIcon } from 'react-native-heroicons/outline';
import { loadFavorites, toggleFavorite } from '../store/favoritesSlice';
import FontSizePopup from './CustomBottomSheet';
import NumpadModal from './NumpadModal';
import FullScreenVerse from './FullScreenVerse';
import { getCardStyle } from '../utils/platformUtils';
import tw from '../../tailwind';
import hymnalData from './SDA_Hymnal.json';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { runOnJS } from 'react-native-reanimated';

type SongDetailRouteProp = RouteProp<RootStackParamList, 'SongDetail'>;
type SongDetailNavigationProp = NativeStackNavigationProp<RootStackParamList, 'SongDetail'>;

const SongDetail = () => {
  const route = useRoute<SongDetailRouteProp>();
  const navigation = useNavigation<SongDetailNavigationProp>();
  const { song, songNumber } = route.params;
  const fontSize = useSelector((state: RootState) => state.fontSize.fontSize);
  const isDarkMode = useSelector((state: RootState) => state.theme.isDarkMode);
  const { favoriteIds = [], isLoaded: favoritesLoaded = false } = useSelector((state: RootState) => state.favorites) || {};
  const dispatch: AppDispatch = useDispatch();
  
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [isFontSizePopupVisible, setIsFontSizePopupVisible] = useState(false);
  const [isNumpadVisible, setIsNumpadVisible] = useState(false);

  // Generate consistent ID for hymnal songs
  const hymnalSongId = `hymnal-${songNumber}`;
  const isFavorite = favoriteIds.includes(hymnalSongId);

  useEffect(() => {
    if (!favoritesLoaded) {
      dispatch(loadFavorites());
    }
  }, [dispatch, favoritesLoaded]);

  const handleOpenPopup = () => setIsFontSizePopupVisible(true);
  const handleClosePopup = () => setIsFontSizePopupVisible(false);
  const handleOpenNumpad = () => setIsNumpadVisible(true);
  const handleCloseNumpad = () => setIsNumpadVisible(false);

  const handleToggleFavorite = () => {
    dispatch(toggleFavorite(hymnalSongId, song.title));
  };

  // Get total songs count
  const totalSongs = hymnalData.resources.array[0].item.length;

  const handleBackPress = () => {
    navigation.navigate('SongList');
  };

  const handleGoToSong = (songNum: number) => {
    setIsNumpadVisible(false);
    const songIndex = songNum - 1;
    const newTitle = hymnalData.resources.array[0].item[songIndex];
    const newLyrics = hymnalData.resources.array[2].item[songIndex];
    
    const newSong = {
      title: newTitle,
      lyrics: newLyrics,
    };
    
    navigation.navigate('SongDetail', { song: newSong, songNumber: songNum });
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
    handleGoToSong(newSongNum);
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
      { 
        fontSize: fontSize + 6,
        lineHeight: 32
      }
    ],
    lyrics: [
      tw`font-nokia-bold mb-2 ${isDarkMode ? 'text-primary-6' : 'text-secondary-6'}`,
      { 
        fontSize,
        lineHeight: 28
      }
    ],
    header: tw`flex-row justify-between items-center p-5 border-b font-nokia-bold ${isDarkMode ? 'border-dark-primary-8' : 'border-primary-6'}`
  };

  return (
    <GestureDetector gesture={panGesture}>
      <View style={tw`flex-1 ${isDarkMode ? 'bg-dark-primary-10' : 'bg-primary-1'}`}>
        <SafeAreaView 
          style={tw`flex-1`}
          edges={Platform.select({
            ios: ['top'],
            android: ['top']
          })}
        >
          <View style={[dynamicStyles.header, tw`pt-4`]}>
            <TouchableWithoutFeedback onPress={handleBackPress}>
              <View style={tw`p-2`}>
                <ArrowLeftIcon size={24} color="#EA9215" />
              </View>
            </TouchableWithoutFeedback>
            
            <View style={tw`flex-row items-center flex-1 mx-3`}>
              <Text style={[dynamicStyles.title, tw`flex-1 font-nokia-bold`]} numberOfLines={2}>
                {songNumber}. {song.title}
              </Text>
            </View>
            
            {/* Favorite Button */}
            <TouchableOpacity onPress={handleToggleFavorite} style={tw`p-2 mr-2`}>
              {isFavorite ? (
                <SolidHeartIcon size={24} color={tw.color('red-500')} />
              ) : (
                <OutlineHeartIcon size={24} color={isDarkMode ? '#9CA3AF' : '#6B7280'} />
              )}
            </TouchableOpacity>
            
            {/* Fullscreen Button */}
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
            contentContainerStyle={Platform.select({
              ios: { 
                padding: 20, 
                paddingBottom: 120 
              },
              android: { 
                padding: 20, 
                paddingBottom: 120 
              }
            })}
          >
            {song.lyrics.split('\\n').map((line, index) => (
              <Text key={index} style={dynamicStyles.lyrics}>
                {line}
              </Text>
            ))}
          </ScrollView>

          {/* Floating Numpad Button */}
          <TouchableWithoutFeedback onPress={handleOpenNumpad}>
            <View style={[
              tw`absolute right-5 bg-accent-6 rounded-full p-4 shadow-lg`,
              Platform.select({
                ios: {
                  bottom: 40,
                  shadowColor: '#000',
                  shadowOffset: { width: 0, height: 4 },
                  shadowOpacity: 0.3,
                  shadowRadius: 4,
                },
                android: {
                  bottom: 100,
                  elevation: 8,
                }
              }),
              getCardStyle()
            ]}>
              <HashtagIcon size={24} color="#FDFDFD" />
            </View>
          </TouchableWithoutFeedback>
        </SafeAreaView>

        {/* Full Screen Verse Component */}
        <FullScreenVerse
          song={song}
          isVisible={isFullScreen}
          onClose={() => setIsFullScreen(false)}
        />

        <FontSizePopup visible={isFontSizePopupVisible} onClose={handleClosePopup} />
        <NumpadModal 
          visible={isNumpadVisible}
          onClose={handleCloseNumpad}
          onJumpToSong={handleGoToSong}
          maxSongs={totalSongs}
          title="Hymnal"
        />
      </View>
    </GestureDetector>
  );
};

export default SongDetail;