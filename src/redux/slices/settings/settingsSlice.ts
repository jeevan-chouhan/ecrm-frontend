import { createSlice } from "@reduxjs/toolkit";
import type { PayloadAction } from "@reduxjs/toolkit";

export type SettingsTabType = "generalSettings" | "planManagement";

interface SettingsState {
  activeTab: SettingsTabType;
}

const initialState: SettingsState = {
  activeTab: "generalSettings",
};

const settingsSlice = createSlice({
  name: "settings",
  initialState,
  reducers: {
    setActiveTab: (state, action: PayloadAction<SettingsTabType>) => {
      state.activeTab = action.payload;
    },
    resetActiveTab: (state) => {
      state.activeTab = "generalSettings";
    },
  },
});

export const { setActiveTab, resetActiveTab } = settingsSlice.actions;
export default settingsSlice.reducer;
