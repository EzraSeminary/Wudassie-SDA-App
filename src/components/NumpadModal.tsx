import React, { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import { StyleSheet, View, Text, TouchableOpacity } from 'react-native';
import BottomSheet, { BottomSheetBackdrop, BottomSheetView } from '@gorhom/bottom-sheet';
import { BlurView } from '@react-native-community/blur';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import tw from '../../tailwind';
import { XMarkIcon } from 'react-native-heroicons/outline';
import { glassSurface, useGlassTheme } from './glass/GlassBackground';

interface NumpadModalProps {
  visible: boolean;
  onClose: () => void;
  onJumpToSong: (songNumber: number) => void;
  maxSongs: number;
  title: string;
}

const NumpadModal: React.FC<NumpadModalProps> = ({
  visible,
  onClose,
  onJumpToSong,
  maxSongs,
  title,
}) => {
  const [inputValue, setInputValue] = useState('');
  const glass = useGlassTheme();
  const insets = useSafeAreaInsets();
  const bottomSheetRef = useRef<BottomSheet>(null);

  // Snap points for the bottom sheet
  const snapPoints = useMemo(() => ['76%'], []);

  // Open/close bottom sheet based on visible prop
  useEffect(() => {
    if (visible) {
      bottomSheetRef.current?.expand();
    } else {
      bottomSheetRef.current?.close();
      setInputValue('');
    }
  }, [visible]);

  // Handle sheet changes
  const handleSheetChanges = useCallback((index: number) => {
    if (index === -1) {
      setInputValue('');
      onClose();
    }
  }, [onClose]);

  const handleNumberPress = (number: string) => {
    if (inputValue.length < 4) { // Limit to 4 digits
      setInputValue(prev => prev + number);
    }
  };

  const handleClear = () => {
    setInputValue('');
  };

  const handleBackspace = () => {
    setInputValue(prev => prev.slice(0, -1));
  };

  const handleGo = () => {
    const songNumber = parseInt(inputValue, 10);
    if (songNumber >= 1 && songNumber <= maxSongs) {
      onJumpToSong(songNumber);
      setInputValue('');
      bottomSheetRef.current?.close();
    }
  };

  const handleClose = () => {
    setInputValue('');
    bottomSheetRef.current?.close();
  };

  // Backdrop component
  const renderBackdrop = useCallback(
    (props: any) => (
      <BottomSheetBackdrop
        {...props}
        disappearsOnIndex={-1}
        appearsOnIndex={0}
        opacity={glass.isDarkMode ? 0.64 : 0.42}
        pressBehavior="close"
      />
    ),
    [glass.isDarkMode]
  );

  const renderBackground = useCallback(
    (props: any) => (
      <View
        pointerEvents="none"
        style={[
          props.style,
          styles.sheetBackground,
          {
            backgroundColor: glass.glass,
            borderColor: glass.border,
          },
        ]}
      >
        <BlurView
          pointerEvents="none"
          blurType={glass.isDarkMode ? 'dark' : 'light'}
          blurAmount={24}
          overlayColor={glass.strongGlass}
          reducedTransparencyFallbackColor={glass.strongGlass}
          style={styles.sheetBlur}
        />
      </View>
    ),
    [glass.border, glass.glass, glass.isDarkMode, glass.strongGlass],
  );

  const isValidNumber = () => {
    const num = parseInt(inputValue, 10);
    return inputValue !== '' && num >= 1 && num <= maxSongs;
  };

  return (
    <BottomSheet
      ref={bottomSheetRef}
      index={visible ? 0 : -1}
      snapPoints={snapPoints}
      onChange={handleSheetChanges}
      enablePanDownToClose={true}
      backdropComponent={renderBackdrop}
      backgroundComponent={renderBackground}
      handleIndicatorStyle={[styles.handleIndicator, { backgroundColor: glass.border }]}
      bottomInset={0}
    >
      <BottomSheetView style={[
        tw`flex-1 px-5`,
        styles.content,
        { paddingBottom: Math.max(insets.bottom, 8) + 88 },
      ]}>
        {/* Header */}
        <View style={tw`flex-row justify-between items-center mb-4 px-1`}>
          <Text style={[tw`text-xl font-nokia-bold`, { color: glass.text }]}>
            Jump to {title}
          </Text>
          <TouchableOpacity onPress={handleClose} style={tw`p-2`} activeOpacity={0.7}>
            <XMarkIcon size={24} color={glass.text} />
          </TouchableOpacity>
        </View>

        {/* Display */}
        <View style={[
          tw`h-20 rounded-xl mb-4 justify-center items-center`,
          styles.display,
          glassSurface(glass),
          { borderColor: glass.border },
        ]}>
          <Text style={[tw`text-4xl font-nokia-bold`, { color: glass.text }]}>
            {inputValue || '0'}
          </Text>
        </View>

        <Text style={[tw`text-sm font-nokia-bold text-center mt-2`, { color: glass.mutedText }]}>
          Enter number (1 - {maxSongs})
        </Text>

        {inputValue !== '' && !isValidNumber() && (
          <Text style={tw`text-sm font-nokia-bold text-red-500 text-center mt-2`}>
            Please enter a number between 1 and {maxSongs}
          </Text>
        )}

        {/* Keypad */}
        <View style={[tw`mt-4`, styles.keypad]}>
          {/* Row 1 */}
          <View style={tw`flex-row gap-2 mb-2.5`}>
            <TouchableOpacity onPress={() => handleNumberPress('1')} activeOpacity={0.7} style={tw`flex-1`}>
              <View style={[tw`h-14 p-3 rounded-xl justify-center items-center`, glassSurface(glass)]}>
                <Text style={[tw`text-3xl font-nokia-bold`, { color: glass.text }]}>1</Text>
              </View>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => handleNumberPress('2')} activeOpacity={0.7} style={tw`flex-1`}>
              <View style={[tw`h-14 p-3 rounded-xl justify-center items-center`, glassSurface(glass)]}>
                <Text style={[tw`text-3xl font-nokia-bold`, { color: glass.text }]}>2</Text>
              </View>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => handleNumberPress('3')} activeOpacity={0.7} style={tw`flex-1`}>
              <View style={[tw`h-14 p-3 rounded-xl justify-center items-center`, glassSurface(glass)]}>
                <Text style={[tw`text-3xl font-nokia-bold`, { color: glass.text }]}>3</Text>
              </View>
            </TouchableOpacity>
          </View>

          {/* Row 2 */}
          <View style={tw`flex-row gap-2 mb-2.5`}>
            <TouchableOpacity onPress={() => handleNumberPress('4')} activeOpacity={0.7} style={tw`flex-1`}>
              <View style={[tw`h-14 p-3 rounded-xl justify-center items-center`, glassSurface(glass)]}>
                <Text style={[tw`text-3xl font-nokia-bold`, { color: glass.text }]}>4</Text>
              </View>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => handleNumberPress('5')} activeOpacity={0.7} style={tw`flex-1`}>
              <View style={[tw`h-14 p-3 rounded-xl justify-center items-center`, glassSurface(glass)]}>
                <Text style={[tw`text-3xl font-nokia-bold`, { color: glass.text }]}>5</Text>
              </View>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => handleNumberPress('6')} activeOpacity={0.7} style={tw`flex-1`}>
              <View style={[tw`h-14 p-3 rounded-xl justify-center items-center`, glassSurface(glass)]}>
                <Text style={[tw`text-3xl font-nokia-bold`, { color: glass.text }]}>6</Text>
              </View>
            </TouchableOpacity>
          </View>

          {/* Row 3 */}
          <View style={tw`flex-row gap-2 mb-2.5`}>
            <TouchableOpacity onPress={() => handleNumberPress('7')} activeOpacity={0.7} style={tw`flex-1`}>
              <View style={[tw`h-14 p-3 rounded-xl justify-center items-center`, glassSurface(glass)]}>
                <Text style={[tw`text-3xl font-nokia-bold`, { color: glass.text }]}>7</Text>
              </View>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => handleNumberPress('8')} activeOpacity={0.7} style={tw`flex-1`}>
              <View style={[tw`h-14 p-3 rounded-xl justify-center items-center`, glassSurface(glass)]}>
                <Text style={[tw`text-3xl font-nokia-bold`, { color: glass.text }]}>8</Text>
              </View>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => handleNumberPress('9')} activeOpacity={0.7} style={tw`flex-1`}>
              <View style={[tw`h-14 p-3 rounded-xl justify-center items-center`, glassSurface(glass)]}>
                <Text style={[tw`text-3xl font-nokia-bold`, { color: glass.text }]}>9</Text>
              </View>
            </TouchableOpacity>
          </View>

          {/* Row 4 */}
          <View style={tw`flex-row gap-2 mb-2.5`}>
            <TouchableOpacity onPress={handleClear} activeOpacity={0.7} style={tw`flex-1`}>
              <View style={[tw`h-14 p-3 rounded-xl justify-center items-center`, { backgroundColor: glass.accent }]}>
                <Text style={tw`text-base font-nokia-bold text-white`}>Clear</Text>
              </View>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => handleNumberPress('0')} activeOpacity={0.7} style={tw`flex-1`}>
              <View style={[tw`h-14 p-3 rounded-xl justify-center items-center`, glassSurface(glass)]}>
                <Text style={[tw`text-3xl font-nokia-bold`, { color: glass.text }]}>0</Text>
              </View>
            </TouchableOpacity>
            <TouchableOpacity onPress={handleBackspace} activeOpacity={0.7} style={tw`flex-1`}>
              <View style={[tw`h-14 p-3 rounded-xl justify-center items-center`, { backgroundColor: glass.accent }]}>
                <Text style={tw`text-3xl font-nokia-bold text-white`}>⌫</Text>
              </View>
            </TouchableOpacity>
          </View>

          {/* Go Button */}
          <TouchableOpacity
            onPress={handleGo}
            disabled={!isValidNumber()}
            activeOpacity={0.8}
          >
            <View style={[
              tw`w-full h-14 rounded-xl justify-center items-center mt-3`,
              !isValidNumber() ? styles.disabledGoButton : null,
              { backgroundColor: isValidNumber() ? glass.accent : glass.mutedText },
            ]}>
              <Text style={tw`text-xl font-nokia-bold text-white`}>
                GO
              </Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* no extra spacer here — BottomSheet bottomInset is set to 0 so sheet sits flush */}
      </BottomSheetView>
    </BottomSheet>
  );
};

const styles = StyleSheet.create({
  sheetBackground: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderWidth: StyleSheet.hairlineWidth,
    overflow: 'hidden',
  },
  content: {
    paddingTop: 10,
  },
  sheetBlur: {
    ...StyleSheet.absoluteFillObject,
  },
  handleIndicator: {
    width: 48,
    height: 5,
    borderRadius: 999,
  },
  display: {
    borderWidth: 1,
  },
  disabledGoButton: {
    opacity: 0.5,
  },
  keypad: {
    marginTop: 'auto',
  },
});

export default NumpadModal;
