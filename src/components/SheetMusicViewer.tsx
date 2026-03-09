import React, { useState } from 'react';
import {
  View,
  Text,
  Modal,
  Image,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  ActivityIndicator,
} from 'react-native';
import { XMarkIcon, ChevronLeftIcon, ChevronRightIcon } from 'react-native-heroicons/outline';
import { useSelector } from 'react-redux';
import { RootState } from '../store';
import tw from '../../tailwind';
import { getDefaultFontStyle } from '../utils/platformUtils';

interface SheetMusicViewerProps {
  visible: boolean;
  onClose: () => void;
  images: string[];
  title?: string;
}

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

const SheetMusicViewer: React.FC<SheetMusicViewerProps> = ({
  visible,
  onClose,
  images,
  title,
}) => {
  const isDarkMode = useSelector((state: RootState) => state.theme.isDarkMode);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);

  const handlePrevious = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
      setLoading(true);
    }
  };

  const handleNext = () => {
    if (currentIndex < images.length - 1) {
      setCurrentIndex(currentIndex + 1);
      setLoading(true);
    }
  };

  if (!visible || images.length === 0) return null;

  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={tw`flex-1 bg-black bg-opacity-90`}>
        {/* Header */}
        <View
          style={[
            tw`flex-row items-center justify-between px-5 py-4`,
            { paddingTop: 50 },
          ]}
        >
          <View style={tw`flex-1`}>
            {title && (
              <Text
                style={[
                  tw`text-lg font-nokia-bold ${isDarkMode ? 'text-white' : 'text-white'}`,
                  getDefaultFontStyle('bold'),
                ]}
                numberOfLines={1}
              >
                {title}
              </Text>
            )}
            <Text
              style={[
                tw`text-sm mt-1 ${isDarkMode ? 'text-gray-300' : 'text-gray-300'}`,
                getDefaultFontStyle('regular'),
              ]}
            >
              {currentIndex + 1} of {images.length}
            </Text>
          </View>
          <TouchableOpacity onPress={onClose} style={tw`p-2`}>
            <XMarkIcon size={28} color="#FFFFFF" />
          </TouchableOpacity>
        </View>

        {/* Image Container */}
        <View style={tw`flex-1 justify-center items-center`}>
          <ScrollView
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            onMomentumScrollEnd={(event) => {
              const index = Math.round(
                event.nativeEvent.contentOffset.x / SCREEN_WIDTH
              );
              setCurrentIndex(index);
              setLoading(true);
            }}
            style={tw`flex-1`}
            contentContainerStyle={tw`items-center justify-center`}
          >
            {images.map((imageUri, index) => (
              <View
                key={index}
                style={{
                  width: SCREEN_WIDTH,
                  height: SCREEN_HEIGHT * 0.7,
                  justifyContent: 'center',
                  alignItems: 'center',
                }}
              >
                {loading && (
                  <ActivityIndicator
                    size="large"
                    color="#EA9215"
                    style={tw`absolute`}
                  />
                )}
                <Image
                  source={{ uri: imageUri }}
                  style={{
                    width: SCREEN_WIDTH - 40,
                    height: SCREEN_HEIGHT * 0.7,
                    resizeMode: 'contain',
                  }}
                  onLoad={() => setLoading(false)}
                  onError={() => setLoading(false)}
                />
              </View>
            ))}
          </ScrollView>
        </View>

        {/* Navigation Controls */}
        <View style={tw`flex-row justify-between items-center px-5 py-4`}>
          <TouchableOpacity
            onPress={handlePrevious}
            disabled={currentIndex === 0}
            style={[
              tw`p-3 rounded-full ${isDarkMode ? 'bg-dark-primary-8' : 'bg-gray-800'}`,
              currentIndex === 0 && tw`opacity-50`,
            ]}
          >
            <ChevronLeftIcon
              size={24}
              color={currentIndex === 0 ? '#666' : '#FFFFFF'}
            />
          </TouchableOpacity>

          <View style={tw`flex-row`}>
            {images.map((_, index) => (
              <View
                key={index}
                style={[
                  tw`w-2 h-2 rounded-full mx-1`,
                  index === currentIndex
                    ? tw`bg-accent-6`
                    : tw`${isDarkMode ? 'bg-dark-primary-6' : 'bg-gray-600'}`,
                ]}
              />
            ))}
          </View>

          <TouchableOpacity
            onPress={handleNext}
            disabled={currentIndex === images.length - 1}
            style={[
              tw`p-3 rounded-full ${isDarkMode ? 'bg-dark-primary-8' : 'bg-gray-800'}`,
              currentIndex === images.length - 1 && tw`opacity-50`,
            ]}
          >
            <ChevronRightIcon
              size={24}
              color={currentIndex === images.length - 1 ? '#666' : '#FFFFFF'}
            />
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

export default SheetMusicViewer;

