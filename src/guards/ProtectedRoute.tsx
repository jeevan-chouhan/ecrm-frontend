import { useEffect, useRef } from "react";
import { Navigate, useLocation } from "react-router-dom";
import type { ReactNode } from "react";
import { useAuth } from "../context";
import { ROUTES } from "../constants";

// Key for storing last visited protected route
export const LAST_PROTECTED_ROUTE_KEY = "lastProtectedRoute";

interface ProtectedRouteProps {
  children: ReactNode;
}

/**
 * ProtectedRoute - Guards routes that require authentication
 * If user is NOT authenticated → Redirect to Login
 * If user IS authenticated → Show the protected content
 */
const ProtectedRoute = ({ children }: ProtectedRouteProps) => {
  const { isAuthenticated, checkAuth } = useAuth();
  const location = useLocation();
  const isInitialRender = useRef(true);

  // Check if user is authenticated
  const isLoggedIn = isAuthenticated || checkAuth();

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
      sessionStorage.setItem(LAST_PROTECTED_ROUTE_KEY, location.pathname);
    }
  }, [isLoggedIn, location.pathname]);

  if (!isLoggedIn) {
    // Redirect to login, save the attempted URL for redirect after login
    return <Navigate to={ROUTES.LOGIN} state={{ from: location }} replace />;
  }

  // User is authenticated, render the protected content
  return <>{children}</>;
};

export default ProtectedRoute;

