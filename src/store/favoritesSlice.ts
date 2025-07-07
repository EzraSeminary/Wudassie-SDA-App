import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AppThunk } from '../store';
import Toast from 'react-native-toast-message';

interface FavoritesState {
  favoriteIds: string[];
  isLoaded: boolean;
}

const initialState: FavoritesState = {
  favoriteIds: [],
  isLoaded: false,
};

const favoritesSlice = createSlice({
  name: 'favorites',
  initialState,
  reducers: {
    setFavoritesLoading: (state, action: PayloadAction<boolean>) => {
        state.isLoaded = !action.payload;
    },
    setFavorites: (state, action: PayloadAction<string[]>) => {
        state.favoriteIds = action.payload;
        state.isLoaded = true;
    },
    addFavorite: (state, action: PayloadAction<string>) => {
      if (!state.favoriteIds.includes(action.payload)) {
        state.favoriteIds.push(action.payload);
        console.log('Added favorite:', action.payload, 'Current favorites:', state.favoriteIds);
      }
    },
    removeFavorite: (state, action: PayloadAction<string>) => {
      state.favoriteIds = state.favoriteIds.filter(id => id !== action.payload);
      console.log('Removed favorite:', action.payload, 'Current favorites:', state.favoriteIds);
    },
  },
});

export const { addFavorite, removeFavorite, setFavorites, setFavoritesLoading } = favoritesSlice.actions;

export const loadFavorites = (): AppThunk => async dispatch => {
    dispatch(setFavoritesLoading(true));
    try {
        const storedFavorites = await AsyncStorage.getItem('favorites');
        if (storedFavorites) {
            const parsed = JSON.parse(storedFavorites);
            console.log('Loaded favorites from storage:', parsed);
            dispatch(setFavorites(parsed));
        } else {
            console.log('No favorites found in storage');
            dispatch(setFavorites([]));
        }
    } catch (e) {
        console.error('Failed to load favorites.', e);
        dispatch(setFavorites([]));
    } finally {
        dispatch(setFavoritesLoading(false));
    }
};

export const toggleFavorite = (songId: string, songTitle?: string): AppThunk => async (dispatch, getState) => {
    console.log('toggleFavorite called with:', songId, songTitle);
    
    const { favorites } = getState();
    console.log('Current favorites state:', favorites);
    
    if (!favorites.isLoaded) {
        console.warn('Favorites not loaded yet, loading first...');
        await dispatch(loadFavorites());
        // Get updated state after loading
        const updatedState = getState();
        console.log('Updated state after loading:', updatedState.favorites);
    }
    
    const currentFavorites = getState().favorites;
    const isFavorite = currentFavorites.favoriteIds.includes(songId);
    console.log('Is currently favorite:', isFavorite);

    if (isFavorite) {
        dispatch(removeFavorite(songId));
        Toast.show({
            type: 'info',
            text1: 'Removed from Favorites',
            text2: songTitle ? `"${songTitle}" removed from favorites` : 'Song removed from favorites',
            position: 'bottom',
            visibilityTime: 2000,
        });
    } else {
        dispatch(addFavorite(songId));
        Toast.show({
            type: 'success',
            text1: 'Added to Favorites',
            text2: songTitle ? `"${songTitle}" added to favorites` : 'Song added to favorites',
            position: 'bottom',
            visibilityTime: 2000,
        });
    }

    // Save to AsyncStorage
    try {
        const newFavorites = getState().favorites.favoriteIds;
        console.log('Saving favorites to storage:', newFavorites);
        await AsyncStorage.setItem('favorites', JSON.stringify(newFavorites));
    } catch (error) {
        console.error('Failed to save favorites to storage:', error);
    }
};

export default favoritesSlice.reducer; 