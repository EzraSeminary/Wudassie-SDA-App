import { configureStore } from '@reduxjs/toolkit';
import fontSizeReducer from './fontSizeSlice';
import themeReducer from './themeSlice';

export const store = configureStore({
  reducer: {
    fontSize: fontSizeReducer,
    theme: themeReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch; 