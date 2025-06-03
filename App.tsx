/**
 * Sample React Native App
 * https://github.com/facebook/react-native
 *
 * @format
 */

import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Provider, useSelector } from 'react-redux';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'react-native';
import store, { RootState } from './src/store';
import SongList from './src/components/SongList';
import SongDetail from './src/components/SongDetail';
import HagerignaList from './src/components/Hagerigna/HagerignaList';
import HagerignaDetail from './src/components/Hagerigna/HagerignaDetail';
import Settings from './src/components/Settings/Settings';
import MusicPlayer from './src/components/YoutubeLink/YouTubeLinks';
import { BookOpenIcon, MusicalNoteIcon, PlayIcon, Cog6ToothIcon} from 'react-native-heroicons/outline';

export type RootStackParamList = {
  SongDetail: { song: { title: string; lyrics: string; }, songNumber: number };
  SongList: undefined;
  HagerignaList: undefined;
  HagerignaDetail: {
    song: {
      title: string;
      lyrics: string;
      singer: string;
    }, songNumber: number
  };
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

const Tab = createBottomTabNavigator();

const TabNavigator = () => {
  const isDarkMode = useSelector((state: RootState) => state.theme.isDarkMode);
  
  return (
    <>
      <StatusBar 
        barStyle={isDarkMode ? 'light-content' : 'dark-content'}
        backgroundColor={isDarkMode ? '#1A2024' : '#FDFDFD'}
        translucent={false}
      />
      <Tab.Navigator 
        screenOptions={({ route }) => ({
          headerShown: false,
          tabBarIcon: ({ color, size }) => {
            let IconComponent;

            if (route.name === 'Hymnals') {
              IconComponent = BookOpenIcon;
            } else if (route.name === 'Hagerigna') {
              IconComponent = MusicalNoteIcon;
            } else if (route.name === 'Music Player') {
              IconComponent = PlayIcon;
            } else if (route.name === 'Settings') {
              IconComponent = Cog6ToothIcon;
            }

            return IconComponent ? <IconComponent size={size} color={color} /> : null;
          },
          tabBarActiveTintColor: '#EA9215',
          tabBarInactiveTintColor: isDarkMode ? '#9CA3AF' : '#6B7280',
          tabBarStyle: {
            backgroundColor: isDarkMode ? '#1A2024' : '#FDFDFD',
            borderTopColor: isDarkMode ? '#374151' : '#E5E7EB',
            position: 'absolute',
            height: 85,
            paddingBottom: 20,
            paddingTop: 10,
            elevation: 0,
            shadowOpacity: 0,
          },
          tabBarLabelStyle: {
            fontFamily: 'Nokia-Bold',
            fontSize: 12,
          },
        })}
      >
        <Tab.Screen name="Hymnals" component={SongStack} />
        <Tab.Screen name="Hagerigna" component={HagerignaStack} />
        <Tab.Screen name="Music Player" component={MusicPlayer} />
        <Tab.Screen name="Settings" component={Settings} />
      </Tab.Navigator>
    </>
  );
};

function App(): React.JSX.Element {
  return (
    <SafeAreaProvider>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <Provider store={store}>
          <NavigationContainer>
            <TabNavigator />
          </NavigationContainer>
        </Provider>
      </GestureHandlerRootView>
    </SafeAreaProvider>
  );
}

export default App;
