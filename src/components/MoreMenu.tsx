import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  TouchableWithoutFeedback,
} from 'react-native';
import {
  MusicalNoteIcon,
  DocumentTextIcon,
  AdjustmentsHorizontalIcon,
} from 'react-native-heroicons/outline';
import { useSelector } from 'react-redux';
import { RootState } from '../store';
import tw from '../../tailwind';
import { getDefaultFontStyle } from '../utils/platformUtils';
import BottomSheet, { BottomSheetView, BottomSheetBackdrop } from '@gorhom/bottom-sheet';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRef, useMemo, useCallback, useEffect } from 'react';

interface MoreMenuProps {
  visible: boolean;
  onClose: () => void;
  onFontSize: () => void;
  onSheetMusic?: () => void;
  onAudio?: () => void;
  hasSheetMusic?: boolean;
  hasAudio?: boolean;
}

const MoreMenu: React.FC<MoreMenuProps> = ({
  visible,
  onClose,
  onFontSize,
  onSheetMusic,
  onAudio,
  hasSheetMusic = false,
  hasAudio = false,
}) => {
  const isDarkMode = useSelector((state: RootState) => state.theme.isDarkMode);
  const insets = useSafeAreaInsets();
  const bottomSheetRef = useRef<BottomSheet>(null);
  const snapPoints = useMemo(() => ['40%'], []);

  useEffect(() => {
    if (visible) {
      bottomSheetRef.current?.expand();
    } else {
      bottomSheetRef.current?.close();
    }
  }, [visible]);

  const handleSheetChanges = useCallback((index: number) => {
    if (index === -1) {
      onClose();
    }
  }, [onClose]);

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

  const menuItems = [
    {
      id: 'fontSize',
      label: 'Font Size',
      icon: AdjustmentsHorizontalIcon,
      onPress: () => {
        onFontSize();
        bottomSheetRef.current?.close();
      },
      show: true,
    },
    {
      id: 'sheetMusic',
      label: 'Sheet Music',
      icon: DocumentTextIcon,
      onPress: () => {
        onSheetMusic?.();
        bottomSheetRef.current?.close();
      },
      show: hasSheetMusic,
    },
    {
      id: 'audio',
      label: 'Audio',
      icon: MusicalNoteIcon,
      onPress: () => {
        onAudio?.();
        bottomSheetRef.current?.close();
      },
      show: hasAudio,
    },
  ].filter(item => item.show);

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
      bottomInset={insets.bottom}
    >
      <BottomSheetView style={tw`flex-1 px-5`}>
        <View style={tw`py-4`}>
          <Text
            style={[
              tw`text-xl font-nokia-bold mb-4 ${isDarkMode ? 'text-dark-secondary-1' : 'text-secondary-10'}`,
              getDefaultFontStyle('bold'),
            ]}
          >
            More Options
          </Text>

          {menuItems.map((item) => {
            const Icon = item.icon;
            return (
              <TouchableOpacity
                key={item.id}
                onPress={item.onPress}
                activeOpacity={0.7}
                style={tw`flex-row items-center py-4 border-b ${isDarkMode ? 'border-dark-primary-6' : 'border-primary-6'}`}
              >
                <View
                  style={tw`w-12 h-12 rounded-xl items-center justify-center mr-4 ${
                    isDarkMode ? 'bg-dark-primary-6' : 'bg-primary-6'
                  }`}
                >
                  <Icon
                    size={24}
                    color={isDarkMode ? '#FDFDFD' : '#1A2024'}
                  />
                </View>
                <Text
                  style={[
                    tw`text-lg flex-1 ${isDarkMode ? 'text-dark-secondary-1' : 'text-secondary-10'}`,
                    getDefaultFontStyle('bold'),
                  ]}
                >
                  {item.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Safe area padding */}
        <View style={{ height: insets.bottom }} />
      </BottomSheetView>
    </BottomSheet>
  );
};

export default MoreMenu;

