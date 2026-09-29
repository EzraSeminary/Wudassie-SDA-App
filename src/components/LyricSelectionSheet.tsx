import React from 'react';
import { Modal, Pressable, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { BlurView } from '@react-native-community/blur';
import { PhotoIcon, XMarkIcon } from 'react-native-heroicons/outline';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import tw from '../../tailwind';
import { getDefaultFontStyle } from '../utils/platformUtils';
import { glassSurface, useGlassTheme } from './glass/GlassBackground';
import type { LyricSelection } from './SelectableLyrics';

type LyricSelectionSheetProps = {
  visible: boolean;
  selection: LyricSelection | null;
  onClose: () => void;
  onCreateImage: () => void;
};

const LyricSelectionSheet = ({
  visible,
  selection,
  onClose,
  onCreateImage,
}: LyricSelectionSheetProps) => {
  const insets = useSafeAreaInsets();
  const glass = useGlassTheme();

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      statusBarTranslucent
      onRequestClose={onClose}
    >
      <View style={tw`flex-1 justify-end`}>
        <Pressable
          style={[
            tw`absolute inset-0`,
            { backgroundColor: glass.isDarkMode ? 'rgba(0,0,0,0.62)' : 'rgba(0,0,0,0.38)' },
          ]}
          onPress={onClose}
        />
        <View
          style={[
            tw`max-h-[52%] rounded-t-3xl overflow-hidden`,
            { backgroundColor: glass.strongGlass },
          ]}
        >
          <BlurView
            pointerEvents="none"
            blurType={glass.isDarkMode ? 'dark' : 'light'}
            blurAmount={22}
            overlayColor={glass.strongGlass}
            reducedTransparencyFallbackColor={glass.strongGlass}
            style={tw`absolute inset-0`}
          />
          <View style={[tw`self-center w-12 h-1.5 rounded-full mt-3 mb-2`, { backgroundColor: glass.border }]} />
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={[tw`px-5 pt-1`, { paddingBottom: Math.max(insets.bottom, 12) + 18 }]}
          >
            <View style={tw`flex-row items-center justify-between mb-3`}>
              <View style={tw`flex-1 pr-4`}>
                <Text style={[tw`text-xs font-nokia-bold uppercase`, { color: glass.accent }]}>
                  Selected lyrics
                </Text>
                <Text
                  numberOfLines={1}
                  style={[
                    tw`text-lg font-nokia-bold mt-1`,
                    getDefaultFontStyle('bold'),
                    { color: glass.text },
                  ]}
                >
                  Create a worship image
                </Text>
              </View>
              <TouchableOpacity onPress={onClose} style={tw`w-10 h-10 items-center justify-center`}>
                <XMarkIcon size={22} color={glass.mutedText} />
              </TouchableOpacity>
            </View>

            <View style={[tw`rounded-2xl px-4 py-3 mb-4`, glassSurface(glass, true)]}>
              <Text
                numberOfLines={4}
                style={[
                  tw`font-nokia-bold`,
                  getDefaultFontStyle('bold'),
                  {
                    color: glass.text,
                    fontSize: 16,
                    lineHeight: 23,
                  },
                ]}
              >
                {selection?.text}
              </Text>
            </View>

            <TouchableOpacity
              onPress={onCreateImage}
              activeOpacity={0.86}
              style={[
                tw`rounded-2xl py-4 px-5 flex-row items-center justify-center`,
                { backgroundColor: glass.accent },
              ]}
            >
              <PhotoIcon size={21} color="#FFFFFF" />
              <Text style={[tw`text-white font-nokia-bold text-base ml-2`, getDefaultFontStyle('bold')]}>
                Create Image
              </Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

export default LyricSelectionSheet;
