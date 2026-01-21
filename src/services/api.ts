import axios from "axios";
import type { AxiosInstance, InternalAxiosRequestConfig, AxiosError } from "axios";
import { ENDPOINTS } from "./endpoints";
import type { RefreshTokenResponse } from "./types";
import {
  getAccessToken,
  getRefreshToken,
  saveTokens,
  redirectToLogin,
} from "../utils";

// ==========================================
// Configuration
// ==========================================

// Base URL for API requests - Must be set in .env file
const BASE_URL = import.meta.env.VITE_API_BASE_URL;
// Request timeout (80 seconds)
const TIMEOUT = 80000;

// Common headers for all requests
const COMMON_HEADERS = {
  "Content-Type": "application/json",
  "Accept": "application/json",
  "ngrok-skip-browser-warning": "69420",
};

// Public endpoints - No authentication token required
const PUBLIC_ENDPOINTS = [
  ENDPOINTS.AUTH.LOGIN,
  ENDPOINTS.AUTH.REGISTER,
  ENDPOINTS.AUTH.FORGOT_PASSWORD,
  ENDPOINTS.AUTH.VERIFY_OTP,
  ENDPOINTS.AUTH.UPDATE_PASSWORD,
  ENDPOINTS.AUTH.REFRESH,
];

// ==========================================
// Axios Instance
// ==========================================

const api: AxiosInstance = axios.create({
  baseURL: BASE_URL,
  timeout: TIMEOUT,
  headers: COMMON_HEADERS,
});

// ==========================================
// Token Refresh Queue Management
// ==========================================

// Flag to track if token refresh is in progress
let isRefreshing = false;

// Queue to hold pending requests while token is being refreshed
let pendingRequests: Array<{
  resolve: (token: string) => void;
  reject: (error: AxiosError) => void;
}> = [];

/**
 * Process all pending requests after token refresh
 * @param error - Error if refresh failed, null if successful
 * @param newToken - New access token if refresh successful
 */
const processPendingRequests = (error: AxiosError | null, newToken: string | null) => {
  pendingRequests.forEach((request) => {
    if (error) {
      request.reject(error);
    } else if (newToken) {
      request.resolve(newToken);
    }
  });
  // Clear the queue
  pendingRequests = [];
};

// ==========================================
// Helper Functions
// ==========================================

/**
 * Check if the request URL is a public endpoint (no auth required)
 * @param url - Request URL
 * @returns true if public endpoint
 */
const isPublicEndpoint = (url: string | undefined): boolean => {
  if (!url) return false;
  return PUBLIC_ENDPOINTS.some((endpoint) => url.includes(endpoint));
};

// ==========================================
// Refresh Token API Call
// ==========================================

/**
 * Call refresh token API to get new access token
 * @returns New access token or throws error
 */
const refreshAccessToken = async (): Promise<string> => {
  const refreshToken = getRefreshToken();

  // No refresh token available
  if (!refreshToken) {
    throw new Error("No refresh token available");
  }

  // Call refresh token API
  const response = await axios.post<RefreshTokenResponse>(
    `${BASE_URL}${ENDPOINTS.AUTH.REFRESH}`,
    { refreshToken },
    { headers: COMMON_HEADERS }
  );

  // Check if refresh was successful
  if (response.data.status === "success" && response.data.data) {
    const { accessToken, refreshToken: newRefreshToken } = response.data.data;

    // Save new tokens to localStorage
    saveTokens(accessToken, newRefreshToken);

    return accessToken;
  }

  throw new Error("Token refresh failed");
};

// ==========================================
// Request Interceptor
// ==========================================

api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    // Skip adding token for public endpoints
    if (isPublicEndpoint(config.url)) {
      return config;
    }

    // Add authorization token for protected endpoints
    const token = getAccessToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// ==========================================
// Response Interceptor
// ==========================================

api.interceptors.response.use(
  // Success - return response as is
  (response) => response,

  // Error - handle 401 and 403
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };
    const statusCode = error.response?.status;

    // ----------------------------------------
    // Handle 403 Forbidden - Redirect to Login
    // ----------------------------------------
    if (statusCode === 403) {
      redirectToLogin();
      return Promise.reject(error);
    }

    // ----------------------------------------
    // Handle 401 Unauthorized - Refresh Token
    // ----------------------------------------
    if (statusCode === 401 && !originalRequest._retry) {
      // Don't refresh if the failed request was the refresh endpoint itself
      if (originalRequest.url?.includes(ENDPOINTS.AUTH.REFRESH)) {
        redirectToLogin();
        return Promise.reject(error);
      }

      // If already refreshing, add request to pending queue
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          pendingRequests.push({
            resolve: (newToken: string) => {
              // Update header with new token and retry
              originalRequest.headers.Authorization = `Bearer ${newToken}`;
              resolve(api(originalRequest));
            },
            reject: (err: AxiosError) => {
              reject(err);
            },
          });
        });
      }

      // Mark request as retried and start refreshing
      originalRequest._retry = true;
      isRefreshing = true;

      try {
        // Get new access token
        const newAccessToken = await refreshAccessToken();

        // Update header for original request
        originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;

        // Process all pending requests with new token
        processPendingRequests(null, newAccessToken);

        // Retry the original request
        return api(originalRequest);

      } catch (refreshError) {
        // Refresh failed - reject all pending requests
        processPendingRequests(refreshError as AxiosError, null);

        // Redirect to login
        // redirectToLogin();

        return Promise.reject(refreshError);

      } finally {
        // Reset refreshing flag
        isRefreshing = false;
      }
    }

    // Other errors - reject as is
    return Promise.reject(error);
  }
);

export default api;
