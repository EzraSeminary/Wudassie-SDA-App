// filepath: /Users/amanwtsegaw/Desktop/Melak_Project/Application/Test/WudassieApp/src/store.ts
import { configureStore, createSlice, PayloadAction, ThunkAction, Action, createAsyncThunk } from '@reduxjs/toolkit';
import AsyncStorage from '@react-native-async-storage/async-storage';
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
  extraReducers: (builder) => {
    builder
      .addCase(loadFontSize.fulfilled, (state, action) => {
        state.fontSize = action.payload;
      })
      .addCase(saveFontSize.fulfilled, (state, action) => {
        state.fontSize = action.payload;
      });
  },
});

// Async thunk to load font size from storage
export const loadFontSize = createAsyncThunk(
  'fontSize/loadFontSize',
  async () => {
    try {
      const savedFontSize = await AsyncStorage.getItem('fontSize');
      return savedFontSize ? JSON.parse(savedFontSize) : 18;
    } catch (error) {
      console.error('Error loading font size:', error);
      return 18;
    }
  }
);

// Async thunk to save font size to storage
export const saveFontSize = createAsyncThunk(
  'fontSize/saveFontSize',
  async (fontSize: number) => {
    try {
      await AsyncStorage.setItem('fontSize', JSON.stringify(fontSize));
      return fontSize;
    } catch (error) {
      console.error('Error saving font size:', error);
      throw error;
    }
  }
);

// Async thunk to load theme from storage
export const loadTheme = createAsyncThunk(
  'theme/loadTheme',
  async () => {
    try {
      const savedTheme = await AsyncStorage.getItem('theme');
      return savedTheme ? JSON.parse(savedTheme) : false;
    } catch (error) {
      console.error('Error loading theme:', error);
      return false;
    }
  }
);

// Async thunk to save theme to storage
export const saveTheme = createAsyncThunk(
  'theme/saveTheme',
  async (isDarkMode: boolean) => {
    try {
      await AsyncStorage.setItem('theme', JSON.stringify(isDarkMode));
      return isDarkMode;
    } catch (error) {
      console.error('Error saving theme:', error);
      throw error;
    }
  }
);

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
  extraReducers: (builder) => {
    builder
      .addCase(loadTheme.fulfilled, (state, action) => {
        state.isDarkMode = action.payload;
      })
      .addCase(saveTheme.fulfilled, (state, action) => {
        state.isDarkMode = action.payload;
      });
  },
});

export const { setFontSize } = fontSizeSlice.actions;
export const { toggleDarkMode, setDarkMode } = themeSlice.actions;

// Enhanced font size actions that automatically save to storage
export const setFontSizeWithPersistence = (fontSize: number): AppThunk => async (dispatch) => {
  dispatch(setFontSize(fontSize));
  dispatch(saveFontSize(fontSize));
};

// Enhanced theme actions that automatically save to storage
export const toggleDarkModeWithPersistence = (): AppThunk => async (dispatch, getState) => {
  const currentTheme = getState().theme.isDarkMode;
  const newTheme = !currentTheme;
  
  dispatch(toggleDarkMode());
  dispatch(saveTheme(newTheme));
};

export const setDarkModeWithPersistence = (isDarkMode: boolean): AppThunk => async (dispatch) => {
  dispatch(setDarkMode(isDarkMode));
  dispatch(saveTheme(isDarkMode));
};

const store = configureStore({
  reducer: {
    fontSize: fontSizeSlice.reducer,
    theme: themeSlice.reducer,
    favorites: favoritesReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: false,
    }),
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
