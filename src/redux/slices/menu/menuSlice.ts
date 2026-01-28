import { createSlice } from "@reduxjs/toolkit";
import type { PayloadAction } from "@reduxjs/toolkit";
import type { MenuItem } from "../../../services/types";

// Menu state interface
interface MenuState {
  items: MenuItem[];
  isLoaded: boolean;
}

// LocalStorage key
const MENU_STORAGE_KEY = "menuItems";

// Initial state
const initialState: MenuState = {
  items: [],
  isLoaded: false,
};

// Menu slice
const menuSlice = createSlice({
  name: "menu",
  initialState,
  reducers: {
    // Set menu items after fetching from API
    setMenuItems: (state, action: PayloadAction<MenuItem[]>) => {
      state.items = action.payload;
      state.isLoaded = true;

      // Save to localStorage for persistence
      localStorage.setItem(MENU_STORAGE_KEY, JSON.stringify(action.payload));
    },

    // Initialize menu from localStorage (for page refresh)
    initializeMenu: (state) => {
      const storedMenu = localStorage.getItem(MENU_STORAGE_KEY);
      if (storedMenu) {
        try {
          const menuItems = JSON.parse(storedMenu) as MenuItem[];
          state.items = menuItems;
          state.isLoaded = true;
        } catch {
          // Invalid JSON, clear it
          localStorage.removeItem(MENU_STORAGE_KEY);
        }
      }
    },

    // Clear menu on logout
    clearMenu: (state) => {
      state.items = [];
      state.isLoaded = false;
      localStorage.removeItem(MENU_STORAGE_KEY);
    },
  },
});

export const { setMenuItems, initializeMenu, clearMenu } = menuSlice.actions;

export default menuSlice.reducer;
