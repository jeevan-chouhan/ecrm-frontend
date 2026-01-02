import { Navigate } from "react-router-dom";
import type { ReactNode } from "react";
import { useAuth } from "../context";
import { ROUTES } from "../constants";
import { LAST_PROTECTED_ROUTE_KEY } from "./ProtectedRoute";

interface PublicRouteProps {
  children: ReactNode;
}

/**
 * PublicRoute - Guards auth routes (login, register, etc.) and public pages
 * If user IS authenticated → Redirect to last visited protected route (or Dashboard)
 * If user is NOT authenticated → Show the page
 */
const PublicRoute = ({ children }: PublicRouteProps) => {
  const { isAuthenticated, checkAuth } = useAuth();

  // Check if user is authenticated
  const isLoggedIn = isAuthenticated || checkAuth();

  if (isLoggedIn) {
    // Get last visited protected route from sessionStorage
    const lastRoute = sessionStorage.getItem(LAST_PROTECTED_ROUTE_KEY);
    
    // Redirect to last visited route or dashboard
    const redirectTo = lastRoute || ROUTES.DASHBOARD;
    
    return <Navigate to={redirectTo} replace />;
  }

  // User is not authenticated, show the page
  return <>{children}</>;
};

export default PublicRoute;

