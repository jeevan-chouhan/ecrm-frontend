import { useMemo } from "react";
import { roleOptions } from "../constants";
import type { SelectOption } from "../components";
import { useLoggedInUserInfo } from "./useLoggedInUserInfo";

/**
 * Custom hook to get filtered role options based on user's permissions
 * 
 * Logic:
 * - isPrimaryAdmin = true → Primary Admin, Admin, Manager, Counselor, Billing
 * - isPrimaryAdmin = false && role = ADMIN → Manager, Counselor, Billing
 * - isPrimaryAdmin = false && role = MANAGER → Counselor, Billing
 * 
 * @returns Filtered role options for the current user
 */
export const useFilteredRoleOptions = (): SelectOption[] => {
  const loggedInUser = useLoggedInUserInfo();

  const filteredRoleOptions = useMemo(() => {
    if (!loggedInUser) return [];

    if (loggedInUser.isPrimary) {
      // Primary Admin can create: Primary Admin, Admin, Manager, Counselor, Billing
      return roleOptions.filter(option => 
        ["primaryAdmin", "admin", "manager", "counselor", "billing"].includes(option.value)
      );
    } else if (loggedInUser.isAdmin) {
      // Admin can create: Manager, Counselor, Billing
      return roleOptions.filter(option => 
        ["admin", "manager", "counselor", "billing"].includes(option.value)
      );
    } else if (loggedInUser.isManager) {
      // Manager can create: Counselor, Billing
      return roleOptions.filter(option => 
        ["counselor", "billing"].includes(option.value)
      );
    }
    // Default: return empty (shouldn't happen)
    return [];
  }, [loggedInUser]);

  return filteredRoleOptions;
};

export default useFilteredRoleOptions;

