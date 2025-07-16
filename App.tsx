/**
 * Sample React Native App
 * https://github.com/facebook/react-native
 *
 * @format
 */

import React, { useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Provider, useSelector, useDispatch } from 'react-redux';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar, Platform } from 'react-native';
import store, { RootState, loadTheme, AppDispatch } from './src/store';
import SongList from './src/components/SongList';
import SongDetail from './src/components/SongDetail';
import HagerignaList from './src/components/Hagerigna/HagerignaList';
import HagerignaDetail from './src/components/Hagerigna/HagerignaDetail';
import Settings from './src/components/Settings/Settings';
import MusicPlayer from './src/components/YoutubeLink/YouTubeLinks';
import FavoritesList from './src/components/Favorites/FavoritesList';
import { BookOpenIcon, MusicalNoteIcon, PlayIcon, Cog6ToothIcon, HeartIcon } from 'react-native-heroicons/outline';
import { syncService } from './src/services/syncService';
import NetInfo from '@react-native-community/netinfo';
import { HagerignaHymn } from './src/services/hymnalService';
import Toast from 'react-native-toast-message';

export type RootStackParamList = {
  SongDetail: { song: { title: string; lyrics: string; }, songNumber: number };
  SongList: undefined;
  HagerignaList: undefined;
  HagerignaDetail: {
    song: HagerignaHymn;
    songNumber: number;
  };
  FavoritesList: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

const SongStack = () => (
  <Stack.Navigator 
    initialRouteName="SongList"
    screenOptions={{
      headerShown: false,
    }}
  >
    <Stack.Screen 
      name="SongList" 
      component={SongList}
    />
    <Stack.Screen 
      name="SongDetail" 
      component={SongDetail}
    />
  </Stack.Navigator>
);

const HagerignaStack = () => (
  <Stack.Navigator 
    initialRouteName="HagerignaList"
    screenOptions={{
      headerShown: false,
    }}
  >
    <Stack.Screen 
      name="HagerignaList" 
      component={HagerignaList}
    />
    <Stack.Screen 
      name="HagerignaDetail" 
      component={HagerignaDetail}
    />
  </Stack.Navigator>
);

const FavoritesStack = () => (
  <Stack.Navigator
    initialRouteName="FavoritesList"
    screenOptions={{
      headerShown: false,
    }}
  >
    <Stack.Screen
      name="FavoritesList"
      component={FavoritesList}
    />
    <Stack.Screen
      name="HagerignaDetail"
      component={HagerignaDetail}
    />
    <Stack.Screen
      name="SongDetail"
      component={SongDetail}
    />
  </Stack.Navigator>
);

const Tab = createBottomTabNavigator();

const MainTabs = () => {
  const isDarkMode = useSelector((state: RootState) => state.theme.isDarkMode);

  // Memoize the tab bar style to prevent unnecessary re-renders
  const tabBarStyle = React.useMemo(() => ({
    backgroundColor: isDarkMode ? '#1A2024' : '#FDFDFD',
    borderTopColor: isDarkMode ? '#374151' : '#E5E7EB',
    position: 'absolute' as 'absolute',
    height: 85,
    paddingBottom: 20,
    paddingTop: 10,
    elevation: 0,
    ...(Platform.OS === 'ios' && {
      shadowOpacity: 0,
    }),
  }), [isDarkMode]);

  const tabBarInactiveTintColor = React.useMemo(() => 
    isDarkMode ? '#9CA3AF' : '#6B7280', [isDarkMode]
  );

  // Force re-render when theme changes
  const themeKey = isDarkMode ? 'dark' : 'light';

  return (
      <Tab.Navigator 
        key={themeKey}
        screenOptions={({ route }) => ({
          headerShown: false,
          tabBarIcon: ({ color, size }) => {
            let IconComponent;

            if (route.name === 'Hymnals') {
              IconComponent = BookOpenIcon;
            } else if (route.name === 'Hagerigna') {
              IconComponent = MusicalNoteIcon;
          } else if (route.name === 'Favorites') {
            IconComponent = HeartIcon;
            } else if (route.name === 'Music Player') {
              IconComponent = PlayIcon;
            } else if (route.name === 'Settings') {
              IconComponent = Cog6ToothIcon;
            }

            return IconComponent ? <IconComponent size={size} color={color} /> : null;
          },
          tabBarActiveTintColor: '#EA9215',
          tabBarInactiveTintColor: tabBarInactiveTintColor,
          tabBarStyle: tabBarStyle,
          tabBarLabelStyle: {
            fontFamily: 'Nokia-Bold',
            fontSize: 12,
          },
        })}
      >
        <Tab.Screen name="Hymnals" component={SongStack} />
        <Tab.Screen name="Hagerigna" component={HagerignaStack} />
      <Tab.Screen name="Favorites" component={FavoritesStack} />
        <Tab.Screen name="Music Player" component={MusicPlayer} />
        <Tab.Screen name="Settings" component={Settings} />
      </Tab.Navigator>
  );
};

const AppContent = () => {
  const isDarkMode = useSelector((state: RootState) => state.theme.isDarkMode);
  const dispatch = useDispatch<AppDispatch>();

  useEffect(() => {
    // Load saved theme when app starts
    dispatch(loadTheme());
    
    // Check for updates when app starts
    syncService.checkForUpdates();

    // Set up network listener
    const unsubscribe = NetInfo.addEventListener(state => {
      if (state.isConnected) {
        syncService.checkForUpdates();
      }
    });

    return () => {
      unsubscribe();
    };
  }, [dispatch]);

  // Log theme changes for debugging
  useEffect(() => {
    console.log('Theme changed to:', isDarkMode ? 'dark' : 'light');
  }, [isDarkMode]);

  return (
    <>
      <StatusBar 
        barStyle={isDarkMode ? 'light-content' : 'dark-content'}
        backgroundColor={Platform.select({
          android: isDarkMode ? '#1A2024' : '#FDFDFD',
          ios: 'transparent'
        })}
        translucent={Platform.OS === 'android'}
      />
      <NavigationContainer
        theme={{
          dark: isDarkMode,
          colors: {
            primary: '#EA9215',
            background: isDarkMode ? '#1A2024' : '#FDFDFD',
            card: isDarkMode ? '#1A2024' : '#FDFDFD',
            text: isDarkMode ? '#FDFDFD' : '#1A2024',
            border: isDarkMode ? '#374151' : '#E5E7EB',
            notification: '#EA9215',
          },
          fonts: {
            regular: {
              fontFamily: 'Nokia-Bold',
              fontWeight: 'bold',
            },
            medium: {
              fontFamily: 'Nokia-Bold',
              fontWeight: 'bold',
            },
            light: {
              fontFamily: 'Nokia-Bold',
              fontWeight: 'bold',
            },
            thin: {
              fontFamily: 'Nokia-Bold',
              fontWeight: 'bold',
            },
          },
        }}
      >
        <MainTabs key={isDarkMode ? 'dark' : 'light'} />
      </NavigationContainer>
      <Toast />
    </>
  );
};

const App = () => {
  return (
    <SafeAreaProvider>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <Provider store={store}>
          <AppContent />
        </Provider>
      </GestureHandlerRootView>
    </SafeAreaProvider>
  );
};

export default App;
