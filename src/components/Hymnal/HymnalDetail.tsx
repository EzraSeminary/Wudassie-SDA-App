import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableWithoutFeedback, SafeAreaView } from 'react-native';
import { RouteProp, useRoute } from '@react-navigation/native';
import { RootStackParamList } from '../../../App';
import { ArrowLeftIcon, ArrowsPointingOutIcon, HashtagIcon } from 'react-native-heroicons/outline';
import FontSizePopup from './../CustomBottomSheet';
import NumpadModal from './../NumpadModal';
import FullScreenVerse from './../FullScreenVerse';
import { getCardStyle } from '../../utils/platformUtils';
import tw from '../../../tailwind';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { runOnJS } from 'react-native-reanimated';
import { syncService } from '../../services/syncService';
import hymnalData from './HymnalData.json';

const HymnalDetail = () => {
  const [song, setSong] = useState<any>(null);
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [showFontSizePopup, setShowFontSizePopup] = useState(false);
  const [showNumpad, setShowNumpad] = useState(false);
  const [fontSize, setFontSize] = useState(18);
  const route = useRoute<RouteProp<RootStackParamList, 'HymnalDetail'>>();
  const { id } = route.params;

  useEffect(() => {
    const loadSong = async () => {
      // Try to get data from sync service first
      const localData = await syncService.getLocalData('hymnal');
      const data = localData || hymnalData;
      const foundSong = data.find((s: any) => s.id === id);
      if (foundSong) {
        setSong(foundSong);
      }
    };

    loadSong();
  }, [id]);

  // ... rest of the component code ...
}; 
