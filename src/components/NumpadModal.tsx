import React, { useState } from 'react';
import { View, Text, TouchableWithoutFeedback, Modal } from 'react-native';
import { useSelector } from 'react-redux';
import { RootState } from '../store';
import { getCardStyle } from '../utils/platformUtils';
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
    const songNumber = parseInt(inputValue);
    if (songNumber >= 1 && songNumber <= maxSongs) {
      onJumpToSong(songNumber);
      setInputValue('');
      onClose();
    }
  };

  const handleClose = () => {
    setInputValue('');
    onClose();
  };

  const isValidNumber = () => {
    const num = parseInt(inputValue);
    return inputValue !== '' && num >= 1 && num <= maxSongs;
  };

  const dynamicStyles = {
    container: tw`flex-1 justify-center items-center ${isDarkMode ? 'bg-black bg-opacity-50' : 'bg-black bg-opacity-50'}`,
    modal: [
      tw`w-80 rounded-2xl p-6 ${isDarkMode ? 'bg-dark-primary-8' : 'bg-primary-1'}`,
      getCardStyle()
    ],
    title: tw`text-xl font-nokia-bold text-center mb-4 ${isDarkMode ? 'text-dark-secondary-1' : 'text-secondary-10'}`,
    display: [
      tw`h-16 rounded-lg mb-4 justify-center items-center border-2 ${isDarkMode ? 'bg-dark-primary-10 border-dark-primary-6' : 'bg-primary-3 border-primary-6'}`,
      getCardStyle()
    ],
    displayText: tw`text-2xl font-nokia-bold ${isDarkMode ? 'text-dark-secondary-1' : 'text-secondary-10'}`,
    keypadRow: tw`flex-row justify-between mb-3`,
    keypadButton: [
      tw`w-20 h-14 rounded-lg justify-center items-center ${isDarkMode ? 'bg-dark-primary-6' : 'bg-primary-6'}`,
      getCardStyle()
    ],
    keypadButtonText: tw`text-xl font-nokia-bold ${isDarkMode ? 'text-dark-secondary-1' : 'text-secondary-10'}`,
    actionButton: [
      tw`w-20 h-14 rounded-lg justify-center items-center bg-accent-6`,
      getCardStyle()
    ],
    actionButtonText: tw`text-lg font-nokia-bold text-primary-1`,
    invalidText: tw`text-sm font-nokia-bold text-red-500 text-center mt-2`,
    rangeText: tw`text-sm font-nokia-bold text-center mt-2 ${isDarkMode ? 'text-primary-7' : 'text-primary-10'}`,
    goButton: [
      tw`w-full h-14 rounded-lg justify-center items-center mt-4`,
      getCardStyle()
    ]
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={handleClose}
    >
      <View style={dynamicStyles.container}>
        <View style={dynamicStyles.modal}>
          <View style={tw`flex-row justify-between items-center mb-4`}>
            <Text style={dynamicStyles.title}>Jump to {title}</Text>
            <TouchableWithoutFeedback onPress={handleClose}>
              <View style={tw`p-2`}>
                <XMarkIcon size={24} color={isDarkMode ? '#FDFDFD' : '#1A2024'} />
              </View>
            </TouchableWithoutFeedback>
          </View>

          <View style={dynamicStyles.display}>
            <Text style={dynamicStyles.displayText}>
              {inputValue || '0'}
            </Text>
          </View>

          <Text style={dynamicStyles.rangeText}>
            Enter number (1 - {maxSongs})
          </Text>

          {inputValue !== '' && !isValidNumber() && (
            <Text style={dynamicStyles.invalidText}>
              Please enter a number between 1 and {maxSongs}
            </Text>
          )}

          <View style={tw`mt-4`}>
            {/* Row 1 */}
            <View style={dynamicStyles.keypadRow}>
              <TouchableWithoutFeedback onPress={() => handleNumberPress('1')}>
                <View style={dynamicStyles.keypadButton}>
                  <Text style={dynamicStyles.keypadButtonText}>1</Text>
                </View>
              </TouchableWithoutFeedback>
              <TouchableWithoutFeedback onPress={() => handleNumberPress('2')}>
                <View style={dynamicStyles.keypadButton}>
                  <Text style={dynamicStyles.keypadButtonText}>2</Text>
                </View>
              </TouchableWithoutFeedback>
              <TouchableWithoutFeedback onPress={() => handleNumberPress('3')}>
                <View style={dynamicStyles.keypadButton}>
                  <Text style={dynamicStyles.keypadButtonText}>3</Text>
                </View>
              </TouchableWithoutFeedback>
            </View>

            {/* Row 2 */}
            <View style={dynamicStyles.keypadRow}>
              <TouchableWithoutFeedback onPress={() => handleNumberPress('4')}>
                <View style={dynamicStyles.keypadButton}>
                  <Text style={dynamicStyles.keypadButtonText}>4</Text>
                </View>
              </TouchableWithoutFeedback>
              <TouchableWithoutFeedback onPress={() => handleNumberPress('5')}>
                <View style={dynamicStyles.keypadButton}>
                  <Text style={dynamicStyles.keypadButtonText}>5</Text>
                </View>
              </TouchableWithoutFeedback>
              <TouchableWithoutFeedback onPress={() => handleNumberPress('6')}>
                <View style={dynamicStyles.keypadButton}>
                  <Text style={dynamicStyles.keypadButtonText}>6</Text>
                </View>
              </TouchableWithoutFeedback>
            </View>

            {/* Row 3 */}
            <View style={dynamicStyles.keypadRow}>
              <TouchableWithoutFeedback onPress={() => handleNumberPress('7')}>
                <View style={dynamicStyles.keypadButton}>
                  <Text style={dynamicStyles.keypadButtonText}>7</Text>
                </View>
              </TouchableWithoutFeedback>
              <TouchableWithoutFeedback onPress={() => handleNumberPress('8')}>
                <View style={dynamicStyles.keypadButton}>
                  <Text style={dynamicStyles.keypadButtonText}>8</Text>
                </View>
              </TouchableWithoutFeedback>
              <TouchableWithoutFeedback onPress={() => handleNumberPress('9')}>
                <View style={dynamicStyles.keypadButton}>
                  <Text style={dynamicStyles.keypadButtonText}>9</Text>
                </View>
              </TouchableWithoutFeedback>
            </View>

            {/* Row 4 */}
            <View style={dynamicStyles.keypadRow}>
              <TouchableWithoutFeedback onPress={handleClear}>
                <View style={dynamicStyles.actionButton}>
                  <Text style={dynamicStyles.actionButtonText}>Clear</Text>
                </View>
              </TouchableWithoutFeedback>
              <TouchableWithoutFeedback onPress={() => handleNumberPress('0')}>
                <View style={dynamicStyles.keypadButton}>
                  <Text style={dynamicStyles.keypadButtonText}>0</Text>
                </View>
              </TouchableWithoutFeedback>
              <TouchableWithoutFeedback onPress={handleBackspace}>
                <View style={dynamicStyles.actionButton}>
                  <Text style={dynamicStyles.actionButtonText}>⌫</Text>
                </View>
              </TouchableWithoutFeedback>
            </View>

            {/* Go Button */}
            <TouchableWithoutFeedback 
              onPress={handleGo}
              disabled={!isValidNumber()}
            >
              <View style={[
                dynamicStyles.goButton,
                isValidNumber() ? tw`bg-accent-6` : tw`bg-gray-400`
              ]}>
                <Text style={tw`text-lg font-nokia-bold text-primary-1`}>
                  GO
                </Text>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </View>
      </View>
    </Modal>
  );
};

export default NumpadModal; 