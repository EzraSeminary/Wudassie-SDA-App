import React from 'react';
import { View, Text, Switch, ScrollView } from 'react-native';
import Slider from '@react-native-community/slider';
import { useSelector, useDispatch } from 'react-redux';
import { RootState, setFontSize, toggleDarkMode } from '../../store';
import { Cog6ToothIcon, MusicalNoteIcon, BookOpenIcon, HeartIcon } from 'react-native-heroicons/outline';
import tw from '../../../tailwind';

const Settings = () => {
  const fontSize = useSelector((state: RootState) => state.fontSize.fontSize);
  const isDarkMode = useSelector((state: RootState) => state.theme.isDarkMode);
  const dispatch = useDispatch();

  const handleToggleTheme = () => {
    dispatch(toggleDarkMode());
  };

  return (
    <ScrollView style={tw`flex-1 p-5 ${isDarkMode ? 'bg-dark-primary-10' : 'bg-primary-1'}`}>
      <View style={tw`flex-row items-center mt-10 mb-8 pb-5 border-b ${isDarkMode ? 'border-dark-primary-8' : 'border-primary-6'}`}>
        <Cog6ToothIcon size={40} color="#EA9215" />
        <Text style={tw`text-3xl font-nokia-bold ml-4 ${isDarkMode ? 'text-dark-secondary-1' : 'text-secondary-10'}`}>
          Settings
        </Text>
      </View>

      {/* Font Size Section */}
      <View style={tw`p-5 mb-5 rounded-xl ${isDarkMode ? 'bg-dark-primary-8' : 'bg-primary-3'} shadow-sm`}>
        <Text style={tw`text-xl font-nokia-bold mb-3 text-accent-6`}>Font Size</Text>
        <Text style={tw`text-sm mb-4 opacity-70 ${isDarkMode ? 'text-dark-secondary-2' : 'text-secondary-9'}`}>
          Adjust the font size for better readability
        </Text>
        <View style={tw`flex-row items-center mb-4`}>
          <Text style={tw`text-base ${isDarkMode ? 'text-dark-secondary-1' : 'text-secondary-10'}`}>Small</Text>
          <Slider
            style={tw`flex-1 h-10 mx-4`}
            minimumValue={12}
            maximumValue={32}
            value={fontSize}
            onValueChange={value => dispatch(setFontSize(value))}
            minimumTrackTintColor="#EA9215"
            maximumTrackTintColor={isDarkMode ? '#3A4750' : '#EEEEEE'}
          />
          <Text style={tw`text-base ${isDarkMode ? 'text-dark-secondary-1' : 'text-secondary-10'}`}>Large</Text>
        </View>
        <Text style={[tw`text-center font-nokia-bold ${isDarkMode ? 'text-dark-secondary-1' : 'text-secondary-10'}`, { fontSize }]}>
          የሱስ ክርስቶስ የኔ ወዳጅ
        </Text>
      </View>

      {/* Theme Section */}
      <View style={tw`p-5 mb-5 rounded-xl ${isDarkMode ? 'bg-dark-primary-8' : 'bg-primary-3'} shadow-sm`}>
        <Text style={tw`text-xl font-nokia-bold mb-3 text-accent-6`}>Appearance</Text>
        <View style={tw`flex-row justify-between items-center`}>
          <View style={tw`flex-1`}>
            <Text style={tw`text-base ${isDarkMode ? 'text-dark-secondary-1' : 'text-secondary-10'}`}>Dark Mode</Text>
            <Text style={tw`text-sm opacity-70 ${isDarkMode ? 'text-dark-secondary-2' : 'text-secondary-9'}`}>
              Switch between light and dark themes
            </Text>
          </View>
          <Switch 
            value={isDarkMode} 
            onValueChange={handleToggleTheme}
            trackColor={{ false: '#CACACA', true: '#EA9215' }}
            thumbColor={isDarkMode ? '#FDFDFD' : '#FDFDFD'}
          />
        </View>
      </View>

      {/* About Section */}
      <View style={tw`p-5 mb-6 rounded-xl ${isDarkMode ? 'bg-dark-primary-8' : 'bg-primary-3'} shadow-sm`}>
        <Text style={tw`text-xl font-nokia-bold mb-4 text-accent-6`}>About</Text>
        <View style={tw`flex-row items-center mb-4`}>
          <BookOpenIcon size={20} color="#EA9215" />
          <Text style={tw`ml-4 text-base ${isDarkMode ? 'text-dark-secondary-1' : 'text-secondary-10'}`}>
            Hymnal Songs Collection
          </Text>
        </View>
        <View style={tw`flex-row items-center mb-4`}>
          <MusicalNoteIcon size={20} color="#EA9215" />
          <Text style={tw`ml-4 text-base ${isDarkMode ? 'text-dark-secondary-1' : 'text-secondary-10'}`}>
            Hagerigna Songs Collection
          </Text>
        </View>
        <View style={tw`flex-row items-center`}>
          <HeartIcon size={20} color="#EA9215" />
          <Text style={tw`ml-4 text-base ${isDarkMode ? 'text-dark-secondary-1' : 'text-secondary-10'}`}>
            Made with love for worship
          </Text>
        </View>
      </View>
    </ScrollView>
  );
};

export default Settings;