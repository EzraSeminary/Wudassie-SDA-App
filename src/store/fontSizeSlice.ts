import { createSlice, PayloadAction } from '@reduxjs/toolkit';

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
    setFontSize: (state, action: PayloadAction<number>) => {
      state.fontSize = action.payload;
    },
  },
});

export const { setFontSize } = fontSizeSlice.actions;
export default fontSizeSlice.reducer; 