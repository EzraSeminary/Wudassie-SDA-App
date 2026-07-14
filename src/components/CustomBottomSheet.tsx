import React, { useEffect, useRef, useCallback, useState } from 'react';
import { StyleSheet, Switch, View, Text, TouchableOpacity } from 'react-native';
import { useSelector, useDispatch } from 'react-redux';
import { RootState, setFontSizeWithPersistence, toggleDarkModeWithPersistence, setGlassPaletteWithPersistence, AppDispatch } from '../store';
import tw from './../../tailwind';
import BottomSheet, { BottomSheetView, BottomSheetBackdrop } from '@gorhom/bottom-sheet';
import { BlurView } from '@react-native-community/blur';
import Slider from '@react-native-community/slider';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { getDefaultFontStyle } from '../utils/platformUtils';
import { glassPaletteOptions, glassSurface, useGlassTheme } from './glass/GlassBackground';

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
  const selectedPalette = useSelector((state: RootState) => state.theme.glassPalette);
  const glass = useGlassTheme();
  const dispatch = useDispatch<AppDispatch>();

  // Snapshot font size only when the sheet opens; don't re-sync while open
  const [draftFontSize, setDraftFontSize] = useState(fontSize);

  const bottomSheetRef = useRef<BottomSheet>(null);
  const insets = useSafeAreaInsets();
  const snapPoints = useRef(['62%']).current;

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
      if (index === -1) {
        onClose();
      }
    },
    [onClose],
  );

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
    [glass.isDarkMode],
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

  const commitFontSize = useCallback((next: number) => {
    const clamped = Math.min(MAX_FONT_SIZE, Math.max(MIN_FONT_SIZE, Math.round(next)));
    setDraftFontSize(clamped);
    dispatch(setFontSizeWithPersistence(clamped));
  }, [dispatch]);

  return (
    <BottomSheet
      ref={bottomSheetRef}
      index={visible ? 0 : -1}
      snapPoints={snapPoints}
      onChange={handleSheetChanges}
      enablePanDownToClose
      backdropComponent={renderBackdrop}
      backgroundComponent={renderBackground}
      handleIndicatorStyle={[tw`w-12 h-1.5 rounded-full`, { backgroundColor: glass.border }]}
      bottomInset={insets.bottom}
    >
      <BottomSheetView style={[tw`px-5 pt-1`, { paddingBottom: Math.max(insets.bottom, 8) + 18 }]}>
        {/* Title + value */}
        <View style={tw`flex-row items-center justify-between mb-5`}>
          <Text
            style={[
              tw`text-xl font-nokia-bold`,
              getDefaultFontStyle('bold'),
              { color: glass.text },
            ]}
          >
            Font Size
          </Text>
          <Text style={[tw`text-base font-nokia-bold`, { color: glass.accent }]}>
            {draftFontSize}
          </Text>
        </View>

        <View style={tw`mb-5`}>
          <Slider
            style={tw`h-10`}
            minimumValue={MIN_FONT_SIZE}
            maximumValue={MAX_FONT_SIZE}
            step={1}
            value={draftFontSize}
            onValueChange={(value) => setDraftFontSize(Math.round(value))}
            onSlidingComplete={commitFontSize}
            minimumTrackTintColor={glass.accent}
            maximumTrackTintColor={glass.border}
            thumbTintColor={glass.accent}
          />
          <View style={tw`flex-row justify-between px-1 mt-1`}>
            <Text style={[tw`text-xs font-nokia-bold`, { color: glass.mutedText }]}>A</Text>
            <Text style={[tw`text-base font-nokia-bold`, { color: glass.mutedText }]}>A</Text>
          </View>
        </View>

        {/* Preview */}
        <View
          style={[
            tw`rounded-xl p-4 items-center`,
            glassSurface(glass, true),
          ]}
        >
          <Text
            numberOfLines={2}
            style={[
              tw`text-center font-nokia-bold`,
              getDefaultFontStyle('bold'),
              {
                color: glass.text,
                fontSize: draftFontSize,
                lineHeight: Math.round(draftFontSize * 1.45),
              },
            ]}
          >
            {previewText}
          </Text>
        </View>

        <View style={[tw`mt-5 rounded-xl p-4`, glassSurface(glass, true)]}>
          <View style={tw`flex-row items-center justify-between mb-4`}>
            <View>
              <Text style={[tw`text-base font-nokia-bold`, { color: glass.text }]}>Dark Mode</Text>
              <Text style={[tw`text-xs font-nokia-bold mt-1`, { color: glass.mutedText }]}>
                Switch the reading theme
              </Text>
            </View>
            <Switch
              value={isDarkMode}
              onValueChange={() => dispatch(toggleDarkModeWithPersistence())}
              trackColor={{ false: glass.border, true: glass.accent }}
              thumbColor="#FFFFFF"
            />
          </View>
          <Text style={[tw`text-sm font-nokia-bold mb-3`, { color: glass.text }]}>Theme</Text>
          <View style={tw`flex-row flex-wrap -mx-1`}>
            {glassPaletteOptions.map((palette) => {
              const active = selectedPalette === palette.id;
              return (
                <TouchableOpacity
                  key={palette.id}
                  onPress={() => dispatch(setGlassPaletteWithPersistence(palette.id))}
                  activeOpacity={0.82}
                  style={[
                    tw`px-3 py-3 m-1 rounded-2xl flex-row items-center`,
                    glassSurface(glass),
                    { flexBasis: '47%', minHeight: 48 },
                    active ? { backgroundColor: glass.accent } : null,
                  ]}
                >
                  <View
                    style={[
                      tw`w-4 h-4 rounded-full mr-2`,
                      { backgroundColor: palette.accent, borderWidth: 1, borderColor: 'rgba(255,255,255,0.7)' },
                    ]}
                  />
                  <Text style={[tw`font-nokia-bold flex-1`, { color: active ? '#FFFFFF' : glass.text }]} numberOfLines={1}>
                    {palette.name}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
      </BottomSheetView>
    </BottomSheet>
  );
};

export default FontSizePopup;

const styles = StyleSheet.create({
  sheetBackground: {
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    borderWidth: 1,
    overflow: 'hidden',
  },
  sheetBlur: {
    ...StyleSheet.absoluteFillObject,
  },
});
