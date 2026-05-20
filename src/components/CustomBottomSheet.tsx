import React, { useEffect, useRef, useCallback, useState } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { useSelector, useDispatch } from 'react-redux';
import { RootState, setFontSizeWithPersistence, AppDispatch } from '../store';
import tw from './../../tailwind';
import BottomSheet, { BottomSheetView, BottomSheetBackdrop } from '@gorhom/bottom-sheet';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MinusIcon, PlusIcon } from 'react-native-heroicons/outline';
import { getDefaultFontStyle } from '../utils/platformUtils';

type FontSizePopupProps = {
  visible: boolean;
  onClose: () => void;
  previewText?: string;
};

const MIN_FONT_SIZE = 12;
const MAX_FONT_SIZE = 32;

const FontSizePopup = ({
  visible,
  onClose,
  previewText = 'የሱስ ክርስቶስ የኔ ወዳጅ',
}: FontSizePopupProps) => {
  const fontSize = useSelector((state: RootState) => state.fontSize.fontSize);
  const isDarkMode = useSelector((state: RootState) => state.theme.isDarkMode);
  const dispatch = useDispatch<AppDispatch>();

  // Snapshot font size only when the sheet opens; don't re-sync while open
  const [draftFontSize, setDraftFontSize] = useState(fontSize);

  const bottomSheetRef = useRef<BottomSheet>(null);
  const insets = useSafeAreaInsets();

  // Mirror MoreMenu exactly: both index prop + ref calls
  useEffect(() => {
    if (visible) {
      setDraftFontSize(fontSize); // snapshot on open
      bottomSheetRef.current?.expand();
    } else {
      bottomSheetRef.current?.close();
    }
    // intentionally only [visible] — not fontSize
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible]);

  const handleSheetChanges = useCallback(
    (index: number) => {
      if (index === -1) onClose();
    },
    [onClose],
  );

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
    [],
  );

  const commitFontSize = useCallback(
    (next: number) => {
      const clamped = Math.min(MAX_FONT_SIZE, Math.max(MIN_FONT_SIZE, next));
      setDraftFontSize(clamped);
      dispatch(setFontSizeWithPersistence(clamped));
    },
    [dispatch],
  );

  const progress = (draftFontSize - MIN_FONT_SIZE) / (MAX_FONT_SIZE - MIN_FONT_SIZE);

  return (
    <BottomSheet
      ref={bottomSheetRef}
      index={visible ? 0 : -1}
      enableDynamicSizing
      onChange={handleSheetChanges}
      enablePanDownToClose
      backdropComponent={renderBackdrop}
      backgroundStyle={isDarkMode ? tw`bg-dark-primary-8` : tw`bg-primary-1`}
      handleIndicatorStyle={[
        tw`w-12 h-1.5 rounded-full`,
        isDarkMode ? tw`bg-dark-primary-6` : tw`bg-primary-6`,
      ]}
    >
      <BottomSheetView style={tw`px-5 pt-1`}>
        {/* Title + value */}
        <View style={tw`flex-row items-center justify-between mb-5`}>
          <Text
            style={[
              tw`text-xl font-nokia-bold ${isDarkMode ? 'text-dark-secondary-1' : 'text-secondary-10'}`,
              getDefaultFontStyle('bold'),
            ]}
          >
            Font Size
          </Text>
          <Text style={tw`text-base font-nokia-bold text-accent-6`}>
            {draftFontSize}
          </Text>
        </View>

        {/* − track + */}
        <View style={tw`flex-row items-center mb-5`}>
          <TouchableOpacity
            onPress={() => commitFontSize(draftFontSize - 1)}
            activeOpacity={0.75}
            style={[
              tw`h-11 w-11 rounded-full items-center justify-center`,
              isDarkMode ? tw`bg-dark-primary-10` : tw`bg-primary-2`,
            ]}
          >
            <MinusIcon size={18} color={isDarkMode ? '#F3F4F6' : '#1F2937'} />
          </TouchableOpacity>

          {/* Custom track */}
          <View style={tw`flex-1 mx-3`}>
            {/* Background track */}
            <View
              style={[
                tw`h-2 rounded-full w-full`,
                isDarkMode ? tw`bg-dark-primary-6` : tw`bg-primary-5`,
              ]}
            />
            {/* Filled portion */}
            <View
              style={[
                tw`h-2 rounded-full bg-accent-6 absolute top-0 left-0`,
                { width: `${Math.round(progress * 100)}%` },
              ]}
            />
            {/* Step dots for − and + */}
            <View style={tw`flex-row justify-between mt-2`}>
              <Text
                style={tw`text-xs font-nokia-bold ${isDarkMode ? 'text-dark-primary-6' : 'text-primary-8'}`}
              >
                A
              </Text>
              <Text
                style={tw`text-base font-nokia-bold ${isDarkMode ? 'text-dark-primary-6' : 'text-primary-8'}`}
              >
                A
              </Text>
            </View>
          </View>

          <TouchableOpacity
            onPress={() => commitFontSize(draftFontSize + 1)}
            activeOpacity={0.75}
            style={tw`h-11 w-11 rounded-full items-center justify-center bg-accent-6`}
          >
            <PlusIcon size={18} color="#FFFFFF" />
          </TouchableOpacity>
        </View>

        {/* Preview */}
        <View
          style={[
            tw`rounded-xl p-4 items-center`,
            isDarkMode ? tw`bg-dark-primary-10` : tw`bg-primary-2`,
          ]}
        >
          <Text
            numberOfLines={2}
            style={[
              tw`text-center font-nokia-bold ${isDarkMode ? 'text-dark-secondary-1' : 'text-secondary-10'}`,
              getDefaultFontStyle('bold'),
              {
                fontSize: draftFontSize,
                lineHeight: Math.round(draftFontSize * 1.45),
              },
            ]}
          >
            {previewText}
          </Text>
        </View>

        <View style={{ height: Math.max(insets.bottom, 8) }} />
      </BottomSheetView>
    </BottomSheet>
  );
};

export default FontSizePopup;
