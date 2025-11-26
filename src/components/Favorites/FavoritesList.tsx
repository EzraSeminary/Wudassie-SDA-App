import React, { useState, useEffect, useMemo } from 'react';
import { View, Text, FlatList, ActivityIndicator, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
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
import hymnalData from '../SDA_Hymnal.json';

type FavoritesListNavigationProp = NativeStackNavigationProp<RootStackParamList, 'FavoritesList'>;

interface HymnalSong {
  id: string;
  title: string;
  lyrics: string;
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
  const contentBottomPadding = useBottomContentPadding(24);
  const dispatch: AppDispatch = useDispatch();

  const { favoriteIds = [], isLoaded: favoritesLoaded = false } = useSelector((state: RootState) => state.favorites) || {};
  const isDarkMode = useSelector((state: RootState) => state.theme.isDarkMode);

  useEffect(() => {
    if (!favoritesLoaded) {
      dispatch(loadFavorites());
    }
  }, [dispatch, favoritesLoaded]);

  useEffect(() => {
    const fetchHagerignaHymns = async () => {
      try {
        const cachedHymns = await hymnalService.getLocalHagerignaHymns();
        if (cachedHymns) {
          setAllHagerignaHymns(cachedHymns);
        }

        const apiHymns = await hymnalService.getHagerignaHymns();
        setAllHagerignaHymns(apiHymns);
      } catch (e) {
        setError('Failed to load Hagerigna hymns.');
        console.error(e);
      }
    };

    const fetchHymnalSongs = () => {
      try {
        const titles = hymnalData.resources.array[0].item;
        const lyrics = hymnalData.resources.array[2].item;
        
        const hymnalSongs: HymnalSong[] = titles.map((title, index) => ({
          id: `hymnal-${index + 1}`,
          title,
          lyrics: lyrics[index],
          type: 'hymnal' as const,
        }));
        
        setAllHymnalSongs(hymnalSongs);
      } catch (e) {
        setError('Failed to load hymnal songs.');
        console.error(e);
      } finally {
        setHymnsLoading(false);
      }
    };

    fetchHagerignaHymns();
    fetchHymnalSongs();
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
      };
      navigation.navigate('SongDetail', { song: hymnalSong, songNumber: songIndex + 1 });
    }
  };

  const handleToggleFavorite = (songId: string, songTitle: string) => {
    dispatch(toggleFavorite(songId, songTitle));
  };

  const dynamicStyles = {
    container: tw`flex-1 ${isDarkMode ? 'bg-dark-primary-10' : 'bg-primary-1'}`,
    songItem: [
      tw`flex-row items-center rounded-xl mt-2 mx-4 p-4 ${isDarkMode ? 'bg-dark-primary-8' : 'bg-primary-3'}`,
      getCardStyle()
    ],
    songTitle: tw`text-lg font-nokia-bold ${isDarkMode ? 'text-dark-secondary-1' : 'text-secondary-10'}`,
    artistName: tw`text-sm font-nokia-bold ${isDarkMode ? 'text-primary-7' : 'text-primary-10'}`,
    emptyText: tw`text-center font-nokia-bold ${isDarkMode ? 'text-dark-secondary-1' : 'text-secondary-10'}`,
    header: tw`flex-row items-center px-5 pb-2 border-b ${isDarkMode ? 'border-dark-primary-8' : 'border-primary-6'}`,
    toggleButton: tw`flex-1 py-3 px-4 mx-2 rounded-lg ${isDarkMode ? 'bg-dark-primary-8' : 'bg-primary-3'}`,
    toggleButtonActive: tw`flex-1 py-3 px-4 mx-2 rounded-lg bg-accent-6`,
    toggleButtonText: tw`text-center font-nokia-bold ${isDarkMode ? 'text-dark-secondary-1' : 'text-secondary-10'}`,
    toggleButtonTextActive: tw`text-center font-nokia-bold text-white`,
  };

  if (hymnsLoading && !favoritesLoaded) {
    return (
      <View style={[dynamicStyles.container, tw`justify-center items-center`]}>
        <ActivityIndicator size="large" color="#EA9215" />
      </View>
    );
  }

  if (error) {
    return (
      <View style={[dynamicStyles.container, tw`justify-center items-center`]}>
        <Text style={dynamicStyles.emptyText}>{error}</Text>
      </View>
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
      <View style={dynamicStyles.container}>
        <SafeAreaView style={tw`flex-1`}>
          <View style={dynamicStyles.header}>
            <MusicalNoteIcon size={28} color="#EA9215" />
            <Text style={tw`text-2xl font-nokia-bold ml-3 ${isDarkMode ? 'text-dark-secondary-1' : 'text-secondary-10'}`}>
              Favorite Songs
            </Text>
          </View>
          {renderToggleButtons()}
          <View style={tw`flex-1 justify-center items-center`}>
            <Text style={[dynamicStyles.emptyText, tw`text-xl`]}>
              No favorite {selectedType === 'hymnal' ? 'hymnal' : 'Hagerigna'} songs yet.
            </Text>
            <Text style={tw`text-center font-nokia-bold mt-2 ${isDarkMode ? 'text-primary-7' : 'text-primary-10'}`}>
              Tap the heart on a song to add it here.
            </Text>
          </View>
        </SafeAreaView>
      </View>
    );
  }
  
  const renderItem = ({ item }: { item: FavoriteSong }) => {
    const isHagerigna = item.type === 'hagerigna';
    const songIndex = isHagerigna 
      ? allHagerignaHymns.findIndex(s => s.id === item.id)
      : allHymnalSongs.findIndex(s => s.id === item.id);
    
    return (
      <TouchableOpacity onPress={() => handlePressSong(item)} style={dynamicStyles.songItem}>
        <Text style={tw`text-2xl font-nokia-bold mr-4 text-accent-6 min-w-[35px]`}>
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
    <View style={dynamicStyles.container}>
      <SafeAreaView style={tw`flex-1`}>
        <View style={dynamicStyles.header}>
          <MusicalNoteIcon size={28} color="#EA9215" />
          <Text style={tw`text-2xl font-nokia-bold ml-3 ${isDarkMode ? 'text-dark-secondary-1' : 'text-secondary-10'}`}>
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
    </View>
  );
};

export default FavoritesList; 