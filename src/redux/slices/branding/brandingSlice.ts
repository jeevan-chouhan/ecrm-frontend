import { createSlice } from "@reduxjs/toolkit";
import type { PayloadAction } from "@reduxjs/toolkit";
import type { AgencyBrandingData } from "../../../services/types";

// Branding state interface
interface BrandingState {
  agencyName: string | null;
  logoUrl: string | null;
  isLoaded: boolean;
}

// LocalStorage key
const BRANDING_STORAGE_KEY = "agencyBranding";

// Initial state
const initialState: BrandingState = {
  agencyName: null,
  logoUrl: null,
  isLoaded: false,
};

// Branding slice
const brandingSlice = createSlice({
  name: "branding",
  initialState,
  reducers: {
    // Set branding data after fetching from API
    setBranding: (state, action: PayloadAction<AgencyBrandingData>) => {
      state.agencyName = action.payload.agencyName;
      state.logoUrl = action.payload.logoUrl;
      state.isLoaded = true;

      // Save to localStorage for persistence
      localStorage.setItem(BRANDING_STORAGE_KEY, JSON.stringify(action.payload));
    },

    // Initialize branding from localStorage (for page refresh)
    initializeBranding: (state) => {
      const storedBranding = localStorage.getItem(BRANDING_STORAGE_KEY);
      if (storedBranding) {
        try {
          const brandingData = JSON.parse(storedBranding) as AgencyBrandingData;
          state.agencyName = brandingData.agencyName;
          state.logoUrl = brandingData.logoUrl;
          state.isLoaded = true;
        } catch {
          // Invalid JSON, clear it
          localStorage.removeItem(BRANDING_STORAGE_KEY);
        }
      }
    },

    // Clear branding on logout
    clearBranding: (state) => {
      state.agencyName = null;
      state.logoUrl = null;
      state.isLoaded = false;
      localStorage.removeItem(BRANDING_STORAGE_KEY);
    },
  },
});

export const { setBranding, initializeBranding, clearBranding } = brandingSlice.actions;

export default brandingSlice.reducer;
