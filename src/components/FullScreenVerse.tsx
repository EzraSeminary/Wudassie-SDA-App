import React, { useEffect } from 'react';
import { View, Text, ScrollView, StatusBar } from 'react-native';
import Orientation from 'react-native-orientation-locker';
import { RouteProp, useIsFocused } from '@react-navigation/native';
import { RootStackParamList } from '../../App';
import tw from './../../tailwind';
import NavigationBar from 'react-native-system-navigation-bar';

type FullScreenVerseRouteProp = RouteProp<RootStackParamList, 'FullScreenVerse'>;

const FullScreenVerse = ({ route }: { route: FullScreenVerseRouteProp }) => {
  const { song, songNumber } = route.params;
  const isFocused = useIsFocused();

  useEffect(() => {
    // Lock orientation to landscape mode
    Orientation.lockToLandscape();

    // Unlock orientation when leaving the screen
    return () => {
      Orientation.unlockAllOrientations();
    };
  }, []);

  // Hide the status bar and navigation bar when this screen is focused
  useEffect(() => {
    if (isFocused) {
      StatusBar.setHidden(true); // Hide the status bar
      NavigationBar.navigationHide(); // Hide the Android navigation bar
    } else {
      StatusBar.setHidden(false); // Show the status bar
      NavigationBar.navigationShow(); // Show the Android navigation bar
    }

    return () => {
      NavigationBar.navigationShow(); // Ensure the navigation bar is restored when leaving
    };
  }, [isFocused]);

  return (
    <View style={tw`flex-1 bg-primary-1`}>
      <ScrollView contentContainerStyle={tw`p-5`}>
        <Text style={tw`text-4xl font-nokia-bold text-center mb-4 text-secondary-10`}>
          {songNumber}. {song.title}
        </Text>
        {song.lyrics.split('\\n').map((line: string, index: number) => (
          <Text key={index} style={tw`font-nokia-bold text-accent-7 mb-1`}>
            {line}
          </Text>
        ))}
      </ScrollView>
    </View>
  );
};

export default FullScreenVerse;
