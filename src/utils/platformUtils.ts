import { Platform, StatusBar } from 'react-native';

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