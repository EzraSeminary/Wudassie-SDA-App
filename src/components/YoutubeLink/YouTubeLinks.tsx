import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  Image,
  ActivityIndicator,
  RefreshControl,
  useWindowDimensions,
  Platform,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useSelector } from 'react-redux';
import NetInfo from '@react-native-community/netinfo';
import { RootState } from '../../store';
import {
  MusicalNoteIcon,
  PlayIcon,
} from 'react-native-heroicons/outline';
import { getCardStyle, useBottomContentPadding } from '../../utils/platformUtils';
import tw from '../../../tailwind';
import YoutubePlayer from 'react-native-youtube-iframe';
import { youtubeService, YouTubeLink } from '../../services/youtubeService';

const MusicPlayer = () => {
  const isDarkMode = useSelector((state: RootState) => state.theme.isDarkMode);
  const insets = useSafeAreaInsets();
  const headerTopPadding = Platform.OS === 'android' ? Math.max(insets.top + 8, 18) : Math.max(insets.top + 8, 16);
  const contentBottomPadding = useBottomContentPadding(24);
  const { width } = useWindowDimensions();

  const [links, setLinks] = useState<YouTubeLink[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [playerError, setPlayerError] = useState<string | null>(null);
  const wasOnlineRef = useRef<boolean | null>(null);

  const playerWidth = Math.min(width - 40, 640);
  const playerHeight = Math.round(playerWidth * 0.56);

  const selectedLink = useMemo(
    () => links.find((link) => link.id === selectedId) ?? links[0],
    [links, selectedId]
  );

  useEffect(() => {
    if (links.length === 0) {
      return;
    }
    if (!selectedId || !links.some((link) => link.id === selectedId)) {
      setSelectedId(links[0].id);
    }
    setPlayerError(null);
  }, [links, selectedId]);

  const fetchLinks = useCallback(
    async (isRefresh = false) => {
      try {
        if (isRefresh) {
          setRefreshing(true);
        } else {
          setLoading(true);
        }

        setError(null);

        const cached = await youtubeService.getCachedLinks();
        if (!isRefresh && cached && cached.length > 0) {
          setLinks(cached);
        }

        const netState = await NetInfo.fetch();
        const isOnline = Boolean(netState.isConnected && netState.isInternetReachable !== false);

        let resolved = cached ?? [];

        if (isOnline) {
          const fetched = await youtubeService.getLinks();
          if (fetched.length > 0) {
            resolved = fetched;
            setLinks(fetched);
          }
        } else if (cached && cached.length > 0) {
          setError('Offline: showing cached videos.');
        }

        if (resolved.length === 0) {
          setError(isOnline ? 'No videos available yet.' : 'No internet connection and no cached videos.');
          setSelectedId(null);
          return;
        }

        const hasCurrent = selectedId ? resolved.some((link) => link.id === selectedId) : false;
        if (!hasCurrent) {
          const dailyRandom = await youtubeService.getDailyRandomLink(resolved);
          if (dailyRandom) {
            setSelectedId(dailyRandom.id);
          }
        }
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [selectedId]
  );

  useEffect(() => {
    let isActive = true;
    const run = async () => {
      if (!isActive) {
        return;
      }
      await fetchLinks(false);
    };

    run();
    return () => {
      isActive = false;
    };
  }, [fetchLinks]);

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener((state) => {
      const isOnline = Boolean(state.isConnected && state.isInternetReachable !== false);
      const wasOnline = wasOnlineRef.current;

      // Sync once when connection is regained.
      if (wasOnline === false && isOnline) {
        fetchLinks(true);
      }

      wasOnlineRef.current = isOnline;
    });

    return () => {
      unsubscribe();
    };
  }, [fetchLinks]);

  const dynamicStyles = {
    container: tw`flex-1 ${isDarkMode ? 'bg-dark-primary-10' : 'bg-primary-1'}`,
    card: [
      tw`rounded-2xl ${isDarkMode ? 'bg-dark-primary-8' : 'bg-primary-3'}`,
      getCardStyle(),
    ],
    title: tw`text-base font-nokia-bold ${isDarkMode ? 'text-dark-secondary-1' : 'text-secondary-10'}`,
    subtitle: tw`text-sm font-nokia-bold ${isDarkMode ? 'text-primary-7' : 'text-primary-10'}`,
    meta: tw`text-xs font-nokia-bold ${isDarkMode ? 'text-primary-6' : 'text-secondary-6'}`,
  };

  const renderPinnedTop = () => (
    <View style={[tw`px-5 pb-4`, { paddingTop: headerTopPadding }]}>
      <View style={tw`flex-row items-center mb-4`}>
        <MusicalNoteIcon size={28} color="#EA9215" />
        <Text style={tw`text-2xl font-nokia-bold ml-3 ${isDarkMode ? 'text-dark-secondary-1' : 'text-secondary-10'}`}>
          Music Videos
        </Text>
      </View>

      {loading && links.length === 0 ? (
        <View style={tw`py-10 items-center`}>
          <ActivityIndicator size="large" color={tw.color('accent-6')} />
        </View>
      ) : selectedLink ? (
        <View style={[dynamicStyles.card, tw`p-4`]}>
          <Text style={[dynamicStyles.title, tw`mb-3`]} numberOfLines={2}>
            {selectedLink.title}
          </Text>
          <View style={tw`items-center`}>
            <View style={tw`overflow-hidden rounded-xl bg-black`}>
              <YoutubePlayer
                key={selectedLink.id}
                height={playerHeight}
                width={playerWidth}
                play={false}
                videoId={selectedLink.videoId}
                forceAndroidAutoplay
                webViewProps={{
                  mediaPlaybackRequiresUserAction: false,
                  allowsInlineMediaPlayback: true,
                }}
                initialPlayerParams={{
                  controls: true,
                  rel: false,
                  modestbranding: true,
                  iv_load_policy: 3,
                }}
                onError={(playerErr: string) => {
                  if (playerErr === 'video_not_found') {
                    setPlayerError('This video is unavailable.');
                    return;
                  }
                  if (playerErr === 'embed_not_allowed') {
                    setPlayerError('This video cannot be embedded (YouTube error 153). Please pick another video.');
                    return;
                  }
                  setPlayerError('Unable to load this video. Please try another one.');
                }}
              />
            </View>
          </View>
          {playerError ? (
            <Text style={tw`mt-3 text-xs font-nokia-bold text-red-500`}>
              {playerError}
            </Text>
          ) : null}
          {selectedLink.channelTitle ? (
            <Text style={[dynamicStyles.subtitle, tw`mt-3`]} numberOfLines={1}>
              {selectedLink.channelTitle}
            </Text>
          ) : null}
        </View>
      ) : (
        <View style={[dynamicStyles.card, tw`p-6 items-center`]}>
          <Text style={dynamicStyles.subtitle}>No videos yet.</Text>
        </View>
      )}

      {error ? (
        <View style={tw`mt-4`}>
          <Text style={tw`text-sm font-nokia-bold text-red-500`}>{error}</Text>
        </View>
      ) : null}
    </View>
  );

  const renderListHeader = () => (
    <View style={tw`px-5 pt-2 pb-2`}>
      <Text style={dynamicStyles.subtitle}>All Videos</Text>
    </View>
  );

  const renderItem = ({ item }: { item: YouTubeLink }) => {
    const isActive = item.id === selectedLink?.id;
    return (
      <TouchableOpacity
        onPress={() => {
          setPlayerError(null);
          setSelectedId(item.id);
        }}
        style={[
          tw`flex-row items-center mx-5 mb-3 p-3 rounded-2xl ${isDarkMode ? 'bg-dark-primary-8' : 'bg-primary-3'}`,
          getCardStyle(),
          isActive ? tw`border border-accent-6` : null,
        ]}
        activeOpacity={0.8}
      >
        <View style={tw`relative`}>
          {item.thumbnailUrl ? (
            <Image
              source={{ uri: item.thumbnailUrl }}
              style={tw`w-24 h-16 rounded-lg`}
              resizeMode="cover"
            />
          ) : (
            <View style={tw`w-24 h-16 rounded-lg bg-gray-200 items-center justify-center`}>
              <PlayIcon size={20} color="#EA9215" />
            </View>
          )}
          {item.duration ? (
            <View style={tw`absolute bottom-1 right-1 bg-black/70 px-1.5 py-0.5 rounded-md`}>
              <Text style={tw`text-[10px] text-white font-nokia-bold`}>{item.duration}</Text>
            </View>
          ) : null}
        </View>
        <View style={tw`ml-3 flex-1`}>
          <Text style={[dynamicStyles.title, tw`text-sm`]} numberOfLines={2}>
            {item.title}
          </Text>
          {item.channelTitle ? (
            <Text style={[dynamicStyles.meta, tw`mt-1`]} numberOfLines={1}>
              {item.channelTitle}
            </Text>
          ) : null}
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={dynamicStyles.container}>
      <SafeAreaView style={tw`flex-1`} edges={['left', 'right']}>
        {renderPinnedTop()}
        <FlatList
          data={links}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          ListHeaderComponent={renderListHeader}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: contentBottomPadding }}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => fetchLinks(true)}
              tintColor={tw.color('accent-6')}
            />
          }
          ListEmptyComponent={
            !loading ? (
              <View style={tw`px-5 pb-10`}>
                <Text style={dynamicStyles.subtitle}>No videos available yet.</Text>
              </View>
            ) : null
          }
        />
      </SafeAreaView>
    </View>
  );
};

export default MusicPlayer;
