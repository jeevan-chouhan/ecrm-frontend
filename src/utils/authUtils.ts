import type { UserData } from "../services/types";
import { ROUTES } from "../constants/routes";
import { base64UrlToBase64 } from "./regex";

/**
 * Authentication utility functions
 */

/**
 * Decode JWT token to extract user data
 * @param token - JWT access token
 * @returns Decoded user data or null if invalid
 */
export const decodeToken = (token: string): UserData | null => {
  try {
    const base64Url = token.split(".")[1];
    const base64 = base64UrlToBase64(base64Url);
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split("")
        .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
        .join("")
    );
    const decoded = JSON.parse(jsonPayload);
    return {
      userId: decoded.userId,
      name: decoded.name,
      email: decoded.sub,
      role: decoded.role,
      contactNumber: decoded.contactNumber,
      countryCode: decoded.countryCode,
      isPrimaryAdmin: decoded.isPrimaryAdmin,
      isPasswordChanged: decoded.isPasswordChanged,
      agencyId: decoded.agencyId ?? null,
    };
  } catch {
    return null;
  }
};

/**
 * Check if JWT token is expired
 * @param token - JWT access token
 * @returns true if token is expired, false otherwise
 */
export const isTokenExpired = (token: string): boolean => {
  try {
    const base64Url = token.split(".")[1];
    const base64 = base64UrlToBase64(base64Url);
    const jsonPayload = JSON.parse(atob(base64));
    const exp = jsonPayload.exp * 1000; // Convert to milliseconds
    return Date.now() >= exp;
  } catch {
    return true;
  }
};

/**
 * Get token expiration time in milliseconds
 * @param token - JWT access token
 * @returns Expiration timestamp in milliseconds or null if invalid
 */
export const getTokenExpiration = (token: string): number | null => {
  try {
    const base64Url = token.split(".")[1];
    const base64 = base64UrlToBase64(base64Url);
    const jsonPayload = JSON.parse(atob(base64));
    return jsonPayload.exp * 1000; // Convert to milliseconds
  } catch {
    return null;
  }
};

/**
 * Get remaining time until token expires
 * @param token - JWT access token
 * @returns Remaining time in milliseconds or 0 if expired
 */
export const getTokenRemainingTime = (token: string): number => {
  const expiration = getTokenExpiration(token);
  if (!expiration) return 0;
  const remaining = expiration - Date.now();
  return remaining > 0 ? remaining : 0;
};

// ==========================================
// Token Storage Functions
// ==========================================

/**
 * Get access token from localStorage
 * @returns Access token or null
 */
export const getAccessToken = (): string | null => {
  return localStorage.getItem("accessToken");
};

/**
 * Get refresh token from localStorage
 * @returns Refresh token or null
 */
export const getRefreshToken = (): string | null => {
  return localStorage.getItem("refreshToken");
};

/**
 * Save tokens to localStorage
 * @param accessToken - New access token
 * @param refreshToken - New refresh token
 */
export const saveTokens = (accessToken: string, refreshToken: string): void => {
  localStorage.setItem("accessToken", accessToken);
  localStorage.setItem("refreshToken", refreshToken);
};

/**
 * Clear authentication data from localStorage
 */
export const clearAuthData = (): void => {
  localStorage.removeItem("accessToken");
  localStorage.removeItem("refreshToken");
};

/**
 * Clear all local storage data (including redux-persist)
 */
export const clearAllStorage = (): void => {
  localStorage.clear();
  sessionStorage.clear();
};

/**
 * Redirect to login page after clearing all storage
 */
export const redirectToLogin = (): void => {
  clearAllStorage();
  window.location.href = ROUTES.LOGIN;
};

