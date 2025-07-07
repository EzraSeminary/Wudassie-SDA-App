// filepath: /Users/amanwtsegaw/Desktop/Melak_Project/Application/Test/WudassieApp/src/store.ts
import { configureStore, createSlice, PayloadAction, ThunkAction, Action } from '@reduxjs/toolkit';
import favoritesReducer from './store/favoritesSlice';

interface FontSizeState {
  fontSize: number;
}

interface ThemeState {
  isDarkMode: boolean;
}

const initialFontSizeState: FontSizeState = {
  fontSize: 18,
};

const initialThemeState: ThemeState = {
  isDarkMode: false,
};

const fontSizeSlice = createSlice({
  name: 'fontSize',
  initialState: initialFontSizeState,
  reducers: {
    setFontSize(state, action: PayloadAction<number>) {
      state.fontSize = action.payload;
    },
  },
});

const themeSlice = createSlice({
  name: 'theme',
  initialState: initialThemeState,
  reducers: {
    toggleDarkMode(state) {
      state.isDarkMode = !state.isDarkMode;
    },
    setDarkMode(state, action: PayloadAction<boolean>) {
      state.isDarkMode = action.payload;
    },
  },
});

export const { setFontSize } = fontSizeSlice.actions;
export const { toggleDarkMode, setDarkMode } = themeSlice.actions;

const store = configureStore({
  reducer: {
    fontSize: fontSizeSlice.reducer,
    theme: themeSlice.reducer,
    favorites: favoritesReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
export type AppThunk<ReturnType = void> = ThunkAction<
  ReturnType,
  RootState,
  unknown,
  Action<string>
>;

export default store;