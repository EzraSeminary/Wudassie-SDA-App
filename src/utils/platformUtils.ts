import { Platform, StatusBar } from 'react-native';
import { useBottomTabBarHeight } from '@react-navigation/bottom-tabs';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useState, useEffect, useMemo } from 'react';

export const isAndroid = Platform.OS === 'android';
export const isIOS = Platform.OS === 'ios';

export const getStatusBarHeight = () => {
  if (isAndroid) {
    return StatusBar.currentHeight || 0;
  }
  return 0; // iOS handles this automatically with safe area
};

export const getHeaderPaddingTop = () => {
  if (isAndroid) {
    return getStatusBarHeight() + 16; // status bar height + 16px padding
  }
  return 48; // iOS default with safe area
};

// Remove default Android ripple effect
export const getButtonStyle = () => ({
  android_ripple: null,
  style: {
    elevation: 0,
    shadowOpacity: 0,
    borderRadius: 8,
  }
});

// Remove gray border around rounded corners on Android
export const getCardStyle = () => ({
  elevation: 0,
  shadowOpacity: 0,
  borderWidth: 0,
  overflow: 'hidden' as const,
});

// Custom hook to get consistent tab bar height across all screens
export const useTabBarHeight = () => {
  const [tabBarHeight, setTabBarHeight] = useState(85); // Default height from App.tsx
  const insets = useSafeAreaInsets();

  // Always call the hook - it will work when available
  const navTabBarHeight = useBottomTabBarHeight();

  useEffect(() => {
    // Use navigation hook value if available and reasonable, otherwise use our default
    if (navTabBarHeight && navTabBarHeight > 0 && navTabBarHeight < 200) {
      setTabBarHeight(navTabBarHeight);
    } else {
      // Fallback to configured height from App.tsx
      setTabBarHeight(85);
    }
  }, [navTabBarHeight]);

  // Calculate the bottom position for floating buttons
  // Button should be positioned above the tab bar with some padding
  const getFloatingButtonBottom = (additionalOffset: number = 0) => {
    // useBottomTabBarHeight already includes safe area inset
    // Position button 16px above the tab bar, plus any additional offset
    return tabBarHeight + 16 + additionalOffset;
  };

  return {
    tabBarHeight,
    getFloatingButtonBottom,
    safeAreaBottom: insets.bottom,
  };
}; 

// Hook to compute consistent bottom padding for scroll/list content
export const useBottomContentPadding = (minExtra: number = 24) => {
  const { tabBarHeight } = useTabBarHeight();
  return useMemo(() => tabBarHeight + minExtra, [tabBarHeight, minExtra]);
};