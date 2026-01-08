import { UserRole } from "../constants";

// ==========================================
// Query Parameter Utility Functions
// ==========================================

/**
 * Options for appending query parameters
 */
export interface AppendQueryParamOptions {
  /** Skip if value is empty string */
  skipEmptyString?: boolean;
  /** Custom value transformation function */
  customTransform?: (val: string | number | boolean) => string;
  /** Default value to use if the provided value is null/undefined */
  defaultValue?: string | number | boolean;
}

/**
 * Append a query parameter if the value is not null/undefined
 * @param queryParams - URLSearchParams instance
 * @param key - Query parameter key
 * @param value - Query parameter value (can be string, number, boolean, or null/undefined)
 * @param options - Optional configuration
 */
export const appendQueryParam = (
  queryParams: URLSearchParams,
  key: string,
  value: string | number | boolean | null | undefined,
  options?: AppendQueryParamOptions
): void => {
  // Use default value if provided and value is null/undefined
  let finalValue = value;
  if ((value === null || value === undefined) && options?.defaultValue !== undefined) {
    finalValue = options.defaultValue;
  }

  // Skip if value is still null/undefined
  if (finalValue === null || finalValue === undefined) {
    return;
  }

  // Skip empty strings if option is enabled
  if (options?.skipEmptyString && finalValue === "") {
    return;
  }

  // Transform value to string
  const stringValue = options?.customTransform
    ? options.customTransform(finalValue)
    : finalValue.toString();

  queryParams.append(key, stringValue);
};

/**
 * Append multiple query parameters from an object
 * @param queryParams - URLSearchParams instance
 * @param params - Object with key-value pairs to append
 * @param options - Optional configuration applied to all params
 */
export const appendQueryParams = (
  queryParams: URLSearchParams,
  params: Record<string, string | number | boolean | null | undefined>,
  options?: AppendQueryParamOptions
): void => {
  Object.entries(params).forEach(([key, value]) => {
    appendQueryParam(queryParams, key, value, options);
  });
};

/**
 * Build a query string from an object of parameters
 * @param params - Object with key-value pairs
 * @param options - Optional configuration
 * @returns Query string (without the leading '?')
 */
export const buildQueryString = (
  params: Record<string, string | number | boolean | null | undefined>,
  options?: AppendQueryParamOptions
): string => {
  const queryParams = new URLSearchParams();
  appendQueryParams(queryParams, params, options);
  return queryParams.toString();
};

/**
 * Create a new URLSearchParams instance with parameters from an object
 * @param params - Object with key-value pairs
 * @param options - Optional configuration
 * @returns URLSearchParams instance
 * @example
 * ```typescript
 * const params = createQueryParams({
 *   page: 1,
 *   size: 10
 * });
 * ```
 */
export const createQueryParams = (
  params: Record<string, string | number | boolean | null | undefined>,
  options?: AppendQueryParamOptions
): URLSearchParams => {
  const queryParams = new URLSearchParams();
  appendQueryParams(queryParams, params, options);
  return queryParams;
};

// ==========================================
// Role-Based Assigned ID Utility Functions
// ==========================================

/**
 * Interface for parameters that have assigned ID fields
 */
export interface AssignedIdParams {
  assignedAdminId?: number | null;
  assignedManagerId?: number | null;
  assignedCounselorId?: number | null;
}

/**
 * User object interface for role-based ID resolution
 */
export interface UserForRoleBasedId {
  userId: number;
  role: string;
}

/**
 * Result of role-based assigned ID resolution
 */
export interface RoleBasedAssignedIdResult {
  key: string;
  value: number;
}

/**
 * Get role-based assigned ID based on logged-in user's role
 * This function determines which assigned ID (admin, manager, or counselor) should be used
 * based on the logged-in user's role. If a filter value is provided, it uses that;
 * otherwise, it uses the logged-in user's own ID.
 * 
 * @param user - User object with userId and role (from Redux state or token)
 * @param params - Parameters object that may contain assignedAdminId, assignedManagerId, assignedCounselorId
 * @returns Object with the appropriate assigned ID key and value, or null if user/role is invalid
 */
export const getRoleBasedAssignedId = <T extends AssignedIdParams>(
  user: UserForRoleBasedId | null,
  params: T
): RoleBasedAssignedIdResult | null => {
  if (!user || !user.userId || !user.role) {
    return null;
  }

  // Role-based ID mapping
  const roleIdMap: Record<string, { key: string; paramKey: keyof AssignedIdParams }> = {
    [UserRole.ADMIN]: { key: "assignedAdminId", paramKey: "assignedAdminId" },
    [UserRole.PRIMARY_ADMIN]: { key: "assignedAdminId", paramKey: "assignedAdminId" },
    [UserRole.MANAGER]: { key: "assignedManagerId", paramKey: "assignedManagerId" },
    [UserRole.COUNSELLOR]: { key: "assignedCounselorId", paramKey: "assignedCounselorId" },
  };

  const roleConfig = roleIdMap[user.role];
  if (!roleConfig) {
    return null;
  }

  // Use filter value if provided, otherwise use logged-in user's ID
  const filterValue = params[roleConfig.paramKey];
  const assignedId = (filterValue ?? user.userId) as number;

  return {
    key: roleConfig.key,
    value: assignedId,
  };
};

