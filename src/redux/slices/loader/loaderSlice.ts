import { createSlice } from "@reduxjs/toolkit";
import type { PayloadAction } from "@reduxjs/toolkit";

interface LoaderState {
  isLoading: boolean;
  loadingText: string | null;
}

const initialState: LoaderState = {
  isLoading: false,
  loadingText: null,
};

const loaderSlice = createSlice({
  name: "loader",
  initialState,
  reducers: {
    showLoader: (state, action: PayloadAction<string | undefined>) => {
      state.isLoading = true;
      state.loadingText = action.payload || null;
    },
    hideLoader: (state) => {
      state.isLoading = false;
      state.loadingText = null;
    },
  },
});

export const { showLoader, hideLoader } = loaderSlice.actions;
export default loaderSlice.reducer;

