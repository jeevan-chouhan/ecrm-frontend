import {
  createContext,
  useContext,
  useCallback,
  useMemo,
  useEffect,
} from "react";
import type { ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import { authService } from "../services";
import { ROUTES } from "../constants";
import { isTokenExpired } from "../utils";
import { useAppDispatch, useAppSelector } from "../redux/hooks";
import {
  setCredentials,
  clearCredentials,
  updateTokens as updateTokensAction,
  initializeAuth,
} from "../redux/slices/auth/authSlice";
import type { LoginPayload, LoginResponse, UserData } from "../services/types";

// Auth context state interface
interface AuthContextState {
  user: UserData | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  accessToken: string | null;
  refreshToken: string | null;
}

// Auth context methods interface
interface AuthContextMethods {
  login: (payload: LoginPayload) => Promise<LoginResponse>;
  logout: () => void;
  updateTokens: (accessToken: string, refreshToken: string) => void;
  checkAuth: () => boolean;
}

// Combined auth context type
type AuthContextType = AuthContextState & AuthContextMethods;

// Create context
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Auth Provider Props
interface AuthProviderProps {
  children: ReactNode;
}

// Auth Provider Component
export const AuthProvider = ({ children }: AuthProviderProps) => {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();

  // Get auth state from Redux
  const { user, isAuthenticated, accessToken, refreshToken } = useAppSelector(
    (state) => state.auth
  );

  // Initialize auth state from localStorage on mount
  useEffect(() => {
    dispatch(initializeAuth());
  }, [dispatch]);

  // Login function - uses Redux for state management
  const login = useCallback(
    async (payload: LoginPayload): Promise<LoginResponse> => {
      const response = await authService.login(payload);

      if (response.status === "success" && response.data) {
        // Save access token only (no refresh token for login)
        dispatch(
          setCredentials({
            accessToken: response.data.accessToken,
          })
        );
      }

      return response;
    },
    [dispatch]
  );

  // Logout function - uses Redux for state management
  const logout = useCallback(() => {
    // Clear credentials from Redux (which also clears localStorage)
    dispatch(clearCredentials());

    // Redirect to login
    navigate(ROUTES.LOGIN);
  }, [dispatch, navigate]);

  // Update tokens (e.g., after refresh) - uses Redux
  const updateTokens = useCallback(
    (newAccessToken: string, newRefreshToken: string) => {
      dispatch(
        updateTokensAction({
          accessToken: newAccessToken,
          refreshToken: newRefreshToken,
        })
      );
    },
    [dispatch]
  );

  // Check if user is authenticated
  const checkAuth = useCallback((): boolean => {
    const token = localStorage.getItem("accessToken");
    if (!token) return false;
    return !isTokenExpired(token);
  }, []);

  // Memoized context value
  const contextValue = useMemo<AuthContextType>(
    () => ({
      user,
      isAuthenticated,
      isLoading: false,
      accessToken,
      refreshToken,
      login,
      logout,
      updateTokens,
      checkAuth,
    }),
    [user, isAuthenticated, accessToken, refreshToken, login, logout, updateTokens, checkAuth]
  );

  return (
    <AuthContext.Provider value={contextValue}>{children}</AuthContext.Provider>
  );
};

// Custom hook to use auth context
export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

// Export context for testing purposes
export { AuthContext };
