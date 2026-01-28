import { useMemo } from "react";
import { useAppSelector } from "../redux/hooks";
import type { UserData } from "../services/types";
import { UserRole, ROLE_DISPLAY_NAMES } from "../constants";

/**
 * Logged in user info with computed properties for easy access
 */
export interface LoggedInUserInfo extends UserData {
  /** Full display name */
  displayName: string;
  /** Formatted role name (e.g., "Primary Admin", "Admin", "Manager") */
  roleDisplayName: string;
  /** Full phone number with country code */
  fullPhoneNumber: string;
  /** Check if user is Primary Admin */
  isPrimary: boolean;
  /** Check if user is Admin (including Primary Admin) */
  isAdmin: boolean;
  /** Check if user is Manager */
  isManager: boolean;
  /** Check if user is Counsellor */
  isCounsellor: boolean;
  /** Check if user is Billing */
  isBilling: boolean;
  /** Check if user can create Admin users */
  canCreateAdmin: boolean;
  /** Check if user can create Manager users */
  canCreateManager: boolean;
  /** Check if user can create Counsellor users */
  canCreateCounsellor: boolean;
  /** Check if user can create Billing users */
  canCreateBilling: boolean;
}

/**
 * Custom hook to get logged in user info from decoded access token
 * 
 * Provides:
 * - User data (userId, name, email, role, etc.)
 * - Computed properties (displayName, roleDisplayName, fullPhoneNumber)
 * - Role checks (isPrimary, isAdmin, isManager, isCounsellor, isBilling)
 * - Permission checks (canCreateAdmin, canCreateManager, etc.)
 * 
 * @returns Logged in user info or null if not authenticated
 */
export const useLoggedInUserInfo = (): LoggedInUserInfo | null => {
  const { user, isAuthenticated } = useAppSelector((state) => state.auth);

  const loggedInUserInfo = useMemo<LoggedInUserInfo | null>(() => {
    if (!isAuthenticated || !user) {
      return null;
    }

    const role = user.role?.toUpperCase() || "";
    const isPrimary = user.isPrimaryAdmin === true;
    const isAdmin = role === UserRole.ADMIN || isPrimary;
    const isManager = role === UserRole.MANAGER;
    const isCounsellor = role === UserRole.COUNSELLOR;
    const isBilling = role === UserRole.BILLING;

    return {
      ...user,
      displayName: user.name || user.email || "User",
      roleDisplayName: isPrimary ? ROLE_DISPLAY_NAMES[UserRole.PRIMARY_ADMIN] : (ROLE_DISPLAY_NAMES[role] || user.role || "Unknown"),
      fullPhoneNumber: `${user.countryCode || ""}${user.contactNumber || ""}`,
      isPrimary,
      isAdmin,
      isManager,
      isCounsellor,
      isBilling,
      // Permission checks based on role hierarchy
      canCreateAdmin: isPrimary,
      canCreateManager: isPrimary || isAdmin,
      canCreateCounsellor: isPrimary || isAdmin || isManager,
      canCreateBilling: isPrimary || isAdmin || isManager,
    };
  }, [user, isAuthenticated]);

  return loggedInUserInfo;
};

/**
 * Custom hook to check if user is authenticated
 * 
 * @returns Boolean indicating if user is authenticated
 */
export const useIsAuthenticated = (): boolean => {
  const { isAuthenticated } = useAppSelector((state) => state.auth);
  return isAuthenticated;
};

/**
 * Custom hook to get access token
 * 
 * @returns Access token string or null
 */
export const useAccessToken = (): string | null => {
  const { accessToken } = useAppSelector((state) => state.auth);
  return accessToken;
};

export default useLoggedInUserInfo;

