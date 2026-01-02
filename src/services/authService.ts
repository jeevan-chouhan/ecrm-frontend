import api from "./api";
import { ENDPOINTS } from "./endpoints";
import { decodeToken, isTokenExpired } from "../utils";
import type {
  LoginPayload,
  LoginResponse,
  ForgotPasswordPayload,
  ForgotPasswordResponse,
  VerifyOtpPayload,
  VerifyOtpResponse,
  UpdatePasswordPayload,
  UpdatePasswordResponse,
  UserData,
} from "./types";

// Auth Service Functions
const authService = {
  // Login API - Returns response, tokens are saved via Redux slice
  login: async (payload: LoginPayload): Promise<LoginResponse> => {
    const response = await api.post<LoginResponse>(ENDPOINTS.AUTH.LOGIN, payload);
    return response.data;
  },

  // Forgot Password API - Send OTP to email
  forgotPassword: async (payload: ForgotPasswordPayload): Promise<ForgotPasswordResponse> => {
    const response = await api.post<ForgotPasswordResponse>(
      ENDPOINTS.AUTH.FORGOT_PASSWORD,
      payload
    );
    return response.data;
  },

  // Verify OTP API
  verifyOtp: async (payload: VerifyOtpPayload): Promise<VerifyOtpResponse> => {
    const response = await api.post<VerifyOtpResponse>(
      ENDPOINTS.AUTH.VERIFY_OTP,
      payload
    );
    return response.data;
  },

  // Update Password API (Reset Password)
  updatePassword: async (payload: UpdatePasswordPayload): Promise<UpdatePasswordResponse> => {
    const response = await api.put<UpdatePasswordResponse>(
      ENDPOINTS.AUTH.UPDATE_PASSWORD,
      payload
    );
    return response.data;
  },

  // Logout
  logout: (): void => {
    localStorage.removeItem("accessToken");
    localStorage.removeItem("refreshToken");
  },

  // Get current user from stored token
  getCurrentUser: (): UserData | null => {
    const token = localStorage.getItem("accessToken");
    if (!token) return null;
    return decodeToken(token);
  },

  // Check if user is authenticated
  isAuthenticated: (): boolean => {
    const token = localStorage.getItem("accessToken");
    if (!token) return false;
    return !isTokenExpired(token);
  },

  // Get access token
  getAccessToken: (): string | null => {
    return localStorage.getItem("accessToken");
  },

  // Get refresh token
  getRefreshToken: (): string | null => {
    return localStorage.getItem("refreshToken");
  },
};

export default authService;
