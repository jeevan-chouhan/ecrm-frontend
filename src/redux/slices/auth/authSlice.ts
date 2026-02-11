import { createSlice } from "@reduxjs/toolkit";
import type { PayloadAction } from "@reduxjs/toolkit";
import { decodeToken, isTokenExpired } from "../../../utils";
import type { UserData } from "../../../services/types";

// Auth state interface
interface AuthState {
  accessToken: string | null;
  refreshToken: string | null;
  user: UserData | null;
  isAuthenticated: boolean;
}

// Initial state
const initialState: AuthState = {
  accessToken: null,
  refreshToken: null,
  user: null,
  isAuthenticated: false,
};

// Auth slice
const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    // Set tokens after successful login (refresh token not used for login/register/forgot/reset/verify-otp)
    setCredentials: (
      state,
      action: PayloadAction<{ accessToken: string; refreshToken?: string | null }>
    ) => {
      const { accessToken, refreshToken } = action.payload;
      state.accessToken = accessToken;
      state.refreshToken = refreshToken ?? null;
      state.user = decodeToken(accessToken);
      state.isAuthenticated = true;

      localStorage.setItem("accessToken", accessToken);
      if (refreshToken) {
        localStorage.setItem("refreshToken", refreshToken);
      }
    },

    // Update access token only
    updateAccessToken: (state, action: PayloadAction<string>) => {
      state.accessToken = action.payload;
      state.user = decodeToken(action.payload);
      localStorage.setItem("accessToken", action.payload);
    },

    // Update both tokens (e.g., after refresh)
    updateTokens: (
      state,
      action: PayloadAction<{ accessToken: string; refreshToken: string }>
    ) => {
      const { accessToken, refreshToken } = action.payload;
      state.accessToken = accessToken;
      state.refreshToken = refreshToken;
      const decodedUser = decodeToken(accessToken);
      // If password changed flag exists in localStorage, use it as fallback
      const passwordChangedFlag = localStorage.getItem("passwordChanged");
      if (decodedUser && passwordChangedFlag === "true") {
        decodedUser.isPasswordChanged = true;
      }
      state.user = decodedUser;
      state.isAuthenticated = true;
      localStorage.setItem("accessToken", accessToken);
      localStorage.setItem("refreshToken", refreshToken);
    },

    // Clear credentials on logout
    clearCredentials: (state) => {
      state.accessToken = null;
      state.refreshToken = null;
      state.user = null;
      state.isAuthenticated = false;

      // Clear from localStorage
      localStorage.removeItem("accessToken");
      localStorage.removeItem("refreshToken");
      localStorage.removeItem("passwordChanged");
    },

    // Initialize auth state from localStorage (for page refresh)
    initializeAuth: (state) => {
      const accessToken = localStorage.getItem("accessToken");
      const refreshToken = localStorage.getItem("refreshToken");

      if (accessToken && !isTokenExpired(accessToken)) {
        state.accessToken = accessToken;
        state.refreshToken = refreshToken || null;
        const decodedUser = decodeToken(accessToken);
        // If password changed flag exists in localStorage, use it as fallback
        const passwordChangedFlag = localStorage.getItem("passwordChanged");
        if (decodedUser && passwordChangedFlag === "true") {
          decodedUser.isPasswordChanged = true;
        }
        state.user = decodedUser;
        state.isAuthenticated = true;
      } else {
        localStorage.removeItem("accessToken");
        localStorage.removeItem("refreshToken");
        localStorage.removeItem("passwordChanged");
      }
    },

    // Manually update user's password changed status (fallback if token refresh doesn't work)
    updatePasswordChangedStatus: (state, action: PayloadAction<boolean>) => {
      if (state.user) {
        state.user.isPasswordChanged = action.payload;
      }
      // Store flag in localStorage as fallback for page refresh
      if (action.payload) {
        localStorage.setItem("passwordChanged", "true");
      } else {
        localStorage.removeItem("passwordChanged");
      }
    },
  },
});

export const {
  setCredentials,
  updateAccessToken,
  updateTokens,
  clearCredentials,
  initializeAuth,
  updatePasswordChangedStatus,
} = authSlice.actions;

export default authSlice.reducer;

