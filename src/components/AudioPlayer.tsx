import React, { useState } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  Linking,
  Alert,
} from 'react-native';
import { XMarkIcon, PlayIcon, ArrowTopRightOnSquareIcon } from 'react-native-heroicons/outline';
import { useSelector } from 'react-redux';
import { RootState } from '../store';
import tw from '../../tailwind';
import { getDefaultFontStyle } from '../utils/platformUtils';

interface AudioPlayerProps {
  visible: boolean;
  onClose: () => void;
  audioUrl: string;
  title?: string;
}

const AudioPlayer: React.FC<AudioPlayerProps> = ({
  visible,
  onClose,
  audioUrl,
  title,
}) => {
  const isDarkMode = useSelector((state: RootState) => state.theme.isDarkMode);

  const handlePlayAudio = async () => {
    try {
      const supported = await Linking.canOpenURL(audioUrl);
      if (supported) {
        await Linking.openURL(audioUrl);
      } else {
        Alert.alert('Error', 'Cannot open this audio URL');
      }
    } catch (error) {
      console.error('Error opening audio URL:', error);
      Alert.alert('Error', 'Failed to open audio');
    }
  };

  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={handleClose}
    >
      <View style={tw`flex-1 justify-end bg-black bg-opacity-50`}>
        <View
          style={tw`bg-white rounded-t-3xl ${isDarkMode ? 'bg-dark-primary-8' : 'bg-primary-1'}`}
        >
          {/* Header */}
          <View style={tw`flex-row items-center justify-between px-5 py-4 border-b ${isDarkMode ? 'border-dark-primary-6' : 'border-primary-6'}`}>
            <View style={tw`flex-1`}>
              {title && (
                <Text
                  style={[
                    tw`text-lg font-nokia-bold ${isDarkMode ? 'text-dark-secondary-1' : 'text-secondary-10'}`,
                    getDefaultFontStyle('bold'),
                  ]}
                  numberOfLines={1}
                >
                  {title}
                </Text>
              )}
              <Text
                style={[
                  tw`text-sm mt-1 ${isDarkMode ? 'text-dark-secondary-3' : 'text-secondary-8'}`,
                  getDefaultFontStyle('regular'),
                ]}
              >
                Audio Player
              </Text>
            </View>
            <TouchableOpacity onPress={handleClose} style={tw`p-2`}>
              <XMarkIcon
                size={24}
                color={isDarkMode ? '#FDFDFD' : '#1A2024'}
              />
            </TouchableOpacity>
          </View>

          {/* Content */}
          <View style={tw`p-5 items-center`}>
            <View style={tw`py-10 items-center`}>
              {/* Play Button */}
              <TouchableOpacity
                onPress={handlePlayAudio}
                style={tw`w-20 h-20 rounded-full bg-accent-6 items-center justify-center mb-6`}
              >
                <PlayIcon size={40} color="#FFFFFF" />
              </TouchableOpacity>

              <Text
                style={[
                  tw`text-center mb-4 ${isDarkMode ? 'text-dark-secondary-2' : 'text-secondary-9'}`,
                  getDefaultFontStyle('regular'),
                ]}
              >
                Tap to play audio in your device's default player
              </Text>

              <TouchableOpacity
                onPress={handlePlayAudio}
                style={tw`flex-row items-center px-6 py-3 bg-accent-6 rounded-lg`}
              >
                <ArrowTopRightOnSquareIcon size={20} color="#FFFFFF" />
                <Text
                  style={[
                    tw`text-white font-nokia-bold ml-2`,
                    getDefaultFontStyle('bold'),
                  ]}
                >
                  Open Audio
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </View>
    </Modal>
  );
};

export default AudioPlayer;

