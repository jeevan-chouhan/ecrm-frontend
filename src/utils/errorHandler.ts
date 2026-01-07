/**
 * Common Error Handler Utility
 * Handles API errors and returns appropriate error messages based on status codes
 */

export interface ApiError {
  status?: number;
  message?: string;
  data?: {
    message?: string;
    errors?: Record<string, string[]>;
  };
}

export interface ErrorResponse {
  message: string;
  status: number;
}

/**
 * HTTP Status code error messages
 */
const STATUS_MESSAGES: Record<number, string> = {
  400: "Bad Request - Please check your input",
  401: "Unauthorized - Please login again",
  403: "Forbidden - You don't have permission to access this resource",
  404: "Not Found - The requested resource was not found",
  405: "Method Not Allowed",
  408: "Request Timeout - Please try again",
  409: "Conflict - The resource already exists",
  422: "Validation Error - Please check your input",
  429: "Too Many Requests - Please wait and try again",
  500: "Internal Server Error - Please try again later",
  502: "Bad Gateway - Server is temporarily unavailable",
  503: "Service Unavailable - Please try again later",
  504: "Gateway Timeout - Please try again",
};

/**
 * Get error message based on status code
 * @param status - HTTP status code
 * @returns Error message
 */
export const getStatusMessage = (status: number): string => {
  return STATUS_MESSAGES[status] || "An unexpected error occurred";
};

/**
 * Handle API error and return formatted error response
 * @param error - Error object from API call
 * @param defaultMessage - Default message if no specific message found
 * @returns Formatted error response
 */
export const handleApiError = (
  error: any,
  defaultMessage: string = "Something went wrong"
): ErrorResponse => {
  // Network error (no response)
  if (!error.response) {
    return {
      message: error.message || "Network error - Please check your connection",
      status: 0,
    };
  }

  const { status, data } = error.response;

  // Get message from response data
  let message = data?.message || data?.error || getStatusMessage(status) || defaultMessage;

  // Handle validation errors (array of errors)
  if (data?.errors && typeof data.errors === "object") {
    const errorMessages = Object.values(data.errors).flat();
    if (errorMessages.length > 0) {
      message = errorMessages.join(", ");
    }
  }

  return {
    message,
    status,
  };
};

/**
 * Check if error is an authentication error (401)
 * @param error - Error object
 * @returns true if 401 error
 */
export const isAuthError = (error: any): boolean => {
  return error?.response?.status === 401;
};

/**
 * Check if error is a forbidden error (403)
 * @param error - Error object
 * @returns true if 403 error
 */
export const isForbiddenError = (error: any): boolean => {
  return error?.response?.status === 403;
};

/**
 * Check if error is a not found error (404)
 * @param error - Error object
 * @returns true if 404 error
 */
export const isNotFoundError = (error: any): boolean => {
  return error?.response?.status === 404;
};

/**
 * Check if error is a validation error (400 or 422)
 * @param error - Error object
 * @returns true if validation error
 */
export const isValidationError = (error: any): boolean => {
  const status = error?.response?.status;
  return status === 400 || status === 422;
};

/**
 * Check if error is a server error (5xx)
 * @param error - Error object
 * @returns true if server error
 */
export const isServerError = (error: any): boolean => {
  const status = error?.response?.status;
  return status >= 500 && status < 600;
};

/**
 * Get error status code
 * @param error - Error object
 * @returns Status code or 0 if not available
 */
export const getErrorStatus = (error: any): number => {
  return error?.response?.status || 0;
};

export default handleApiError;

