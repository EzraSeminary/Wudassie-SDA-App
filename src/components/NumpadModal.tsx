import React, { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { useSelector } from 'react-redux';
import BottomSheet, { BottomSheetBackdrop, BottomSheetView } from '@gorhom/bottom-sheet';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { RootState } from '../store';
import tw from '../../tailwind';
import { XMarkIcon } from 'react-native-heroicons/outline';

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
  title 
}) => {
  const [inputValue, setInputValue] = useState('');
  const isDarkMode = useSelector((state: RootState) => state.theme.isDarkMode);
  const insets = useSafeAreaInsets();
  const bottomSheetRef = useRef<BottomSheet>(null);
  
  // Snap points for the bottom sheet
  const snapPoints = useMemo(() => ['70%'], []);

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
        opacity={0.5}
        pressBehavior="close"
      />
    ),
    []
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
      backgroundStyle={tw`${isDarkMode ? 'bg-dark-primary-8' : 'bg-primary-1'}`}
      handleIndicatorStyle={tw`w-12 h-1.5 rounded-full ${isDarkMode ? 'bg-dark-primary-6' : 'bg-primary-6'}`}
      bottomInset={0}
    >
      <BottomSheetView style={tw`flex-1 px-5`}>
        {/* Header */}
        <View style={tw`flex-row justify-between items-center mb-4 px-1`}>
          <Text style={tw`text-xl font-nokia-bold ${isDarkMode ? 'text-dark-secondary-1' : 'text-secondary-10'}`}>
            Jump to {title}
          </Text>
          <TouchableOpacity onPress={handleClose} style={tw`p-2`} activeOpacity={0.7}>
            <XMarkIcon size={24} color={isDarkMode ? '#FDFDFD' : '#1A2024'} />
          </TouchableOpacity>
        </View>

        {/* Display */}
        <View style={tw`h-20 rounded-xl mb-4 justify-center items-center border-2 ${isDarkMode ? 'bg-dark-primary-10 border-dark-primary-6' : 'bg-primary-3 border-primary-6'}`}>
          <Text style={tw`text-4xl font-nokia-bold ${isDarkMode ? 'text-white' : 'text-black'}`}>
            {inputValue || '0'}
          </Text>
        </View>

        <Text style={tw`text-sm font-nokia-bold text-center mt-2 ${isDarkMode ? 'text-primary-7' : 'text-primary-10'}`}>
          Enter number (1 - {maxSongs})
        </Text>

        {inputValue !== '' && !isValidNumber() && (
          <Text style={tw`text-sm font-nokia-bold text-red-500 text-center mt-2`}>
            Please enter a number between 1 and {maxSongs}
          </Text>
        )}

        {/* Keypad */}
        <View style={tw`mt-3`}>
          {/* Row 1 */}
          <View style={tw`flex-row gap-2 mb-2.5`}>
            <TouchableOpacity onPress={() => handleNumberPress('1')} activeOpacity={0.7} style={tw`flex-1`}>
              <View style={tw`h-16 p-4 rounded-xl justify-center items-center ${isDarkMode ? 'bg-dark-primary-6' : 'bg-primary-6'}`}>
                <Text style={tw`text-3xl font-nokia-bold ${isDarkMode ? 'text-white' : 'text-black'}`}>1</Text>
              </View>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => handleNumberPress('2')} activeOpacity={0.7} style={tw`flex-1`}>
              <View style={tw`h-16 p-4 rounded-xl justify-center items-center ${isDarkMode ? 'bg-dark-primary-6' : 'bg-primary-6'}`}>
                <Text style={tw`text-3xl font-nokia-bold ${isDarkMode ? 'text-white' : 'text-black'}`}>2</Text>
              </View>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => handleNumberPress('3')} activeOpacity={0.7} style={tw`flex-1`}>
              <View style={tw`h-16 p-4 rounded-xl justify-center items-center ${isDarkMode ? 'bg-dark-primary-6' : 'bg-primary-6'}`}>
                <Text style={tw`text-3xl font-nokia-bold ${isDarkMode ? 'text-white' : 'text-black'}`}>3</Text>
              </View>
            </TouchableOpacity>
          </View>

          {/* Row 2 */}
          <View style={tw`flex-row gap-2 mb-2.5`}>
            <TouchableOpacity onPress={() => handleNumberPress('4')} activeOpacity={0.7} style={tw`flex-1`}>
              <View style={tw`h-16 p-4 rounded-xl justify-center items-center ${isDarkMode ? 'bg-dark-primary-6' : 'bg-primary-6'}`}>
                <Text style={tw`text-3xl font-nokia-bold ${isDarkMode ? 'text-white' : 'text-black'}`}>4</Text>
              </View>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => handleNumberPress('5')} activeOpacity={0.7} style={tw`flex-1`}>
              <View style={tw`h-16 p-4 rounded-xl justify-center items-center ${isDarkMode ? 'bg-dark-primary-6' : 'bg-primary-6'}`}>
                <Text style={tw`text-3xl font-nokia-bold ${isDarkMode ? 'text-white' : 'text-black'}`}>5</Text>
              </View>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => handleNumberPress('6')} activeOpacity={0.7} style={tw`flex-1`}>
              <View style={tw`h-16 p-4 rounded-xl justify-center items-center ${isDarkMode ? 'bg-dark-primary-6' : 'bg-primary-6'}`}>
                <Text style={tw`text-3xl font-nokia-bold ${isDarkMode ? 'text-white' : 'text-black'}`}>6</Text>
              </View>
            </TouchableOpacity>
          </View>

          {/* Row 3 */}
          <View style={tw`flex-row gap-2 mb-2.5`}>
            <TouchableOpacity onPress={() => handleNumberPress('7')} activeOpacity={0.7} style={tw`flex-1`}>
              <View style={tw`h-16 p-4 rounded-xl justify-center items-center ${isDarkMode ? 'bg-dark-primary-6' : 'bg-primary-6'}`}>
                <Text style={tw`text-3xl font-nokia-bold ${isDarkMode ? 'text-white' : 'text-black'}`}>7</Text>
              </View>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => handleNumberPress('8')} activeOpacity={0.7} style={tw`flex-1`}>
              <View style={tw`h-16 p-4 rounded-xl justify-center items-center ${isDarkMode ? 'bg-dark-primary-6' : 'bg-primary-6'}`}>
                <Text style={tw`text-3xl font-nokia-bold ${isDarkMode ? 'text-white' : 'text-black'}`}>8</Text>
              </View>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => handleNumberPress('9')} activeOpacity={0.7} style={tw`flex-1`}>
              <View style={tw`h-16 p-4 rounded-xl justify-center items-center ${isDarkMode ? 'bg-dark-primary-6' : 'bg-primary-6'}`}>
                <Text style={tw`text-3xl font-nokia-bold ${isDarkMode ? 'text-white' : 'text-black'}`}>9</Text>
              </View>
            </TouchableOpacity>
          </View>

          {/* Row 4 */}
          <View style={tw`flex-row gap-2 mb-2.5`}>
            <TouchableOpacity onPress={handleClear} activeOpacity={0.7} style={tw`flex-1`}>
              <View style={tw`h-16 p-4 rounded-xl justify-center items-center bg-accent-6`}>
                <Text style={tw`text-base font-nokia-bold text-white`}>Clear</Text>
              </View>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => handleNumberPress('0')} activeOpacity={0.7} style={tw`flex-1`}>
              <View style={tw`h-16 p-4 rounded-xl justify-center items-center ${isDarkMode ? 'bg-dark-primary-6' : 'bg-primary-6'}`}>
                <Text style={tw`text-3xl font-nokia-bold ${isDarkMode ? 'text-white' : 'text-black'}`}>0</Text>
              </View>
            </TouchableOpacity>
            <TouchableOpacity onPress={handleBackspace} activeOpacity={0.7} style={tw`flex-1`}>
              <View style={tw`h-16 p-4 rounded-xl justify-center items-center bg-accent-6`}>
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
            <View style={tw`w-full h-16 rounded-xl justify-center items-center mt-4 ${isValidNumber() ? 'bg-accent-6' : 'bg-gray-400'}`}>
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

export default NumpadModal; 