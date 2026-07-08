import React, { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Dimensions,
  Modal,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { ChevronLeftIcon, ChevronRightIcon, XMarkIcon } from 'react-native-heroicons/outline';
import { useSelector } from 'react-redux';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
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
const MIN_SCALE = 1;
const MAX_SCALE = 4;

interface ZoomableSheetImageProps {
  imageUri: string;
  onLoadStart: () => void;
  onLoadEnd: () => void;
}

const ZoomableSheetImage: React.FC<ZoomableSheetImageProps> = ({
  imageUri,
  onLoadStart,
  onLoadEnd,
}) => {
  const scale = useSharedValue(1);
  const savedScale = useSharedValue(1);
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const startX = useSharedValue(0);
  const startY = useSharedValue(0);

  const resetZoom = () => {
    'worklet';
    scale.value = withTiming(1, { duration: 180 });
    savedScale.value = 1;
    translateX.value = withTiming(0, { duration: 180 });
    translateY.value = withTiming(0, { duration: 180 });
    startX.value = 0;
    startY.value = 0;
  };

  useEffect(() => {
    scale.value = withTiming(1, { duration: 180 });
    savedScale.value = 1;
    translateX.value = withTiming(0, { duration: 180 });
    translateY.value = withTiming(0, { duration: 180 });
    startX.value = 0;
    startY.value = 0;
  }, [imageUri, savedScale, scale, startX, startY, translateX, translateY]);

  const pinchGesture = Gesture.Pinch()
    .onUpdate((event) => {
      const nextScale = Math.min(
        MAX_SCALE,
        Math.max(MIN_SCALE, savedScale.value * event.scale),
      );

      scale.value = nextScale;

      if (nextScale <= MIN_SCALE) {
        translateX.value = 0;
        translateY.value = 0;
      }
    })
    .onEnd(() => {
      savedScale.value = scale.value;

      if (scale.value <= 1.02) {
        resetZoom();
      }
    });

  const panGesture = Gesture.Pan()
    .onBegin(() => {
      startX.value = translateX.value;
      startY.value = translateY.value;
    })
    .onUpdate((event) => {
      if (scale.value <= 1) {
        return;
      }

      translateX.value = startX.value + event.translationX;
      translateY.value = startY.value + event.translationY;
    });

  const doubleTapGesture = Gesture.Tap()
    .numberOfTaps(2)
    .maxDuration(250)
    .onEnd(() => {
      if (scale.value > 1) {
        resetZoom();
        return;
      }

      scale.value = withTiming(2, { duration: 180 });
      savedScale.value = 2;
    });

  const composedGesture = useMemo(
    () => Gesture.Exclusive(doubleTapGesture, Gesture.Simultaneous(panGesture, pinchGesture)),
    [doubleTapGesture, panGesture, pinchGesture],
  );

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: translateX.value },
      { translateY: translateY.value },
      { scale: scale.value },
    ],
  }));

  return (
    <GestureDetector gesture={composedGesture}>
      <View style={tw`flex-1 items-center justify-center overflow-hidden`}>
        <Animated.Image
          source={{ uri: imageUri }}
          resizeMode="contain"
          onLoadStart={onLoadStart}
          onLoad={onLoadEnd}
          onError={onLoadEnd}
          style={[
            {
              width: SCREEN_WIDTH - 24,
              height: SCREEN_HEIGHT * 0.68,
            },
            animatedStyle,
          ]}
        />
      </View>
    </GestureDetector>
  );
};

const SheetMusicViewer: React.FC<SheetMusicViewerProps> = ({
  visible,
  onClose,
  images,
  title,
}) => {
  const isDarkMode = useSelector((state: RootState) => state.theme.isDarkMode);
  const insets = useSafeAreaInsets();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!visible) {
      return;
    }

    setCurrentIndex(0);
    setLoading(true);
  }, [images, visible]);

  const handlePrevious = () => {
    if (currentIndex <= 0) {
      return;
    }

    setCurrentIndex((prev) => prev - 1);
    setLoading(true);
  };

  const handleNext = () => {
    if (currentIndex >= images.length - 1) {
      return;
    }

    setCurrentIndex((prev) => prev + 1);
    setLoading(true);
  };

  if (!visible || images.length === 0) {
    return null;
  }

  const currentImage = images[currentIndex];

  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent
      onRequestClose={onClose}
    >
      <View style={tw`flex-1 bg-black/95`}>
        <SafeAreaView style={tw`flex-1`}>
          <View
            style={[
              tw`flex-row items-center justify-between px-5 py-4`,
              { paddingTop: Math.max(insets.top, 16) },
            ]}
          >
            <View style={tw`flex-1 pr-4`}>
              {title ? (
                <Text
                  style={[
                    tw`text-lg text-white font-nokia-bold`,
                    getDefaultFontStyle('bold'),
                  ]}
                  numberOfLines={1}
                >
                  {title}
                </Text>
              ) : null}
              <Text
                style={[
                  tw`text-sm mt-1 text-gray-300`,
                  getDefaultFontStyle('regular'),
                ]}
              >
                {currentIndex + 1} of {images.length} • Pinch or double tap to zoom
              </Text>
            </View>
            <TouchableOpacity onPress={onClose} style={tw`p-2`}>
              <XMarkIcon size={28} color="#FFFFFF" />
            </TouchableOpacity>
          </View>

          <View style={tw`flex-1 px-3 pb-4`}>
            <View
              style={[
                tw`flex-1 rounded-3xl items-center justify-center ${isDarkMode ? 'bg-dark-primary-10' : 'bg-gray-900'}`,
              ]}
            >
              {loading ? (
                <ActivityIndicator
                  size="large"
                  color="#EA9215"
                  style={tw`absolute z-10`}
                />
              ) : null}

              <ZoomableSheetImage
                imageUri={currentImage}
                onLoadStart={() => setLoading(true)}
                onLoadEnd={() => setLoading(false)}
              />
            </View>
          </View>

          <View style={tw`px-5 pb-6`}>
            <View style={tw`flex-row justify-between items-center`}>
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
                  color={currentIndex === 0 ? '#666666' : '#FFFFFF'}
                />
              </TouchableOpacity>

              <View style={tw`flex-row px-4`}>
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
                  color={currentIndex === images.length - 1 ? '#666666' : '#FFFFFF'}
                />
              </TouchableOpacity>
            </View>
          </View>
        </SafeAreaView>
      </View>
    </Modal>
  );
};

export default SheetMusicViewer;
