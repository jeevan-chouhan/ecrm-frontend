// ==========================================
// API Types
// ==========================================

// Common API Response
export interface ApiResponse<T = null> {
  status: string;
  statusCode: number;
  message: string;
  data: T;
}

// ==========================================
// Auth Types
// ==========================================

// Login
export interface LoginPayload {
  email: string;
  password: string;
}

export interface LoginData {
  accessToken: string;
  refreshToken: string;
}

export type LoginResponse = ApiResponse<LoginData>;

// Forgot Password
export interface ForgotPasswordPayload {
  email: string;
}

export interface ForgotPasswordData {
  userId: number;
  emailId: string;
}

export type ForgotPasswordResponse = ApiResponse<ForgotPasswordData>;

// Verify OTP
export interface VerifyOtpPayload {
  email: string;
  otp: number;
}

export type VerifyOtpResponse = ApiResponse<null>;

// Update Password
export interface UpdatePasswordPayload {
  email: string;
  newPassword: string;
  confirmPassword: string;
}

export type UpdatePasswordResponse = ApiResponse<null>;

// Refresh Token
export interface RefreshTokenPayload {
  refreshToken: string;
}

export interface RefreshTokenData {
  accessToken: string;
  refreshToken: string;
}

export type RefreshTokenResponse = ApiResponse<RefreshTokenData>;

// User Data (decoded from JWT token)
export interface UserData {
  userId: number;
  name: string;
  email: string;
  role: string;
  contactNumber: string;
  countryCode: string;
  isPrimaryAdmin: boolean;
  isPasswordChanged: boolean;
}

// ==========================================
// Navigation State Types
// ==========================================

export interface OtpVerificationState {
  userId?: number;
  email?: string;
}

export interface ResetPasswordState {
  email?: string;
}

