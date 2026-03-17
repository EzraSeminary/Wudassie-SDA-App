import React, { useEffect, useState } from 'react';
import { View, Text, Modal, Pressable } from 'react-native';
import Slider from '@react-native-community/slider';
import { useSelector, useDispatch } from 'react-redux';
import { RootState, setFontSize, setFontSizeWithPersistence, AppDispatch } from '../store';
import tw from './../../tailwind';

type FontSizePopupProps = {
  visible: boolean;
  onClose: () => void;
  previewText?: string;
};

const FontSizePopup = ({ visible, onClose, previewText = 'የሱስ ክርስቶስ የኔ ወዳጅ' }: FontSizePopupProps) => {
  const fontSize = useSelector((state: RootState) => state.fontSize.fontSize);
  const isDarkMode = useSelector((state: RootState) => state.theme.isDarkMode);
  const dispatch = useDispatch<AppDispatch>();
  const [draftFontSize, setDraftFontSize] = useState(fontSize);

  useEffect(() => {
    if (visible) {
      setDraftFontSize(fontSize);
    }
  }, [fontSize, visible]);

  const handleValueChange = (value: number) => {
    const nextFontSize = Math.round(value);
    setDraftFontSize(nextFontSize);
    dispatch(setFontSize(nextFontSize));
  };

  const handleSlidingComplete = (value: number) => {
    dispatch(setFontSizeWithPersistence(Math.round(value)));
  };

  const handleClose = () => {
    dispatch(setFontSizeWithPersistence(draftFontSize));
    onClose();
  };

  return (
    <Modal
      animationType="fade"
      transparent
      visible={visible}
      onRequestClose={handleClose}
      statusBarTranslucent
    >
      <Pressable style={tw`flex-1 bg-black/50 justify-center items-center px-6`} onPress={handleClose}>
        <Pressable
          onPress={(event) => event.stopPropagation()}
          style={[
            tw`w-full rounded-2xl px-6 py-7 items-center ${isDarkMode ? 'bg-dark-primary-8' : 'bg-primary-1'}`,
            { maxWidth: 360 },
          ]}
        >
          <Text style={tw`text-xl font-nokia-bold mb-5 ${isDarkMode ? 'text-dark-secondary-1' : 'text-secondary-10'}`}>
            Adjust Font Size
          </Text>
          <Slider
            style={tw`w-full h-10 mb-3`}
            minimumValue={12}
            maximumValue={32}
            step={1}
            value={draftFontSize}
            onValueChange={handleValueChange}
            onSlidingComplete={handleSlidingComplete}
            minimumTrackTintColor="#EA9215"
            maximumTrackTintColor={isDarkMode ? '#3A4750' : '#EEEEEE'}
          />
          <View style={tw`w-full flex-row justify-between mb-4`}>
            <Text style={tw`text-sm font-nokia-bold ${isDarkMode ? 'text-dark-secondary-1' : 'text-secondary-10'}`}>Small</Text>
            <Text style={tw`text-sm font-nokia-bold ${isDarkMode ? 'text-dark-secondary-1' : 'text-secondary-10'}`}>Large</Text>
          </View>
          <Text
            style={[
              tw`text-center font-nokia-bold mb-6 ${isDarkMode ? 'text-dark-secondary-1' : 'text-secondary-10'}`,
              {
                fontSize: draftFontSize,
                lineHeight: Math.round(draftFontSize * 1.65),
                paddingTop: 6,
                paddingBottom: 10,
                includeFontPadding: true,
              },
            ]}
          >
            {previewText}
          </Text>
          <Pressable onPress={handleClose} style={tw`px-6 py-3 rounded-xl bg-accent-6`}>
            <Text style={tw`text-white font-nokia-bold`}>Close</Text>
          </Pressable>
        </Pressable>
      </Pressable>
    </Modal>
  );
};

export default FontSizePopup;
