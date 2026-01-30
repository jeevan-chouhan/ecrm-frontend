import { useEffect, useRef, useMemo } from "react";
import { Navigate, useLocation } from "react-router-dom";
import type { ReactNode } from "react";
import { useAuth } from "../context";
import { ROUTES } from "../constants";
import { decodeToken } from "../utils";

// Key for storing last visited protected route
export const LAST_PROTECTED_ROUTE_KEY = "lastProtectedRoute";

interface ProtectedRouteProps {
  children: ReactNode;
}

/**
 * ProtectedRoute - Guards routes that require authentication
 * If user is NOT authenticated → Redirect to Login
 * If user IS authenticated but password not changed → Redirect to Change Password
 * If user IS authenticated and password changed → Show the protected content
 */
const ProtectedRoute = ({ children }: ProtectedRouteProps) => {
  const { isAuthenticated, checkAuth, user, accessToken } = useAuth();
  const location = useLocation();
  const isInitialRender = useRef(true);

  // Check if user is authenticated
  const isLoggedIn = isAuthenticated || checkAuth();

  // Check if password needs to be changed
  // Allow access to change-password page even if password not changed
  const isChangePasswordPage = location.pathname === ROUTES.CHANGE_PASSWORD;
  
  // Memoize isPasswordChanged check to avoid redundant token decoding
  // Only recalculate when user or accessToken changes
  const isPasswordChanged = useMemo(() => {
    // Prefer user object from Redux (already decoded)
    if (user) {
      return user.isPasswordChanged;
    }
    
    // Fallback to decoding accessToken from context
    if (accessToken) {
      const decodedUser = decodeToken(accessToken);
      return decodedUser?.isPasswordChanged ?? true;
    }
    
    // Last resort: decode from localStorage (only if Redux state not available)
    const token = localStorage.getItem("accessToken");
    if (token) {
      const decodedUser = decodeToken(token);
      return decodedUser?.isPasswordChanged ?? true;
    }
    
    // Default to true if no token found
    return true;
  }, [user, accessToken]);

  // Save current protected route to sessionStorage
  // Only save on SPA navigation (not on URL bar typing/page reload)
  useEffect(() => {
    if (isLoggedIn) {
      // On initial render (full page load), don't overwrite if value already exists
      if (isInitialRender.current) {
        isInitialRender.current = false;
        const existingRoute = sessionStorage.getItem(LAST_PROTECTED_ROUTE_KEY);
        if (existingRoute) {
          return; // Don't overwrite - keep the previous route
        }
      }
      // Save on SPA navigation or if no value exists yet
      // Don't save change-password route
      if (!isChangePasswordPage) {
        sessionStorage.setItem(LAST_PROTECTED_ROUTE_KEY, location.pathname);
      }
    }
  }, [isLoggedIn, location.pathname, isChangePasswordPage]);

  if (!isLoggedIn) {
    // Redirect to login, save the attempted URL for redirect after login
    return <Navigate to={ROUTES.LOGIN} state={{ from: location }} replace />;
  }

  // If password not changed and not on change-password page, redirect to change-password
  if (!isPasswordChanged && !isChangePasswordPage) {
    return <Navigate to={ROUTES.CHANGE_PASSWORD} replace />;
  }

  // User is authenticated and password changed (or on change-password page), render the protected content
  return <>{children}</>;
};

export default ProtectedRoute;

