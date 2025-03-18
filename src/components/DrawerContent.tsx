// filepath: /Users/amanwtsegaw/Desktop/Melak_Project/Application/Test/WudassieApp/src/components/DrawerContent.tsx
import React from 'react';
import { View, Text, StyleSheet, Switch } from 'react-native';
import Slider from '@react-native-community/slider';
import { DrawerContentScrollView, DrawerItemList } from '@react-navigation/drawer';
import { useSelector, useDispatch } from 'react-redux';
import { RootState, setFontSize } from '../store';
import tw from './../../tailwind';


import { DrawerContentComponentProps } from '@react-navigation/drawer';

const DrawerContent = (props: DrawerContentComponentProps) => {
  const fontSize = useSelector((state: RootState) => state.fontSize.fontSize);
  const dispatch = useDispatch();
  const [isDarkTheme, setIsDarkTheme] = React.useState(false);

  const toggleTheme = () => {
    setIsDarkTheme(!isDarkTheme);
    // Add logic to toggle theme here
  };

  return (
    <DrawerContentScrollView {...props}>
      <DrawerItemList {...props} />
      <View style={styles.drawerContent}>
        <Text style={tw`text-lg font-bold`}>Adjust Font Size</Text>
        <Slider
          style={{ width: 200, height: 40 }}
          minimumValue={10}
          maximumValue={30}
          value={fontSize}
          onValueChange={value => dispatch(setFontSize(value))}
        />
        <View style={styles.themeToggle}>
          <Text style={tw`text-lg font-bold`}>Dark Theme</Text>
          <Switch value={isDarkTheme} onValueChange={toggleTheme} />
        </View>
      </View>
    </DrawerContentScrollView>
  );
};

const styles = StyleSheet.create({
  drawerContent: {
    padding: 20,
  },
  themeToggle: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 20,
  },
});

export default DrawerContent;