import React, { useMemo, useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableWithoutFeedback, TouchableOpacity, Share } from 'react-native';
import { RouteProp, useRoute, useNavigation } from '@react-navigation/native';
import { useSelector, useDispatch } from 'react-redux';
import { RootState, AppDispatch } from '../../store';
import { RootStackParamList } from '../../../App';
import { ArrowLeftIcon, ArrowsPointingOutIcon, EllipsisVerticalIcon, ArrowUpTrayIcon, AdjustmentsHorizontalIcon } from 'react-native-heroicons/outline';
import { HeartIcon as SolidHeartIcon, HashtagIcon as SolidHashtagIcon } from 'react-native-heroicons/solid';
import { HeartIcon as OutlineHeartIcon } from 'react-native-heroicons/outline';
import FontSizePopup from './../CustomBottomSheet';
import NumpadModal from './../NumpadModal';
import FullScreenVerse from './../FullScreenVerse';
import MoreMenu from './../MoreMenu';
import SheetMusicViewer from './../SheetMusicViewer';
import AudioPlayer from './../AudioPlayer';
import { hymnalService, HagerignaHymn } from '../../services/hymnalService';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import tw from '../../../tailwind';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { runOnJS } from 'react-native-reanimated';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import hagerignaData from './HagerignaData.json';
import { loadFavorites, toggleFavorite } from '../../store/favoritesSlice';
import Orientation from 'react-native-orientation-locker';
import { useFloatingButtonLayout, getDefaultFontStyle } from '../../utils/platformUtils';

type SongDetailRouteProp = RouteProp<RootStackParamList, 'HagerignaDetail'>;
type HagerignaDetailNavigationProp = NativeStackNavigationProp<RootStackParamList, 'HagerignaDetail'>;

const HagerignaDetail = () => {
  const { floatingButtonBottom, listBottomPadding } = useFloatingButtonLayout();
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
  const [isMoreMenuVisible, setIsMoreMenuVisible] = useState(false);
  const [isSheetMusicVisible, setIsSheetMusicVisible] = useState(false);
  const [isAudioVisible, setIsAudioVisible] = useState(false);
  const [song, setSong] = useState<HagerignaHymn>(initialSong);
  const [fullSongData, setFullSongData] = useState<HagerignaHymn | null>(null);

  const handleOpenPopup = () => setPopupVisible(true);
  const handleClosePopup = () => setPopupVisible(false);
  const handleOpenNumpad = () => setNumpadVisible(true);
  const handleCloseNumpad = () => setNumpadVisible(false);
  const handleOpenMoreMenu = () => setIsMoreMenuVisible(true);
  const handleCloseMoreMenu = () => setIsMoreMenuVisible(false);
  const handleOpenSheetMusic = () => setIsSheetMusicVisible(true);
  const handleCloseSheetMusic = () => setIsSheetMusicVisible(false);
  const handleOpenAudio = () => setIsAudioVisible(true);
  const handleCloseAudio = () => setIsAudioVisible(false);

  const hasSheetMusic = fullSongData?.sheet_music && fullSongData.sheet_music.length > 0;
  const hasAudio = !!fullSongData?.audio;

  useEffect(() => {
    if (!favoritesLoaded) {
      dispatch(loadFavorites());
    }
  }, [dispatch, favoritesLoaded]);

  const lyricLines = useMemo(() => song.song.split('\\n'), [song.song]);

  useEffect(() => {
    setSong(initialSong);
  }, [initialSong]);

  // Fetch full song data from API to get sheet_music and audio
  useEffect(() => {
    const fetchFullSongData = async () => {
      try {
        const allSongs = await hymnalService.getHagerignaHymns();
        const foundSong = allSongs.find((s: HagerignaHymn) => s.id === song.id);
        if (foundSong) {
          setFullSongData(foundSong);
        } else {
          // If not found by ID, try to find by title
          const foundByTitle = allSongs.find((s: HagerignaHymn) => s.title === song.title);
          if (foundByTitle) {
            setFullSongData(foundByTitle);
          }
        }
      } catch (error) {
        console.error('Error fetching full song data:', error);
      }
    };
    if (song.id) {
      fetchFullSongData();
    }
  }, [song.id, song.title]);

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
    navigation.goBack();
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

  const accentColor = tw.color('accent-6') ?? '#EA9215';
  const mutedIconColor = isDarkMode ? '#9CA3AF' : '#6B7280';
  const dynamicStyles = {
    container: tw`flex-1 ${isDarkMode ? 'bg-dark-primary-10' : 'bg-primary-1'}`,
    title: [
      tw`font-nokia-bold ${isDarkMode ? 'text-dark-secondary-1' : 'text-secondary-10'}`,
      getDefaultFontStyle('bold'),
      { fontSize: fontSize + 6, lineHeight: 32 },
    ],
    artist: [
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
                {favoriteIds.includes(song.id) ? (
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

          {/* Track info: number box + title & artist with vertical bar */}
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
                {song.artist ? (
                  <View style={tw`flex-row items-center mt-1.5`}>
                    <View style={tw`w-1 h-4 rounded-full bg-accent-6 mr-2`} />
                    <Text style={dynamicStyles.artist} numberOfLines={1}>
                      {song.artist}
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
            contentContainerStyle={{ paddingBottom: listBottomPadding }}
          >
            <View style={tw`p-5`}>
              {lyricLines.map((line: string, index: number) => (
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

        <FontSizePopup visible={isPopupVisible} onClose={handleClosePopup} />
        <NumpadModal
          visible={isNumpadVisible}
          onClose={handleCloseNumpad}
          onJumpToSong={handleJumpToSong}
          maxSongs={totalSongs}
          title="Hagerigna"
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
