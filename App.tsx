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
import { Provider } from 'react-redux';
import store from './src/store';
import SongList from './src/components/SongList';
import SongDetail from './src/components/SongDetail';
import HagerignaList from './src/components/Hagerigna/HagerignaList';
import HagerignaDetail from './src/components/Hagerigna/HagerignaDetail';
import YouTubeLinks from './src/components/YoutubeLink/YouTubeLinks';
import Settings from './src/components/Settings/Settings';

export type RootStackParamList = {
  SongDetail: { song: { title: string; lyrics: string; }, songNumber: number };
  SongList: undefined;
  HagerignaList: undefined;
  HagerignaDetail: {
    song: {
      title: string;
      lyrics: string;
    }, songNumber: number
  };
};

const Stack = createNativeStackNavigator<RootStackParamList>();

const SongStack = () => (
  <Stack.Navigator initialRouteName="SongList">
    <Stack.Screen 
      name="SongList" 
      component={SongList}
      options={{title: 'Songs'}}
    />
    <Stack.Screen 
      name="SongDetail" 
      component={SongDetail}
      options={({route}) => ({title: route.params.song.title})}
    />
  </Stack.Navigator>
);

const HagerignaStack = () => (
  <Stack.Navigator initialRouteName="HagerignaList">
    <Stack.Screen 
      name="HagerignaList" 
      component={HagerignaList}
      options={{title: 'Songs'}}
    />
    <Stack.Screen 
      name="HagerignaDetail" 
      component={HagerignaDetail}
      options={({route}) => ({title: route.params.song.title})}
    />
  </Stack.Navigator>
);

const Tab = createBottomTabNavigator();

const TabNavigator = () => (
  <Tab.Navigator screenOptions={{headerShown: false}}>
    <Tab.Screen name="Hymn Songs" component={SongStack} />
    <Tab.Screen name="Hagerigna Songs" component={HagerignaStack} />
    <Tab.Screen name="YouTube Links" component={YouTubeLinks} />
    <Tab.Screen name="Settings" component={Settings} />
  </Tab.Navigator>
);

function App(): React.JSX.Element {
  return (
    <Provider store={store}>
      <NavigationContainer>
        <TabNavigator />
      </NavigationContainer>
    </Provider>
  );
}

export default App;
