import React from 'react';
import { View, Text, Modal, Button } from 'react-native';
import Slider from '@react-native-community/slider';
import { useSelector, useDispatch } from 'react-redux';
import { RootState, setFontSize } from '../store';
import tw from './../../tailwind';

const FontSizePopup = ({ visible, onClose }: { visible: boolean; onClose: () => void }) => {
  const fontSize = useSelector((state: RootState) => state.fontSize.fontSize);
  const isDarkMode = useSelector((state: RootState) => state.theme.isDarkMode);
  const dispatch = useDispatch();

  return (
    <Modal
      animationType="slide"
      transparent={true}
      visible={visible}
      onRequestClose={onClose}
    >
      <View style={tw`flex-1 justify-center items-center bg-black bg-opacity-50`}>
        <View style={tw`w-75 p-5 rounded-xl items-center ${isDarkMode ? 'bg-dark-primary-8' : 'bg-primary-1'}`}>
          <Text style={tw`text-lg font-nokia-bold mb-4 ${isDarkMode ? 'text-dark-secondary-1' : 'text-secondary-10'}`}>
            Adjust Font Size
          </Text>
          <Slider
            style={tw`w-50 h-10 mb-4`}
            minimumValue={10}
            maximumValue={30}
            value={fontSize}
            onValueChange={(value) => dispatch(setFontSize(value))}
            minimumTrackTintColor="#EA9215"
            maximumTrackTintColor={isDarkMode ? '#3A4750' : '#EEEEEE'}
          />
          <Button title="Close" onPress={onClose} />
        </View>
      </View>
    </Modal>
  );
};

export default FontSizePopup;