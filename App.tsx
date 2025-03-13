/**
 * Sample React Native App
 * https://github.com/facebook/react-native
 *
 * @format
 */

import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import SongList from './src/components/SongList';
import SongDetail from './src/components/SongDetail';

export type RootStackParamList = {
  SongList: undefined;
  SongDetail: {
    song: {
      title: string;
      lyrics: string;
    };
  };
};

const Stack = createNativeStackNavigator<RootStackParamList>();

function App(): React.JSX.Element {
  return (
    <NavigationContainer>
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
    </NavigationContainer>
  );
}

export default App;
