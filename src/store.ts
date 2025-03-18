// filepath: /Users/amanwtsegaw/Desktop/Melak_Project/Application/Test/WudassieApp/src/store.ts
import { configureStore, createSlice, PayloadAction } from '@reduxjs/toolkit';

interface FontSizeState {
  fontSize: number;
}

const initialState: FontSizeState = {
  fontSize: 18,
};

const fontSizeSlice = createSlice({
  name: 'fontSize',
  initialState,
  reducers: {
    setFontSize(state, action: PayloadAction<number>) {
      state.fontSize = action.payload;
    },
  },
});

export const { setFontSize } = fontSizeSlice.actions;

const store = configureStore({
  reducer: {
    fontSize: fontSizeSlice.reducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

export default store;