import BottomSheet, { BottomSheetBackdrop } from '@gorhom/bottom-sheet';
import { useCallback, useMemo, useRef } from 'react';
import { View, Text, Button } from 'react-native';
import { useSelector } from 'react-redux';
import { RootState } from '../store';
import tw from './../../tailwind';

export default function TabOneScreen() {
	const snapPoints = useMemo(() => ['25%', '50%', '70%'], []);
	const isDarkMode = useSelector((state: RootState) => state.theme.isDarkMode);

	const bottomSheetRef = useRef<BottomSheet>(null);

	const handleClosePress = () => bottomSheetRef.current?.close();
	const handleOpenPress = () => bottomSheetRef.current?.expand();
	const handleCollapsePress = () => bottomSheetRef.current?.collapse();
	const snapeToIndex = (index: number) => bottomSheetRef.current?.snapToIndex(index);
	const renderBackdrop = useCallback(
		(props: any) => <BottomSheetBackdrop appearsOnIndex={0} disappearsOnIndex={-1} {...props} />,
		[]
	);

	return (
		<View style={tw`flex-1 items-center ${isDarkMode ? 'bg-dark-primary-10' : 'bg-primary-1'}`}>
			<Button title="Open" onPress={handleOpenPress} />
			<Button title="Close" onPress={handleClosePress} />
			<Button title="Collapse" onPress={handleCollapsePress} />
			<Button title="Snap To 0" onPress={() => snapeToIndex(0)} />
			<Button title="Snap To 1" onPress={() => snapeToIndex(1)} />
			<Button title="Snap To 2" onPress={() => snapeToIndex(2)} />

			<BottomSheet
				ref={bottomSheetRef}
				index={0}
				snapPoints={snapPoints}
				enablePanDownToClose={true}
				handleIndicatorStyle={{ backgroundColor: isDarkMode ? '#FDFDFD' : '#1A2024' }}
				backgroundStyle={{ backgroundColor: isDarkMode ? '#293239' : '#F8F8F8' }}
				backdropComponent={renderBackdrop}
			>
				<View style={tw`flex-1 items-center`}>
					<Text style={tw`text-2xl font-nokia-bold p-5 ${isDarkMode ? 'text-dark-secondary-1' : 'text-secondary-10'}`}>
						Awesome Bottom Sheet 🎉
					</Text>
					<Button title="Close" onPress={handleClosePress} />
				</View>
			</BottomSheet>
		</View>
	);
}