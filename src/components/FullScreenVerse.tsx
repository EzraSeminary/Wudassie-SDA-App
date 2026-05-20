import React, { useState, useEffect, useCallback } from 'react';
import { 
  View, 
  Text, 
  TouchableWithoutFeedback, 
  Dimensions, 
  BackHandler,
  StatusBar,
  Platform,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { useSelector } from 'react-redux';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowsPointingInIcon, ChevronLeftIcon, ChevronRightIcon } from 'react-native-heroicons/outline';
import { RootState } from '../store';
import tw from '../../tailwind';
import Orientation from 'react-native-orientation-locker';
import { useNavigation } from '@react-navigation/native';
import KeepAwake from 'react-native-keep-awake';
import FontSizePopup from './CustomBottomSheet';
import SelectableLyrics from './SelectableLyrics';

interface FullScreenVerseProps {
  song: {
    title: string;
    lyrics: string;
    singer?: string;
    verse?: string;
  };
  isVisible: boolean;
  onClose: () => void;
}

interface LyricSection {
  type: 'verse' | 'chorus';
  number?: number;
  content: string;
}

const FullScreenVerse: React.FC<FullScreenVerseProps> = ({ song, isVisible, onClose }) => {
  const isDarkMode = useSelector((state: RootState) => state.theme.isDarkMode);
  const fontSize = useSelector((state: RootState) => state.fontSize.fontSize);
  const navigation = useNavigation();
  const [currentSection, setCurrentSection] = useState(0);
  const [lyricSections, setLyricSections] = useState<LyricSection[]>([]);
  const [screenDimensions, setScreenDimensions] = useState(Dimensions.get('window'));
  const [isFontSizePopupVisible, setIsFontSizePopupVisible] = useState(false);

  // This effect handles showing/hiding the tab bar and status bar
  useEffect(() => {
    const parentNav = navigation.getParent();
    if (isVisible) {
      // Hide the tab bar
      parentNav?.setOptions({
        tabBarStyle: { display: 'none' },
      });
    } else {
      // Restore the tab bar
      parentNav?.setOptions({
        tabBarStyle: { display: 'flex' },
      });
    }
  }, [isVisible, navigation]);

  // Parse lyrics into sections
  const parseLyrics = (lyrics: string): LyricSection[] => {
    if (!lyrics) return [];
    
    // First, replace escaped newlines with actual newlines
    const unescapedLyrics = lyrics.replace(/\\n/g, '\n');
    
    // Split by double newlines to separate sections
    const sections = unescapedLyrics.split(/\n\s*\n/).filter(section => section.trim() !== '');
    const parsedSections: LyricSection[] = [];
    
    sections.forEach(section => {
      const trimmedSection = section.trim();
      if (trimmedSection === '') return;
      
      // Check if it starts with a number (verse)
      const verseMatch = trimmedSection.match(/^(\d+)\.?\s*/);
      if (verseMatch) {
        parsedSections.push({
          type: 'verse',
          number: parseInt(verseMatch[1]),
          content: trimmedSection.replace(/^\d+\.?\s*/, '').trim()
        });
      } else {
        // It's likely a chorus or refrain
        parsedSections.push({
          type: 'chorus',
          content: trimmedSection
        });
      }
    });
    
    return parsedSections;
  };

  const handleClose = useCallback(() => {
    if (Platform.OS === 'ios') {
      Orientation.unlockAllOrientations();
    } else {
      Orientation.unlockAllOrientations();
    }
    onClose();
  }, [onClose]);

  useEffect(() => {
    if (isVisible && song) {
      // Force landscape orientation
      if (Platform.OS === 'ios') {
        Orientation.lockToLandscapeLeft();
      } else {
        Orientation.lockToLandscape();
      }
      
      // Parse the lyrics
      const sections = parseLyrics(song.lyrics || song.verse || '');
      setLyricSections(sections);
      setCurrentSection(0);
      
      // Update screen dimensions
      const updateDimensions = () => {
        setScreenDimensions(Dimensions.get('window'));
      };
      
      const subscription = Dimensions.addEventListener('change', updateDimensions);
      
      // Handle back button on Android
      const backHandler = BackHandler.addEventListener('hardwareBackPress', () => {
        handleClose();
        return true;
      });
      
      return () => {
        subscription?.remove();
        backHandler.remove();
        Orientation.unlockAllOrientations();
      };
    } else {
      // Unlock orientation when not visible
      Orientation.unlockAllOrientations();
    }
  }, [isVisible, song, handleClose]);



  const goToNext = () => {
    if (currentSection < lyricSections.length - 1) {
      setCurrentSection(currentSection + 1);
    }
  };

  const goToPrevious = () => {
    if (currentSection > 0) {
      setCurrentSection(currentSection - 1);
    }
  };

  const handleOpenFontSizePopup = () => setIsFontSizePopupVisible(true);
  const handleCloseFontSizePopup = () => setIsFontSizePopupVisible(false);

  if (!isVisible) {
    return null;
  }

  if (lyricSections.length === 0 && song) {
    const sections = parseLyrics(song.lyrics || song.verse || '');
    setLyricSections(sections);
    setCurrentSection(0);
  }

  if (!lyricSections.length) {
    return null;
  }

  const currentLyricSection = lyricSections[currentSection];
  const isLandscape = screenDimensions.width > screenDimensions.height;

  return (
    <View style={tw`absolute inset-0 z-50`}>
      <StatusBar hidden />
      <KeepAwake />
      <SafeAreaView 
        style={tw`flex-1 ${isDarkMode ? 'bg-dark-primary-10' : 'bg-primary-1'}`}
        edges={['left', 'right']}
      >
        <View style={tw`flex-1 relative`}>
          {/* Header */}
          <View style={tw`flex-row items-center justify-between px-6 py-4 `}>
            <View style={tw`flex-1`}>
              <Text style={tw`text-lg font-nokia-bold ${isDarkMode ? 'text-dark-secondary-1' : 'text-secondary-10'}`}>
               {song.title}
              </Text>
              <Text style={tw`text-sm font-nokia-bold text-accent-6`}>
                {currentLyricSection.type === 'verse' 
                  ? `Slide ${currentLyricSection.number}` 
                  : 'Slide'
                } - {currentSection + 1} of {lyricSections.length}
              </Text>
            </View>
            
            {/* Font Size Button */}
            <TouchableWithoutFeedback onPress={handleOpenFontSizePopup}>
              <View style={tw`p-2 mr-2`}>
                <Text style={[tw`font-nokia-bold text-lg`, { color: isDarkMode ? '#FDFDFD' : '#1A2024' }]}>Aa</Text>
              </View>
            </TouchableWithoutFeedback>
            
            <TouchableWithoutFeedback onPress={handleClose}>
              <View style={tw`p-2`}>
                <ArrowsPointingInIcon 
                  size={24} 
                  color={isDarkMode ? '#FDFDFD' : '#1A2024'} 
                />
              </View>
            </TouchableWithoutFeedback>
          </View>

          {/* Main Content with Navigation Buttons */}
          <View style={tw`flex-1 flex-row items-stretch pb-16`}>
            {/* Left Navigation Button */}
            <TouchableOpacity 
              onPress={goToPrevious}
              style={tw`absolute left-4 z-10 p-4 rounded-full ${
                currentSection === 0 
                  ? (isDarkMode ? 'bg-dark-primary-6' : 'bg-primary-3') 
                  : (isDarkMode ? 'bg-dark-primary-8' : 'bg-primary-2')
              } ${currentSection === 0 ? 'opacity-50' : 'opacity-100'}`}
              disabled={currentSection === 0}
            >
              <ChevronLeftIcon 
                size={32} 
                color={isDarkMode ? '#FDFDFD' : '#1A2024'} 
              />
            </TouchableOpacity>

            {/* Content */}
            <ScrollView
              style={tw`flex-1 mx-16`}
              contentContainerStyle={{
                flexGrow: 1,
                justifyContent: 'center',
                paddingTop: 24,
                paddingBottom: 32,
              }}
              showsVerticalScrollIndicator={false}
              bounces
            >
              <SelectableLyrics
                text={currentLyricSection.content}
                selectionColor="#EA9215"
                style={[
                  tw`text-center font-nokia-bold leading-relaxed ${isDarkMode ? 'text-dark-secondary-1' : 'text-secondary-10'}`,
                  {
                    fontSize: fontSize + (isLandscape ? 8 : 4),
                    lineHeight: (fontSize + (isLandscape ? 8 : 4)) * 1.55,
                    paddingTop: 18,
                    paddingBottom: 18,
                    includeFontPadding: true,
                  }
                ]}
              />
            </ScrollView>

            {/* Right Navigation Button */}
            <TouchableOpacity 
              onPress={goToNext}
              style={tw`absolute right-4 z-10 p-4 rounded-full ${
                currentSection === lyricSections.length - 1
                  ? (isDarkMode ? 'bg-dark-primary-6' : 'bg-primary-3') 
                  : (isDarkMode ? 'bg-dark-primary-8' : 'bg-primary-2')
              } ${currentSection === lyricSections.length - 1 ? 'opacity-50' : 'opacity-100'}`}
              disabled={currentSection === lyricSections.length - 1}
            >
              <ChevronRightIcon 
                size={32} 
                color={isDarkMode ? '#FDFDFD' : '#1A2024'} 
              />
            </TouchableOpacity>
          </View>

          {/* Section Indicator */}
          <View style={tw`absolute bottom-4 left-0 right-0 flex-row items-center justify-center space-x-2`}>
            {lyricSections.map((_, index) => (
              <View
                key={index}
                style={tw`w-2 h-2 rounded-full ${
                  index === currentSection
                    ? (isDarkMode ? 'bg-dark-accent-1' : 'bg-accent-1')
                    : (isDarkMode ? 'bg-dark-primary-6' : 'bg-primary-4')
                }`}
              />
            ))}
          </View>
        </View>
      </SafeAreaView>

      <FontSizePopup visible={isFontSizePopupVisible} onClose={handleCloseFontSizePopup} previewText={song.title} />
    </View>
  );
};

export default FullScreenVerse;
