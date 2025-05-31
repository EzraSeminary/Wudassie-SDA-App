import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { useSelector } from 'react-redux';
import { RootState } from '../../store';
import { MusicalNoteIcon, PlayIcon, BackwardIcon, ForwardIcon, SpeakerWaveIcon } from 'react-native-heroicons/outline';
import tw from '../../../tailwind';

const MusicPlayer = () => {
  const isDarkMode = useSelector((state: RootState) => state.theme.isDarkMode);

  const dynamicStyles = {
    container: tw`flex-1 p-5 pt-12 ${isDarkMode ? 'bg-dark-primary-10' : 'bg-primary-1'}`,
    card: tw`p-8 mb-8 rounded-2xl items-center shadow-sm ${isDarkMode ? 'bg-dark-primary-8' : 'bg-primary-3'}`,
    text: tw`text-base font-nokia-bold ${isDarkMode ? 'text-dark-secondary-1' : 'text-secondary-10'}`,
    subtitle: tw`text-base font-nokia-bold text-center leading-6 mb-1 ${isDarkMode ? 'text-primary-7' : 'text-primary-10'}`,
    subText: tw`text-base font-nokia-regular text-center leading-6 mb-1 ${isDarkMode ? 'text-primary-7' : 'text-primary-10'}`,
    controlButton: tw`p-4 mx-5 ${isDarkMode ? 'bg-dark-primary-8' : 'bg-primary-3'}`
  };

  return (
    <View style={dynamicStyles.container}>
      <View style={tw`flex-row items-center mb-8`}>
        <MusicalNoteIcon size={28} color="#EA9215" />
        <Text style={tw`text-2xl font-nokia-bold ml-3 ${isDarkMode ? 'text-dark-secondary-1' : 'text-secondary-10'}`}>
          Music Player
        </Text>
      </View>

      <View style={dynamicStyles.card}>
        <SpeakerWaveIcon size={80} color="#EA9215" />
        <Text style={[dynamicStyles.text, tw`text-xl font-nokia-bold mt-4 mb-2`]}>
          No Song Selected
        </Text>
        <Text style={[dynamicStyles.subText, tw`text-center mb-8 font-nokia-regular`]}>
          Select a song from the hymnal or hagerigna collection to start playing
        </Text>

        <View style={tw`flex-row items-center justify-center space-x-6`}>
          <TouchableOpacity style={dynamicStyles.controlButton}>
            <BackwardIcon size={24} color={isDarkMode ? '#FDFDFD' : '#1A2024'} />
          </TouchableOpacity>
          
          <TouchableOpacity style={[dynamicStyles.controlButton, tw`bg-orange-500 p-4`]}>
            <PlayIcon size={32} color="#FDFDFD" />
          </TouchableOpacity>
          
          <TouchableOpacity style={dynamicStyles.controlButton}>
            <ForwardIcon size={24} color={isDarkMode ? '#FDFDFD' : '#1A2024'} />
          </TouchableOpacity>
        </View>
      </View>

      <View style={tw`mb-8`}>
        <View style={tw`h-1 bg-gray-200 rounded-full mb-2`}>
          <View style={[tw`h-full bg-accent-6 rounded-full`, { width: '0%' }]} />
        </View>
        <View style={tw`flex-row justify-between`}>
          <Text style={dynamicStyles.subtitle}>0:00</Text>
          <Text style={dynamicStyles.subtitle}>0:00</Text>
        </View>
      </View>

      <View style={[dynamicStyles.card, tw`mb-24`]}>
        <Text style={[dynamicStyles.text, tw`text-lg font-nokia-bold mb-4`]}>
          Coming Soon
        </Text>
        <Text style={dynamicStyles.subtitle}>
          • Play songs from your hymnal collection
        </Text>
        <Text style={dynamicStyles.subtitle}>
          • Background audio playback
        </Text>
        <Text style={dynamicStyles.subtitle}>
          • Playlist management
        </Text>
        <Text style={dynamicStyles.subtitle}>
          • Audio streaming from backend
        </Text>
      </View>
    </View>
  );
};

export default MusicPlayer;