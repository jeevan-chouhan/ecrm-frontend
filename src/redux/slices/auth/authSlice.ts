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
      state.user = decodeToken(accessToken);
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
    },

    // Initialize auth state from localStorage (for page refresh)
    initializeAuth: (state) => {
      const accessToken = localStorage.getItem("accessToken");
      const refreshToken = localStorage.getItem("refreshToken");

      if (accessToken && !isTokenExpired(accessToken)) {
        state.accessToken = accessToken;
        state.refreshToken = refreshToken || null;
        state.user = decodeToken(accessToken);
        state.isAuthenticated = true;
      } else {
        localStorage.removeItem("accessToken");
        localStorage.removeItem("refreshToken");
      }
    },

    // Manually update user's password changed status (fallback if token refresh doesn't work)
    updatePasswordChangedStatus: (state, action: PayloadAction<boolean>) => {
      if (state.user) {
        state.user.isPasswordChanged = action.payload;
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

