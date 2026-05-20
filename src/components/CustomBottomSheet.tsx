import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, TouchableOpacity, Modal, Pressable } from 'react-native';
import Slider from '@react-native-community/slider';
import { useSelector, useDispatch } from 'react-redux';
import { RootState, setFontSizeWithPersistence, AppDispatch } from '../store';
import tw from './../../tailwind';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MinusIcon, PlusIcon } from 'react-native-heroicons/outline';

type FontSizePopupProps = {
  visible: boolean;
  onClose: () => void;
  previewText?: string;
};

const MIN_FONT_SIZE = 12;
const MAX_FONT_SIZE = 32;

const FontSizePopup = ({ visible, onClose, previewText = 'የሱስ ክርስቶስ የኔ ወዳጅ' }: FontSizePopupProps) => {
  const fontSize = useSelector((state: RootState) => state.fontSize.fontSize);
  const isDarkMode = useSelector((state: RootState) => state.theme.isDarkMode);
  const dispatch = useDispatch<AppDispatch>();
  const [draftFontSize, setDraftFontSize] = useState(fontSize);
  const insets = useSafeAreaInsets();

  useEffect(() => {
    if (visible) {
      setDraftFontSize(fontSize);
    }
  }, [visible, fontSize]);

  const updateFontSize = useCallback((next: number) => {
    setDraftFontSize(next);
    dispatch(setFontSizeWithPersistence(next));
  }, [dispatch]);

  const adjustFontSize = (delta: number) => {
    const next = Math.min(MAX_FONT_SIZE, Math.max(MIN_FONT_SIZE, draftFontSize + delta));
    updateFontSize(next);
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
      onRequestClose={onClose}
    >
      <Pressable
        onPress={onClose}
        style={tw`flex-1 justify-end bg-black/30`}
      >
        <Pressable
          onPress={(event) => event.stopPropagation()}
          style={[
            tw`${isDarkMode ? 'bg-dark-primary-8' : 'bg-primary-1'} rounded-t-[32px] px-5 pt-4`,
            { paddingBottom: Math.max(insets.bottom, 10) },
          ]}
        >
          <View style={tw`self-center mb-3 h-1 w-10 rounded-full ${isDarkMode ? 'bg-dark-primary-6' : 'bg-primary-6'}`} />

          <View style={tw`flex-row items-center justify-between mb-3`}>
            <Text style={tw`text-lg font-nokia-bold ${isDarkMode ? 'text-dark-secondary-1' : 'text-secondary-10'}`}>
              Font Size
            </Text>
            <Text style={tw`text-sm font-nokia-bold text-accent-6`}>{draftFontSize}</Text>
          </View>

          <View style={tw`flex-row items-center mb-3`}>
            <TouchableOpacity
              onPress={() => adjustFontSize(-1)}
              activeOpacity={0.8}
              style={tw`mr-3 h-10 w-10 rounded-full items-center justify-center ${isDarkMode ? 'bg-dark-primary-10' : 'bg-primary-2'}`}
            >
              <MinusIcon size={16} color={isDarkMode ? '#F3F4F6' : '#1F2937'} />
            </TouchableOpacity>

            <Slider
              style={tw`flex-1 h-10`}
              minimumValue={MIN_FONT_SIZE}
              maximumValue={MAX_FONT_SIZE}
              step={1}
              value={draftFontSize}
              onValueChange={(value) => setDraftFontSize(Math.round(value))}
              onSlidingComplete={(value) => updateFontSize(Math.round(value))}
              minimumTrackTintColor="#EA9215"
              maximumTrackTintColor={isDarkMode ? '#3A4750' : '#D5D9E0'}
              thumbTintColor="#EA9215"
            />

            <TouchableOpacity
              onPress={() => adjustFontSize(1)}
              activeOpacity={0.8}
              style={tw`ml-3 h-10 w-10 rounded-full items-center justify-center bg-accent-6`}
            >
              <PlusIcon size={16} color="#FFFFFF" />
            </TouchableOpacity>
          </View>

          <Text
            numberOfLines={1}
            style={[
              tw`text-center font-nokia-bold mb-1 ${isDarkMode ? 'text-dark-secondary-1' : 'text-secondary-10'}`,
              {
                fontSize: Math.min(draftFontSize, 22),
                lineHeight: Math.round(Math.min(draftFontSize, 22) * 1.35),
              },
            ]}
          >
            {previewText}
          </Text>
        </Pressable>
      </Pressable>
    </Modal>
  );
};

export default FontSizePopup;
