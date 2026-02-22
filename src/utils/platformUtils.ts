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
  const insets = useSafeAreaInsets();
  const defaultHeight = 56 + insets.bottom; // match App.tsx tabBarStyle height
  const [tabBarHeight, setTabBarHeight] = useState(defaultHeight);

  // Always call the hook - it will work when available
  const navTabBarHeight = useBottomTabBarHeight();

  useEffect(() => {
    // Use navigation hook value if available and reasonable, otherwise use our default
    if (navTabBarHeight && navTabBarHeight > 0 && navTabBarHeight < 200) {
      setTabBarHeight(navTabBarHeight);
    } else {
      // Fallback to configured height from App.tsx
      setTabBarHeight(defaultHeight);
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

// Shared layout values for screens with a floating action button.
// Keeps button position and list bottom spacing consistent across tabs.
export const useFloatingButtonLayout = (
  buttonSize: number = 64,
  minExtraPadding: number = 24,
  buttonGapAboveTab: number = 12,
  listClearanceAboveButton: number = 12
) => {
  const { tabBarHeight } = useTabBarHeight();

  return useMemo(() => {
    const floatingButtonBottom = tabBarHeight + buttonGapAboveTab;
    const listBottomPadding = Math.max(
      tabBarHeight + minExtraPadding,
      floatingButtonBottom + buttonSize + listClearanceAboveButton
    );

    return {
      floatingButtonBottom,
      listBottomPadding,
    };
  }, [tabBarHeight, buttonSize, minExtraPadding, buttonGapAboveTab, listClearanceAboveButton]);
};

/**
 * Get the correct Nokia font name based on platform and weight
 * This ensures fonts are properly loaded and prevents fallback to system fonts
 */
export const getNokiaFontName = (weight: 'bold' | 'regular' | 'light' | 'ultraLight' | 'extraBold' = 'bold'): string => {
  // Return platform-specific font identifiers.
  // - Android: use the exact asset filename (without extension) present under android/app/src/main/assets/fonts
  // - iOS: prefer the readable font name that iOS expects (PostScript / display name)
  const androidMap: Record<string, string> = {
    regular: 'NOKIAPUREHEADLINE_RG',
    bold: 'Nokia Pure Headline Bold',
    light: 'NokiaPureHeadline_Lt',
    ultraLight: 'Nokia Pure Headline Ultra Light',
    extraBold: 'Nokia Pure Headline Bold',
  };

  const iosMap: Record<string, string> = {
    regular: 'Nokia Pure Headline',
    bold: 'Nokia Pure Headline Bold',
    light: 'Nokia Pure Headline Lt',
    ultraLight: 'Nokia Pure Headline Ultra Light',
    extraBold: 'Nokia Pure Headline Bold',
  };

  return isAndroid ? androidMap[weight] || androidMap.bold : iosMap[weight] || iosMap.bold;
};

/**
 * Get default font family style object to force Nokia font
 * Use this to ensure text always uses Nokia font and doesn't fall back to system fonts
 */
export const getDefaultFontStyle = (weight: 'bold' | 'regular' | 'light' | 'ultraLight' | 'extraBold' = 'bold') => {
  return {
    fontFamily: getNokiaFontName(weight),
  };
};