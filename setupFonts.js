// Ensure this runs before any other imports that use Text/TextInput
const { Platform, Text, TextInput } = require('react-native');

const isAndroid = Platform.OS === 'android';

const getNokiaFontName = (weight = 'regular') => {
  const androidMap = {
    regular: 'NOKIAPUREHEADLINE_RG',
    bold: 'Nokia Pure Headline Bold',
    light: 'NokiaPureHeadline_Lt',
    ultraLight: 'Nokia Pure Headline Ultra Light',
    extraBold: 'Nokia Pure Headline Bold',
  };
  const iosMap = {
    regular: 'Nokia Pure Headline',
    bold: 'Nokia Pure Headline Bold',
    light: 'Nokia Pure Headline Lt',
    ultraLight: 'Nokia Pure Headline Ultra Light',
    extraBold: 'Nokia Pure Headline Bold',
  };
  return isAndroid ? androidMap[weight] || androidMap.bold : iosMap[weight] || iosMap.bold;
};

const defaultNokiaFont = getNokiaFontName('regular');

if ((Text).defaultProps == null) (Text).defaultProps = {};
if ((Text).defaultProps.style == null) (Text).defaultProps.style = { fontFamily: defaultNokiaFont };
else (Text).defaultProps.style = { ...(Text).defaultProps.style, fontFamily: defaultNokiaFont };

if ((TextInput).defaultProps == null) (TextInput).defaultProps = {};
if ((TextInput).defaultProps.style == null) (TextInput).defaultProps.style = { fontFamily: defaultNokiaFont };
else (TextInput).defaultProps.style = { ...(TextInput).defaultProps.style, fontFamily: defaultNokiaFont };

module.exports = { getNokiaFontName };
