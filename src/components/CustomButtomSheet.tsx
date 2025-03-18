import React, { forwardRef, useMemo } from 'react';
import { View, Text, StyleSheet, Switch } from 'react-native';
import Slider from '@react-native-community/slider';
import BottomSheet from '@gorhom/bottom-sheet';
import { useSelector, useDispatch } from 'react-redux';
import { RootState, setFontSize } from '../store';
import tw from './../../tailwind';

const CustomBottomSheet = forwardRef<BottomSheet, any>((props, ref) => {
  const fontSize = useSelector((state: RootState) => state.fontSize.fontSize);
  const dispatch = useDispatch();
  const [isDarkTheme, setIsDarkTheme] = React.useState(false);

  const toggleTheme = () => {
    setIsDarkTheme(!isDarkTheme);
    // Add logic to toggle theme here
  };

  const snapPoints = useMemo(() => ['25%', '50%'], []);

  return (
    <BottomSheet
      ref={ref}
      index={-1}
      snapPoints={snapPoints}
    >
      <View style={styles.sheetContent}>
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
    </BottomSheet>
  );
});

const styles = StyleSheet.create({
  sheetContent: {
    padding: 20,
    backgroundColor: 'white',
    height: '100%',
  },
  themeToggle: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 20,
  },
});

export default CustomBottomSheet;