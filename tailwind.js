import {create} from 'twrnc';
import {Platform} from 'react-native';

const config = require('./tailwind.config.js');

// Override font families with platform-specific names to prevent fallback
// This ensures Nokia fonts are always used and prevents system font fallback
const platformFontOverrides = {
  'nokia-bold': Platform.OS === 'ios' 
    ? 'Nokia Pure Headline Bold' 
    : 'NokiaPureHeadline-Bold',
  'nokia-extraBold': Platform.OS === 'ios'
    ? 'Nokia Pure Headline Bold' // iOS doesn't have extraBold, fallback to bold
    : 'NokiaPureHeadline_XBd',
  'nokia-regular': Platform.OS === 'ios'
    ? 'Nokia Pure Headline Regular'
    : 'NOKIAPUREHEADLINE_RG',
  'nokia-light': Platform.OS === 'ios'
    ? 'Nokia Pure Headline Light'
    : 'NokiaPureHeadline_Lt',
  'nokia-ultraLight': Platform.OS === 'ios'
    ? 'Nokia Pure Headline Ultra Light'
    : 'NokiaPureHeadline-UltraLight',
};

// Update the config with platform-specific font names
Object.keys(platformFontOverrides).forEach(key => {
  if (config.theme?.extend?.fontFamily?.[key]) {
    config.theme.extend.fontFamily[key] = platformFontOverrides[key];
  }
});

const tw = create(config);

export default tw;
