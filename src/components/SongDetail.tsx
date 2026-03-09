import React, { useMemo, useState, useEffect } from 'react';
import { View, Text, TouchableWithoutFeedback, ScrollView, TouchableOpacity, Share } from 'react-native';
import { RouteProp, useRoute, useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useSelector, useDispatch } from 'react-redux';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { RootState, AppDispatch } from '../store';
import { RootStackParamList } from '../../App';
import { ArrowLeftIcon, ArrowsPointingOutIcon, EllipsisVerticalIcon, ArrowUpTrayIcon, AdjustmentsHorizontalIcon } from 'react-native-heroicons/outline';
import { HeartIcon as SolidHeartIcon, HashtagIcon as SolidHashtagIcon } from 'react-native-heroicons/solid';
import { HeartIcon as OutlineHeartIcon } from 'react-native-heroicons/outline';
import { loadFavorites, toggleFavorite } from '../store/favoritesSlice';
import FontSizePopup from './CustomBottomSheet';
import NumpadModal from './NumpadModal';
import FullScreenVerse from './FullScreenVerse';
import MoreMenu from './MoreMenu';
import SheetMusicViewer from './SheetMusicViewer';
import AudioPlayer from './AudioPlayer';
import { hymnalService, SDAHymn } from '../services/hymnalService';
import tw from '../../tailwind';
import hymnalData from './SDA_Hymnal.json';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { runOnJS } from 'react-native-reanimated';
import { useFloatingButtonLayout, getDefaultFontStyle } from '../utils/platformUtils';

type SongDetailRouteProp = RouteProp<RootStackParamList, 'SongDetail'>;
type SongDetailNavigationProp = NativeStackNavigationProp<RootStackParamList, 'SongDetail'>;

const SongDetail = () => {
  const { floatingButtonBottom, listBottomPadding } = useFloatingButtonLayout();
  const insets = useSafeAreaInsets();
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
  const [isMoreMenuVisible, setIsMoreMenuVisible] = useState(false);
  const [isSheetMusicVisible, setIsSheetMusicVisible] = useState(false);
  const [isAudioVisible, setIsAudioVisible] = useState(false);
  const [fullSongData, setFullSongData] = useState<SDAHymn | null>(null);

  // Generate consistent ID for hymnal songs
  const hymnalSongId = `hymnal-${songNumber}`;
  const isFavorite = favoriteIds.includes(hymnalSongId);

  useEffect(() => {
    if (!favoritesLoaded) {
      dispatch(loadFavorites());
    }
  }, [dispatch, favoritesLoaded]);

  // Fetch full song data from cache/API to get sheet_music and audio
  useEffect(() => {
    const fetchFullSongData = async () => {
      try {
        const foundSong = await hymnalService.getSDAHymnByTitle(song.title);
        setFullSongData(foundSong);
      } catch (error) {
        console.error('Error fetching full song data:', error);
      }
    };
    fetchFullSongData();
  }, [song.title]);

  const lyricLines = useMemo(() => song.lyrics.split('\\n'), [song.lyrics]);

  const handleOpenPopup = () => setIsFontSizePopupVisible(true);
  const handleClosePopup = () => setIsFontSizePopupVisible(false);
  const handleOpenNumpad = () => setIsNumpadVisible(true);
  const handleCloseNumpad = () => setIsNumpadVisible(false);
  const handleOpenMoreMenu = () => setIsMoreMenuVisible(true);
  const handleCloseMoreMenu = () => setIsMoreMenuVisible(false);
  const handleOpenSheetMusic = () => setIsSheetMusicVisible(true);
  const handleCloseSheetMusic = () => setIsSheetMusicVisible(false);
  const handleOpenAudio = () => setIsAudioVisible(true);
  const handleCloseAudio = () => setIsAudioVisible(false);

  const hasSheetMusic = fullSongData?.sheet_music && fullSongData.sheet_music.length > 0;
  const hasAudio = !!fullSongData?.audio;

  const handleToggleFavorite = () => {
    dispatch(toggleFavorite(hymnalSongId, song.title));
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
      const cleanText = cleanLyrics(song.lyrics);
      const shareText = `${songNumber}. ${song.title}\n\n${cleanText}`;
      
      await Share.share({
        message: shareText,
        title: song.title,
      });
    } catch (error) {
      console.error('Error sharing song:', error);
    }
  };

  // Get total songs count
  const totalSongs = hymnalData.resources.array[0].item.length;

  const handleBackPress = () => {
    navigation.goBack();
  };

  const handleGoToSong = (songNum: number) => {
    setIsNumpadVisible(false);
    const songIndex = songNum - 1;
    const newTitle = hymnalData.resources.array[0].item[songIndex];
    const newLyrics = hymnalData.resources.array[2].item[songIndex];
    const englishTitle = hymnalData.resources.array[3].item[songIndex];

    const newSong = {
      title: newTitle,
      englishTitle: englishTitle || '',
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



  const accentColor = tw.color('accent-6') ?? '#EA9215';
  const mutedIconColor = isDarkMode ? '#9CA3AF' : '#6B7280';
  const dynamicStyles = {
    container: tw`flex-1 ${isDarkMode ? 'bg-dark-primary-10' : 'bg-primary-1'}`,
    title: [
      tw`font-nokia-bold ${isDarkMode ? 'text-dark-secondary-1' : 'text-secondary-10'}`,
      getDefaultFontStyle('bold'),
      { fontSize: fontSize + 6, lineHeight: 32 },
    ],
    subtitle: [
      tw`text-sm font-nokia-bold ${isDarkMode ? 'text-primary-6' : 'text-secondary-6'}`,
      getDefaultFontStyle('bold'),
    ],
    lyrics: [
      tw`font-nokia-bold mb-2 ${isDarkMode ? 'text-primary-6' : 'text-secondary-6'}`,
      getDefaultFontStyle('bold'),
      { fontSize, lineHeight: 28 },
    ],
    header: tw`flex-row justify-between items-center px-4 py-3 font-nokia-bold`,
    trackBox: tw`w-14 h-14 rounded-xl bg-accent-5 items-center justify-center`,
    divider: tw`h-px mt-4 ${isDarkMode ? 'bg-dark-primary-8' : 'bg-primary-6'}`,
  };

  return (
    <GestureDetector gesture={panGesture}>
      <View style={tw`flex-1 ${isDarkMode ? 'bg-dark-primary-10' : 'bg-primary-1'}`}>
        <SafeAreaView style={tw`flex-1`} edges={['top']}>
          {/* Top bar: back + action icons in one row */}
          <View style={[dynamicStyles.header, { paddingTop: Math.max(insets.top + 8, 20) }]}>
            <TouchableWithoutFeedback onPress={handleBackPress}>
              <View style={tw`p-2`}>
                <ArrowLeftIcon size={24} color={accentColor} />
              </View>
            </TouchableWithoutFeedback>
            <View style={tw`flex-row items-center`}>
              <TouchableOpacity onPress={handleOpenNumpad} style={tw`p-2`}>
                <SolidHashtagIcon size={22} color={accentColor} />
              </TouchableOpacity>
              <TouchableOpacity onPress={handleToggleFavorite} style={tw`p-2`}>
                {isFavorite ? (
                  <SolidHeartIcon size={22} color={tw.color('red-500')} />
                ) : (
                  <OutlineHeartIcon size={22} color={mutedIconColor} />
                )}
              </TouchableOpacity>
              <TouchableOpacity onPress={handleShare} style={tw`p-2`}>
                <ArrowUpTrayIcon size={20} color={mutedIconColor} />
              </TouchableOpacity>
              <TouchableWithoutFeedback onPress={() => setIsFullScreen(true)}>
                <View style={tw`p-2`}>
                  <ArrowsPointingOutIcon size={20} color={mutedIconColor} />
                </View>
              </TouchableWithoutFeedback>
              <TouchableOpacity onPress={handleOpenPopup} style={tw`p-2`}>
                <AdjustmentsHorizontalIcon size={22} color={mutedIconColor} />
              </TouchableOpacity>
              {(hasSheetMusic || hasAudio) ? (
                <TouchableWithoutFeedback onPress={handleOpenMoreMenu}>
                  <View style={tw`p-2`}>
                    <EllipsisVerticalIcon size={22} color={mutedIconColor} />
                  </View>
                </TouchableWithoutFeedback>
              ) : null}
            </View>
          </View>

          {/* Track info: number box + title & subtitle */}
          <View style={tw`px-5 pt-2 pb-4`}>
            <View style={tw`flex-row items-center`}>
              <View style={dynamicStyles.trackBox}>
                <Text style={[tw`text-white font-nokia-bold text-xl`, getDefaultFontStyle('bold')]}>
                  {songNumber}
                </Text>
              </View>
              <View style={tw`flex-1 ml-4 min-w-0`}>
                <Text style={[dynamicStyles.title, tw`font-nokia-bold`]}>
                  {song.title}
                </Text>
                {song.englishTitle ? (
                  <View style={tw`flex-row items-center mt-1.5`}>
                    <View style={tw`w-1 h-4 rounded-full bg-accent-6 mr-2`} />
                    <Text style={dynamicStyles.subtitle} numberOfLines={1}>
                      {song.englishTitle}
                    </Text>
                  </View>
                ) : null}
              </View>
            </View>
            <View style={dynamicStyles.divider} />
          </View>

          {/* Lyrics */}
          <ScrollView
            style={tw`flex-1`}
            showsVerticalScrollIndicator={false}
            scrollEnabled={true}
            bounces={true}
              contentContainerStyle={{
                padding: 20,
                paddingBottom: listBottomPadding,
              }}
          >
            {lyricLines.map((line, index) => (
              <Text key={index} style={dynamicStyles.lyrics}>
                {line}
              </Text>
            ))}
          </ScrollView>
        </SafeAreaView>

        {/* Floating Circular Numpad Button */}
        <TouchableOpacity
          onPress={handleOpenNumpad}
        style={[
          tw`absolute right-5 w-16 h-16 bg-accent-6 rounded-full items-center justify-center`,
          { bottom: floatingButtonBottom },
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
        <MoreMenu
          visible={isMoreMenuVisible}
          onClose={handleCloseMoreMenu}
          onFontSize={handleOpenPopup}
          onSheetMusic={handleOpenSheetMusic}
          onAudio={handleOpenAudio}
          hasSheetMusic={hasSheetMusic}
          hasAudio={hasAudio}
        />
        {hasSheetMusic && fullSongData?.sheet_music && (
          <SheetMusicViewer
            visible={isSheetMusicVisible}
            onClose={handleCloseSheetMusic}
            images={fullSongData.sheet_music}
            title={song.title}
          />
        )}
        {hasAudio && fullSongData?.audio && (
          <AudioPlayer
            visible={isAudioVisible}
            onClose={handleCloseAudio}
            audioUrl={fullSongData.audio}
            title={song.title}
          />
        )}
      </View>
    </GestureDetector>
  );
};

export default SongDetail;
