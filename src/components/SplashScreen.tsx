import React, { useEffect, useState } from 'react';
import { Text, Animated, Image } from 'react-native';
import { useSelector } from 'react-redux';
import { RootState } from '../store';
import tw from '../../tailwind';

interface SplashScreenProps {
  onFinish: () => void;
}

const SplashScreen: React.FC<SplashScreenProps> = ({ onFinish }) => {
  const isDarkMode = useSelector((state: RootState) => state.theme.isDarkMode);
  const [fadeAnim] = useState(new Animated.Value(0));

  useEffect(() => {
    // Fade in animation
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 500,
      useNativeDriver: true,
    }).start();

    // Auto-hide after 2 seconds
    const timer = setTimeout(() => {
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 500,
        useNativeDriver: true,
      }).start(() => {
        onFinish();
      });
    }, 3000);

    return () => clearTimeout(timer);
  }, [fadeAnim, onFinish]);

  return (
    <Animated.View 
      style={[
        tw`flex-1 justify-center items-center`,
        {
          backgroundColor: isDarkMode ? '#1A2024' : '#FDFDFD',
          opacity: fadeAnim,
        }
      ]}
    >
      {/* Logo Image */}
      <Image 
        source={require('./assets/logo_round.png')}
        style={tw`w-32 h-32 mb-8`}
        resizeMode="contain"
      />
      
      {/* Amharic Text */}
      <Text style={[
        tw`text-center font-nokia-bold text-3xl leading-8`,
        {
          color: isDarkMode ? '#FDFDFD' : '#1A2024',
        }
      ]}>
        ሃገርኛ እና ውዳሴ
      </Text>
      <Text style={[
        tw`text-center font-nokia-ultraLight text-xl leading-8 text-accent-6`
      ]}>
        የመዝሙር ደብተር
      </Text>
    </Animated.View>
  );
};

export default SplashScreen; 