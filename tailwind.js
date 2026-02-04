import {create} from 'twrnc';
import {Platform} from 'react-native';

const config = require('./tailwind.config.js');

// Override the first fallback entry for Nokia fonts with a platform-specific
// identifier while preserving the existing fallback array. This avoids
// replacing the whole array with a single string (which can break twrnc).
const platformFontOverrides = {
  'nokia-bold':
    Platform.OS === 'ios'
      ? 'Nokia Pure Headline Bold'
      : 'Nokia Pure Headline Bold',
  'nokia-extraBold':
    Platform.OS === 'ios'
      ? 'Nokia Pure Headline Bold'
      : 'Nokia Pure Headline Bold',
  'nokia-regular':
    Platform.OS === 'ios'
      ? 'Nokia Pure Headline Regular'
      : 'NOKIAPUREHEADLINE_RG',
  'nokia-light':
    Platform.OS === 'ios'
      ? 'Nokia Pure Headline Light'
      : 'NokiaPureHeadline_Lt',
  'nokia-ultraLight':
    Platform.OS === 'ios'
      ? 'Nokia Pure Headline Ultra Light'
      : 'Nokia Pure Headline Ultra Light',
};

Object.keys(platformFontOverrides).forEach(key => {
  const existing = config.theme?.extend?.fontFamily?.[key];
  if (existing && Array.isArray(existing)) {
    existing[0] = platformFontOverrides[key];
    config.theme.extend.fontFamily[key] = existing;
  } else if (existing) {
    // If the config has a single string, replace it with an array keeping it as fallback
    config.theme.extend.fontFamily[key] = [
      platformFontOverrides[key],
      existing,
    ];
  }
});

const tw = create(config);

export default tw;
