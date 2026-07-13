import React, { useState, useEffect, useMemo } from 'react';
import { View, Text, FlatList, ActivityIndicator, TouchableOpacity, Platform } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { useSelector, useDispatch } from 'react-redux';
import tw from '../../../tailwind';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { HeartIcon as SolidHeartIcon } from 'react-native-heroicons/solid';
import { MusicalNoteIcon } from 'react-native-heroicons/outline';
import { getCardStyle, useBottomContentPadding } from '../../utils/platformUtils';

import { hymnalService, HagerignaHymn } from '../../services/hymnalService';
import { RootState, AppDispatch } from '../../store';
import { loadFavorites, toggleFavorite } from '../../store/favoritesSlice';
import { RootStackParamList } from '../../../App';
import { GlassBackground, GlassGradientBorder, glassSurface, useGlassTheme } from '../glass/GlassBackground';

type FavoritesListNavigationProp = NativeStackNavigationProp<RootStackParamList, 'FavoritesList'>;

interface HymnalSong {
  id: string;
  title: string;
  lyrics: string;
  englishTitle?: string;
  type: 'hymnal';
}

interface HagerignaFavoriteSong extends HagerignaHymn {
  type: 'hagerigna';
}

type FavoriteSong = HymnalSong | HagerignaFavoriteSong;

const FavoritesList = () => {
  const [allHagerignaHymns, setAllHagerignaHymns] = useState<HagerignaHymn[]>([]);
  const [allHymnalSongs, setAllHymnalSongs] = useState<HymnalSong[]>([]);
  const [selectedType, setSelectedType] = useState<'hymnal' | 'hagerigna'>('hagerigna');
  const [hymnsLoading, setHymnsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const navigation = useNavigation<FavoritesListNavigationProp>();
  const insets = useSafeAreaInsets();
  const headerTopPadding = Platform.OS === 'android' ? Math.max(insets.top + 8, 18) : Math.max(insets.top + 8, 16);
  const contentBottomPadding = useBottomContentPadding(24);
  const dispatch: AppDispatch = useDispatch();

  const { favoriteIds = [], isLoaded: favoritesLoaded = false } = useSelector((state: RootState) => state.favorites) || {};
  const glass = useGlassTheme();

  useEffect(() => {
    if (!favoritesLoaded) {
      dispatch(loadFavorites());
    }
  }, [dispatch, favoritesLoaded]);

  useEffect(() => {
    const mapHymnalSongs = async () => {
      try {
        const immediateSda = await hymnalService.getImmediateSDAHymns();
        const songs: HymnalSong[] = immediateSda.map((song, index) => {
          const number = song.number ?? index + 1;
          return {
            id: song.id || `hymnal-${number}`,
            title: song.newHymnalTitle || song.title || song.oldHymnalTitle || `Song ${number}`,
            lyrics: song.newHymnalLyrics || song.lyrics || song.oldHymnalLyrics || '',
            englishTitle: song.englishTitleOld || '',
            type: 'hymnal',
          };
        });
        setAllHymnalSongs(songs);
      } catch (e) {
        setError('Failed to load hymnal songs.');
        console.error(e);
      }
    };

    const loadFavoritesSources = async () => {
      try {
        const [immediateHagerigna] = await Promise.all([
          hymnalService.getImmediateHagerignaHymns(),
          mapHymnalSongs(),
        ]);

        setAllHagerignaHymns(immediateHagerigna);
      } catch (e) {
        setError('Failed to load songs.');
        console.error(e);
      } finally {
        setHymnsLoading(false);
      }

      try {
        const [apiHagerigna, apiSda] = await Promise.all([
          hymnalService.getHagerignaHymnsFromApi(),
          hymnalService.getSDAHymnsFromApi(),
        ]);

        setAllHagerignaHymns(apiHagerigna);
        setAllHymnalSongs(apiSda.map((song, index) => {
          const number = song.number ?? index + 1;
          return {
            id: song.id || `hymnal-${number}`,
            title: song.newHymnalTitle || song.title || song.oldHymnalTitle || `Song ${number}`,
            lyrics: song.newHymnalLyrics || song.lyrics || song.oldHymnalLyrics || '',
            englishTitle: song.englishTitleOld || '',
            type: 'hymnal',
          };
        }));
      } catch (e) {
        if (__DEV__) {
          console.error('Failed to refresh favorites sources in background', e);
        }
      }
    };

    loadFavoritesSources();
  }, []);

  const favoriteHagerignaHymns = useMemo(() => {
    if (!allHagerignaHymns || allHagerignaHymns.length === 0) return [];
    return allHagerignaHymns
      .filter(hymn => favoriteIds.includes(hymn.id))
      .map(hymn => ({ ...hymn, type: 'hagerigna' as const }));
  }, [allHagerignaHymns, favoriteIds]);

  const favoriteHymnalSongs = useMemo(() => {
    if (!allHymnalSongs || allHymnalSongs.length === 0) return [];
    return allHymnalSongs.filter(song => favoriteIds.includes(song.id));
  }, [allHymnalSongs, favoriteIds]);

  const currentFavorites = selectedType === 'hagerigna' ? favoriteHagerignaHymns : favoriteHymnalSongs;

  const handlePressSong = (song: FavoriteSong) => {
    if (song.type === 'hagerigna') {
      const songIndex = allHagerignaHymns.findIndex(s => s.id === song.id);
      navigation.navigate('HagerignaDetail', { song: song as HagerignaHymn, songNumber: songIndex + 1 });
    } else {
      const songIndex = allHymnalSongs.findIndex(s => s.id === song.id);
      const hymnalSong = {
        title: song.title,
        lyrics: song.lyrics,
        englishTitle: song.englishTitle,
      };
      navigation.navigate('SongDetail', { song: hymnalSong, songNumber: songIndex + 1 });
    }
  };

  const handleToggleFavorite = (songId: string, songTitle: string) => {
    dispatch(toggleFavorite(songId, songTitle));
  };

  const dynamicStyles = {
    songItem: [
      tw`flex-row items-center rounded-2xl mt-2 mx-4 p-4`,
      glassSurface(glass),
    ],
    songTitle: [tw`text-lg font-nokia-bold`, { color: glass.text }],
    artistName: [tw`text-sm font-nokia-bold`, { color: glass.mutedText }],
    emptyText: [tw`text-center font-nokia-bold`, { color: glass.text }],
    header: [tw`flex-row items-center px-5 pb-2 border-b`, { borderColor: glass.border }],
    toggleButton: [tw`flex-1 py-3 px-4 mx-2 rounded-2xl`, glassSurface(glass)],
    toggleButtonActive: [tw`flex-1 py-3 px-4 mx-2 rounded-2xl`, { backgroundColor: glass.accent }],
    toggleButtonText: [tw`text-center font-nokia-bold`, { color: glass.text }],
    toggleButtonTextActive: tw`text-center font-nokia-bold text-white`,
  };

  if (hymnsLoading && !favoritesLoaded) {
    return (
      <GlassBackground>
        <SafeAreaView style={tw`flex-1`} edges={['left', 'right']}>
          <View style={tw`flex-1 justify-center items-center`}>
            <ActivityIndicator size="large" color="#EA9215" />
          </View>
        </SafeAreaView>
      </GlassBackground>
    );
  }

  if (error) {
    return (
      <GlassBackground>
        <SafeAreaView style={tw`flex-1`} edges={['left', 'right']}>
          <View style={tw`flex-1 justify-center items-center`}>
            <Text style={dynamicStyles.emptyText}>{error}</Text>
          </View>
        </SafeAreaView>
      </GlassBackground>
    );
  }

  const renderToggleButtons = () => (
    <View style={tw`flex-row px-4 py-3 bg-transparent`}>
      <TouchableOpacity
        style={[
          dynamicStyles.toggleButton,
          selectedType === 'hymnal' ? dynamicStyles.toggleButtonActive : {},
          getCardStyle()
        ]}
        onPress={() => setSelectedType('hymnal')}
      >
        <Text style={selectedType === 'hymnal' ? dynamicStyles.toggleButtonTextActive : dynamicStyles.toggleButtonText}>
          Hymnal
        </Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={[
          dynamicStyles.toggleButton,
          selectedType === 'hagerigna' ? dynamicStyles.toggleButtonActive : {},
          getCardStyle()
        ]}
        onPress={() => setSelectedType('hagerigna')}
      >
        <Text style={selectedType === 'hagerigna' ? dynamicStyles.toggleButtonTextActive : dynamicStyles.toggleButtonText}>
          Hagerigna
        </Text>
      </TouchableOpacity>
    </View>
  );

  if (currentFavorites.length === 0) {
    return (
      <GlassBackground>
        <SafeAreaView style={tw`flex-1`} edges={['left', 'right']}>
          <View style={[dynamicStyles.header, { paddingTop: headerTopPadding }]}>
            <MusicalNoteIcon size={28} color={glass.accent} />
            <Text style={[tw`text-2xl font-nokia-bold ml-3`, { color: glass.text }]}>
              Favorite Songs
            </Text>
          </View>
          {renderToggleButtons()}
          <View style={tw`flex-1 justify-center items-center`}>
            <Text style={[dynamicStyles.emptyText, tw`text-xl`]}>
              No favorite {selectedType === 'hymnal' ? 'hymnal' : 'Hagerigna'} songs yet.
            </Text>
            <Text style={[tw`text-center font-nokia-bold mt-2`, { color: glass.mutedText }]}>
              Tap the heart on a song to add it here.
            </Text>
          </View>
        </SafeAreaView>
      </GlassBackground>
    );
  }
  
  const renderItem = ({ item }: { item: FavoriteSong }) => {
    const isHagerigna = item.type === 'hagerigna';
    const songIndex = isHagerigna 
      ? allHagerignaHymns.findIndex(s => s.id === item.id)
      : allHymnalSongs.findIndex(s => s.id === item.id);
    
    return (
      <TouchableOpacity onPress={() => handlePressSong(item)} style={dynamicStyles.songItem}>
        <GlassGradientBorder radius={16} />
        <Text style={[tw`text-2xl font-nokia-bold mr-4 min-w-[35px]`, { color: glass.accent }]}>
          {songIndex + 1}
        </Text>
        <View style={tw`ml-3 flex-1`}>
          <Text style={dynamicStyles.songTitle} numberOfLines={2}>
            {item.title}
          </Text>
          {isHagerigna && (item as HagerignaFavoriteSong).artist && (
            <Text style={[dynamicStyles.artistName, tw`mt-1`]} numberOfLines={1}>
              {(item as HagerignaFavoriteSong).artist}
            </Text>
          )}
        </View>
        <TouchableOpacity onPress={(e) => { e.stopPropagation(); handleToggleFavorite(item.id, item.title); }} style={tw`p-2 -mr-2`}>
          <SolidHeartIcon size={24} color={tw.color('red-500')} />
        </TouchableOpacity>
      </TouchableOpacity>
    );
  };

  return (
    <GlassBackground>
      <SafeAreaView style={tw`flex-1`} edges={['left', 'right']}>
        <View style={[dynamicStyles.header, { paddingTop: headerTopPadding }]}>
          <MusicalNoteIcon size={28} color={glass.accent} />
          <Text style={[tw`text-2xl font-nokia-bold ml-3`, { color: glass.text }]}>
            Favorite Songs
          </Text>
        </View>
        {renderToggleButtons()}
        <FlatList
          data={currentFavorites}
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderItem}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={[tw`pb-24` as any, { paddingBottom: contentBottomPadding }]}
        />
      </SafeAreaView>
    </GlassBackground>
  );
};

export default FavoritesList;
