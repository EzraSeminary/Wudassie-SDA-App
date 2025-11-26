import React, { useState } from 'react';
import { View, Text, Switch, ScrollView, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Slider from '@react-native-community/slider';
import { useSelector, useDispatch } from 'react-redux';
import { RootState, setFontSize, toggleDarkModeWithPersistence, AppDispatch } from '../../store';
import { Cog6ToothIcon, MusicalNoteIcon, BookOpenIcon, HeartIcon, ArrowPathIcon } from 'react-native-heroicons/outline';
import { getCardStyle } from '../../utils/platformUtils';
import { hymnalService } from '../../services/hymnalService';
import tw from '../../../tailwind';
import { useBottomContentPadding } from '../../utils/platformUtils';

const Settings = () => {
  const fontSize = useSelector((state: RootState) => state.fontSize.fontSize);
  const isDarkMode = useSelector((state: RootState) => state.theme.isDarkMode);
  const dispatch = useDispatch<AppDispatch>();
  const [isUpdating, setIsUpdating] = useState(false);
  const contentBottomPadding = useBottomContentPadding(24);

  const handleToggleTheme = () => {
    dispatch(toggleDarkModeWithPersistence());
  };

  const handleUpdateSongs = async () => {
    try {
      setIsUpdating(true);
      await hymnalService.forceUpdate();
      Alert.alert('Success', 'Songs updated successfully!');
    } catch (error) {
      Alert.alert('Error', 'Failed to update songs. Please try again later.');
      console.error('Update error:', error);
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <View style={tw`flex-1 ${isDarkMode ? 'bg-dark-primary-10' : 'bg-primary-1'}`}>
      <SafeAreaView style={tw`flex-1`}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          scrollEnabled={true}
          bounces={true}
          contentContainerStyle={[tw`pb-24` as any, { paddingBottom: contentBottomPadding }]}
        >
          <View style={tw`px-5`}>
            <View style={tw`flex-row items-center mb-8 pb-5 pt-8 border-b ${isDarkMode ? 'border-dark-primary-8' : 'border-primary-6'}`}>
              <Cog6ToothIcon size={40} color="#EA9215" />
              <Text style={tw`text-3xl font-nokia-bold ml-4 ${isDarkMode ? 'text-dark-secondary-1' : 'text-secondary-10'}`}>
                Settings
              </Text>
            </View>

            {/* Font Size Section */}
            <View style={[
              tw`p-5 mb-5 rounded-xl ${isDarkMode ? 'bg-dark-primary-8' : 'bg-primary-3'}`,
              getCardStyle()
            ]}>
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
            <View style={[
              tw`p-5 mb-5 rounded-xl ${isDarkMode ? 'bg-dark-primary-8' : 'bg-primary-3'}`,
              getCardStyle()
            ]}>
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

            {/* Update Songs Section */}
            <View style={[
              tw`p-5 mb-5 rounded-xl ${isDarkMode ? 'bg-dark-primary-8' : 'bg-primary-3'}`,
              getCardStyle()
            ]}>
              <Text style={tw`text-xl font-nokia-bold mb-3 text-accent-6`}>Update Songs</Text>
              <Text style={tw`text-sm mb-4 opacity-70 ${isDarkMode ? 'text-dark-secondary-2' : 'text-secondary-9'}`}>
                Get the latest songs from the server
              </Text>
              <TouchableOpacity
                onPress={handleUpdateSongs}
                disabled={isUpdating}
                style={[
                  tw`flex-row items-center justify-center p-4 rounded-lg`,
                  tw`${isUpdating ? 'bg-gray-400' : 'bg-accent-6'}`,
                  getCardStyle()
                ]}
              >
                {isUpdating ? (
                  <ActivityIndicator color="white" size="small" />
                ) : (
                  <ArrowPathIcon size={20} color="white" />
                )}
                <Text style={tw`text-white font-nokia-bold ml-2`}>
                  {isUpdating ? 'Updating...' : 'Update Now'}
                </Text>
              </TouchableOpacity>
            </View>

            {/* About Section */}
            <View style={[
              tw`p-5 mb-6 rounded-xl ${isDarkMode ? 'bg-dark-primary-8' : 'bg-primary-3'}`,
              getCardStyle()
            ]}>
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
          </View>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
};

export default Settings;