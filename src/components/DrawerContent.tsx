// filepath: /Users/amanwtsegaw/Desktop/Melak_Project/Application/Test/WudassieApp/src/components/DrawerContent.tsx
import React from 'react';
import { View, Text, Switch } from 'react-native';
import Slider from '@react-native-community/slider';
import { DrawerContentScrollView, DrawerItemList } from '@react-navigation/drawer';
import { useSelector, useDispatch } from 'react-redux';
import { RootState, setFontSize, toggleDarkMode } from '../store';
import tw from './../../tailwind';

import { DrawerContentComponentProps } from '@react-navigation/drawer';

const DrawerContent = (props: DrawerContentComponentProps) => {
  const fontSize = useSelector((state: RootState) => state.fontSize.fontSize);
  const isDarkMode = useSelector((state: RootState) => state.theme.isDarkMode);
  const dispatch = useDispatch();

  const handleToggleTheme = () => {
    dispatch(toggleDarkMode());
  };

  return (
    <DrawerContentScrollView {...props}>
      <DrawerItemList {...props} />
      <View style={tw`p-5`}>
        <Text style={tw`text-lg font-nokia-bold ${isDarkMode ? 'text-dark-secondary-1' : 'text-secondary-10'}`}>
          Adjust Font Size
        </Text>
        <Slider
          style={tw`w-50 h-10 my-4`}
          minimumValue={10}
          maximumValue={30}
          value={fontSize}
          onValueChange={value => dispatch(setFontSize(value))}
          minimumTrackTintColor="#EA9215"
          maximumTrackTintColor={isDarkMode ? '#3A4750' : '#EEEEEE'}
        />
        <View style={tw`flex-row justify-between items-center mt-5`}>
          <Text style={tw`text-lg font-nokia-bold ${isDarkMode ? 'text-dark-secondary-1' : 'text-secondary-10'}`}>
            Dark Theme
          </Text>
          <Switch 
            value={isDarkMode} 
            onValueChange={handleToggleTheme}
            trackColor={{ false: '#CACACA', true: '#EA9215' }}
            thumbColor={isDarkMode ? '#FDFDFD' : '#FDFDFD'}
          />
        </View>
      </View>
    </DrawerContentScrollView>
  );
};

export default DrawerContent;