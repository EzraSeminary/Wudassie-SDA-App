import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TouchableWithoutFeedback, TouchableOpacity, Share, Animated } from 'react-native';
import { RouteProp, useRoute, useNavigation } from '@react-navigation/native';
import { useSelector, useDispatch } from 'react-redux';
import { RootState, AppDispatch } from '../../store';
import { RootStackParamList } from '../../../App';
import { ArrowLeftIcon, ArrowsPointingOutIcon, EllipsisVerticalIcon, ArrowUpTrayIcon } from 'react-native-heroicons/outline';
import { HeartIcon as SolidHeartIcon, HashtagIcon as SolidHashtagIcon } from 'react-native-heroicons/solid';
import { HeartIcon as OutlineHeartIcon } from 'react-native-heroicons/outline';
import FontSizePopup from './../CustomBottomSheet';
import NumpadModal from './../NumpadModal';
import FullScreenVerse from './../FullScreenVerse';
import MoreMenu from './../MoreMenu';
import SheetMusicViewer from './../SheetMusicViewer';
import AudioPlayer from './../AudioPlayer';
import SelectableLyrics from './../SelectableLyrics';
import { hymnalService, HagerignaHymn } from '../../services/hymnalService';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import tw from '../../../tailwind';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { runOnJS } from 'react-native-reanimated';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { loadFavorites, toggleFavorite } from '../../store/favoritesSlice';
import Orientation from 'react-native-orientation-locker';
import { useFloatingButtonLayout, getDefaultFontStyle } from '../../utils/platformUtils';
import { buildSongShareMessage } from '../../utils/shareUtils';
import { GlassBackground, GlassGradientBorder, glassSurface, glassTextShadow, useGlassTheme } from '../glass/GlassBackground';

type SongDetailRouteProp = RouteProp<RootStackParamList, 'HagerignaDetail'>;
type HagerignaDetailNavigationProp = NativeStackNavigationProp<RootStackParamList, 'HagerignaDetail'>;

const SCROLL_THRESHOLD = 55;

const HagerignaDetail = () => {
  const { floatingButtonBottom, listBottomPadding } = useFloatingButtonLayout();
  const insets = useSafeAreaInsets();
  const route = useRoute<SongDetailRouteProp>();
  const navigation = useNavigation<HagerignaDetailNavigationProp>();
  const { song: initialSong, songNumber } = route.params;

  const dispatch: AppDispatch = useDispatch();
  const fontSize = useSelector((state: RootState) => state.fontSize.fontSize);
  const glass = useGlassTheme();
  const { favoriteIds = [], isLoaded: favoritesLoaded = false } = useSelector((state: RootState) => state.favorites) || {};

  const scrollY = useRef(new Animated.Value(0)).current;

  const [isPopupVisible, setPopupVisible] = useState(false);
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [isNumpadVisible, setNumpadVisible] = useState(false);
  const [isMoreMenuVisible, setIsMoreMenuVisible] = useState(false);
  const [isSheetMusicVisible, setIsSheetMusicVisible] = useState(false);
  const [isAudioVisible, setIsAudioVisible] = useState(false);
  const [song, setSong] = useState<HagerignaHymn>(initialSong);
  const [fullSongData, setFullSongData] = useState<HagerignaHymn | null>(null);
  const [allSongs, setAllSongs] = useState<HagerignaHymn[]>([]);

  // Animated interpolations for collapsing header
  const subtitleOpacity = scrollY.interpolate({
    inputRange: [0, SCROLL_THRESHOLD * 0.6],
    outputRange: [1, 0],
    extrapolate: 'clamp',
  });
  const subtitleMaxHeight = scrollY.interpolate({
    inputRange: [0, SCROLL_THRESHOLD * 0.6],
    outputRange: [36, 0],
    extrapolate: 'clamp',
  });
  const trackBoxSize = scrollY.interpolate({
    inputRange: [0, SCROLL_THRESHOLD],
    outputRange: [56, 36],
    extrapolate: 'clamp',
  });
  const trackBoxNumberSize = scrollY.interpolate({
    inputRange: [0, SCROLL_THRESHOLD],
    outputRange: [20, 13],
    extrapolate: 'clamp',
  });
  const headerPaddingTop = scrollY.interpolate({
    inputRange: [0, SCROLL_THRESHOLD],
    outputRange: [8, 2],
    extrapolate: 'clamp',
  });
  const headerPaddingBottom = scrollY.interpolate({
    inputRange: [0, SCROLL_THRESHOLD],
    outputRange: [16, 4],
    extrapolate: 'clamp',
  });
  const animTitleFontSize = scrollY.interpolate({
    inputRange: [0, SCROLL_THRESHOLD],
    outputRange: [fontSize + 6, fontSize + 1],
    extrapolate: 'clamp',
  });
  const animTitleLineHeight = scrollY.interpolate({
    inputRange: [0, SCROLL_THRESHOLD],
    outputRange: [Math.round((fontSize + 6) * 1.45), Math.round((fontSize + 1) * 1.3)],
    extrapolate: 'clamp',
  });

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

  useEffect(() => {
    setSong(initialSong);
  }, [initialSong]);

  useEffect(() => {
    const loadSongs = async () => {
      const immediateSongs = await hymnalService.getImmediateHagerignaHymns();
      setAllSongs(immediateSongs);

      try {
        const refreshedSongs = await hymnalService.getHagerignaHymnsFromApi();
        if (refreshedSongs.length > 0) {
          setAllSongs(refreshedSongs);
        }
      } catch (error) {
        if (__DEV__) {
          console.error('Failed to refresh Hagerigna song list in background', error);
        }
      }
    };

    loadSongs();
  }, []);

  useEffect(() => {
    const fetchFullSongData = async () => {
      try {
        const allSongs = await hymnalService.getHagerignaHymns();
        const foundSong = allSongs.find((s: HagerignaHymn) => s.id === song.id);
        if (foundSong) {
          setFullSongData(foundSong);
        } else {
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
    if (!isFullScreen) {
      Orientation.lockToPortrait();
    }
  }, [isFullScreen]);

  const handleToggleFavorite = () => {
    dispatch(toggleFavorite(song.id, song.title));
  };

  const handleShare = async () => {
    try {
      const shareText = buildSongShareMessage({
        songNumber,
        title: song.title,
        lyrics: song.song,
        artist: song.artist,
      });
      await Share.share({ message: shareText, title: song.title });
    } catch (error) {
      console.error('Error sharing song:', error);
    }
  };

  const totalSongs = allSongs.length;

  const handleBackPress = () => navigation.goBack();

  const handleJumpToSong = (songNum: number) => {
    const newSongIndex = songNum - 1;
    if (newSongIndex < 0 || newSongIndex >= totalSongs) return;

    setNumpadVisible(false);
    const nextSong = allSongs[newSongIndex];
    if (!nextSong) return;

    navigation.setParams({ song: nextSong, songNumber: songNum });
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

  const handleSwipeNavigation = (direction: 'next' | 'previous') => navigateToSong(direction);

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

  const accentColor = glass.accent;
  const mutedIconColor = glass.mutedText;

  const dynamicStyles = {
    header: [tw`flex-row justify-between items-center mx-4 px-3 py-3 rounded-3xl font-nokia-bold`, glassSurface(glass, true)],
    artist: [
      tw`text-sm font-nokia-bold`,
      getDefaultFontStyle('bold'),
      {
        color: glass.mutedText,
        lineHeight: 22,
        paddingTop: 2,
        paddingBottom: 4,
        includeFontPadding: true,
      },
    ],
    lyrics: [
      tw`font-nokia-bold mb-2`,
      getDefaultFontStyle('bold'),
      {
        color: glass.text,
        fontSize,
        lineHeight: Math.round(fontSize * 1.7),
        paddingTop: 4,
        paddingBottom: 10,
        includeFontPadding: true,
        ...glassTextShadow(glass.isDarkMode),
      },
    ],
    divider: [tw`h-px mt-3`, { backgroundColor: glass.border }],
  };

  if (!song) {
    return (
      <GlassBackground>
        <Text style={{ color: glass.text }}>Loading...</Text>
      </GlassBackground>
    );
  }

  return (
    <GestureDetector gesture={panGesture}>
      <GlassBackground>
        <SafeAreaView style={tw`flex-1`} edges={['top']}>
          {/* Top bar */}
          <View style={[dynamicStyles.header, { marginTop: Math.max(insets.top + 8, 20) }]}>
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
                <Text style={[tw`font-nokia-bold text-base`, { color: mutedIconColor }]}>Aa</Text>
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

          {/* Animated track info: number box + title + artist */}
          <Animated.View
            style={[
              tw`px-5`,
              { paddingTop: headerPaddingTop, paddingBottom: headerPaddingBottom },
            ]}
          >
            <View style={tw`flex-row items-center`}>
              {/* Animated number box */}
              <Animated.View
                style={[
                  tw`rounded-xl bg-accent-5 items-center justify-center`,
                  { width: trackBoxSize, height: trackBoxSize },
                ]}
              >
                <Animated.Text
                  style={[
                    tw`text-white font-nokia-bold`,
                    getDefaultFontStyle('bold'),
                    { fontSize: trackBoxNumberSize },
                  ]}
                >
                  {songNumber}
                </Animated.Text>
              </Animated.View>

              <View style={tw`flex-1 ml-4 min-w-0`}>
                {/* Animated title */}
                <Animated.Text
                  style={[
                    tw`font-nokia-bold`,
                    getDefaultFontStyle('bold'),
                    {
                      color: glass.text,
                      fontSize: animTitleFontSize,
                      lineHeight: animTitleLineHeight,
                      paddingTop: 4,
                      paddingBottom: 4,
                      includeFontPadding: true,
                    },
                  ]}
                >
                  {song.title}
                </Animated.Text>

                {/* Animated artist — fades out and collapses on scroll */}
                {song.artist ? (
                  <Animated.View
                    style={{
                      opacity: subtitleOpacity,
                      maxHeight: subtitleMaxHeight,
                      overflow: 'hidden',
                    }}
                  >
                    <View style={tw`flex-row items-center mt-1`}>
                      <View style={tw`w-1 h-4 rounded-full bg-accent-6 mr-2`} />
                      <Text style={dynamicStyles.artist} numberOfLines={1}>
                        {song.artist}
                      </Text>
                    </View>
                  </Animated.View>
                ) : null}
              </View>
            </View>
            <View style={dynamicStyles.divider} />
          </Animated.View>

          {/* Lyrics with scroll tracking */}
          <Animated.ScrollView
            style={tw`flex-1`}
            showsVerticalScrollIndicator={false}
            scrollEnabled={true}
            bounces={true}
            contentContainerStyle={{ paddingBottom: listBottomPadding }}
            onScroll={Animated.event(
              [{ nativeEvent: { contentOffset: { y: scrollY } } }],
              { useNativeDriver: false },
            )}
            scrollEventThrottle={16}
          >
            <View style={tw`p-4`}>
              <View style={[tw`rounded-3xl px-5 py-6`, glassSurface(glass, true)]}>
              <GlassGradientBorder radius={24} />
              <SelectableLyrics
                text={song.song}
                style={dynamicStyles.lyrics}
                selectionColor={accentColor}
              />
              </View>
            </View>
          </Animated.ScrollView>
        </SafeAreaView>

        {/* Floating Circular Numpad Button */}
        <TouchableOpacity
          onPress={handleOpenNumpad}
          style={[
            tw`absolute right-5 w-16 h-16 rounded-full items-center justify-center`,
            { bottom: floatingButtonBottom },
            {
              backgroundColor: glass.accent,
              shadowColor: glass.accent,
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

        <FontSizePopup visible={isPopupVisible} onClose={handleClosePopup} previewText={song.title} />
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
            singer: song.artist,
          }}
          isVisible={isFullScreen}
          onClose={() => setIsFullScreen(false)}
        />
      </GlassBackground>
    </GestureDetector>
  );
};

export default HagerignaDetail;
