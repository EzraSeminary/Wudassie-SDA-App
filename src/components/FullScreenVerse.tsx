import React, { useState, useEffect, useCallback } from 'react';
import { 
  View, 
  Text, 
  TouchableWithoutFeedback, 
  Dimensions, 
  BackHandler,
  StatusBar,
  Platform,
  TouchableOpacity
} from 'react-native';
import { useSelector } from 'react-redux';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowsPointingInIcon, ChevronLeftIcon, ChevronRightIcon } from 'react-native-heroicons/outline';
import { RootState } from '../store';
import tw from '../../tailwind';
import Orientation from 'react-native-orientation-locker';
import { useNavigation } from '@react-navigation/native';

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
      
      // Hide bottom navigation bar
      navigation.setOptions({
        tabBarStyle: { display: 'none' },
        tabBarVisible: false
      });
      
      return () => {
        subscription?.remove();
        backHandler.remove();
        Orientation.unlockAllOrientations();
        navigation.setOptions({
          tabBarStyle: { display: 'flex' },
          tabBarVisible: true
        });
      };
    } else {
      // Unlock orientation when not visible
      Orientation.unlockAllOrientations();
      navigation.setOptions({
        tabBarStyle: { display: 'flex' },
        tabBarVisible: true
      });
    }
  }, [isVisible, song, handleClose, navigation]);

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

  if (!isVisible || lyricSections.length === 0) {
    return null;
  }

  const currentLyricSection = lyricSections[currentSection];
  const isLandscape = screenDimensions.width > screenDimensions.height;

  return (
    <View style={tw`absolute inset-0 z-50`}>
      <StatusBar 
        barStyle={isDarkMode ? 'light-content' : 'dark-content'} 
        backgroundColor={isDarkMode ? '#1A2024' : '#FDFDFD'}
        translucent={false}
      />
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
          <View style={tw`flex-1 flex-row items-center mb-16`}>
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
            <View style={tw`flex-1 px-16 py-8 justify-center`}>
              <Text 
                style={[
                  tw`text-center font-nokia-bold leading-relaxed ${isDarkMode ? 'text-dark-secondary-1' : 'text-secondary-10'}`,
                  { 
                    fontSize: fontSize + (isLandscape ? 8 : 4),
                    lineHeight: (fontSize + (isLandscape ? 8 : 4)) * 1.4
                  }
                ]}
              >
                {currentLyricSection.content.split('\n').map((line, index) => (
                  <React.Fragment key={index}>
                    {line}
                    {index < currentLyricSection.content.split('\n').length - 1 && '\n'}
                  </React.Fragment>
                ))}
              </Text>
            </View>

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
    </View>
  );
};

export default FullScreenVerse;
