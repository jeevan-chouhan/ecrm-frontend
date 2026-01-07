// Common regex patterns for validation

export const REGEX = {
  // Email validation
  EMAIL: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,

  // Password: at least 8 characters, 1 uppercase, 1 number, 1 special character
  PASSWORD_STRONG: /^(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]).{8,}$/,

  // Password: at least 8 characters
  PASSWORD_MIN: /^.{8,}$/,

  // Phone number: at least 10 digits
  PHONE: /^\d{10,}$/,

  // Only letters and spaces
  NAME: /^[a-zA-Z\s]+$/,

  // Alphanumeric with spaces
  ALPHANUMERIC: /^[a-zA-Z0-9\s]+$/,

  // URL validation
  URL: /^(https?:\/\/)?([\da-z.-]+)\.([a-z.]{2,6})([/\w .-]*)*\/?$/,

  // Score validation: supports decimal numbers (for percentage, CGPA, GPA)
  SCORE: /^\d+(\.\d{1,2})?$/,

  // OTP: Single digit (0-9)
  SINGLE_DIGIT: /^\d$/,

  // OTP: Multiple digits only
  DIGITS_ONLY: /^\d+$/,

  // Decimal number: allows empty, integers, and decimal numbers (e.g., 12, 12.5, .5)
  DECIMAL_NUMBER: /^\d*\.?\d*$/,

  // Non-digit characters (for extracting/removing non-digits)
  NON_DIGIT: /\D/g,

  // Whitespace (one or more spaces)
  WHITESPACE: /\s+/g,

  // Forward slash
  FORWARD_SLASH: /\//g,

  // Base64 URL to Base64 conversion (for JWT decoding)
  BASE64_URL_HYPHEN: /-/g,
  BASE64_URL_UNDERSCORE: /_/g,
} as const;

// Validation helper functions
export const isValidEmail = (email: string): boolean => {
  return REGEX.EMAIL.test(email);
};

export const isValidPassword = (password: string): boolean => {
  return REGEX.PASSWORD_MIN.test(password);
};

export const isStrongPassword = (password: string): boolean => {
  return REGEX.PASSWORD_STRONG.test(password);
};

export const isValidPhone = (phone: string): boolean => {
  // Remove non-digit characters for validation
  const digitsOnly = phone.replace(REGEX.NON_DIGIT, "");
  return digitsOnly.length >= 10;
};

export const isValidName = (name: string): boolean => {
  return REGEX.NAME.test(name) && name.trim().length > 0;
};

// OTP validation helpers
export const isSingleDigit = (value: string): boolean => {
  return REGEX.SINGLE_DIGIT.test(value);
};

export const isDigitsOnly = (value: string): boolean => {
  return REGEX.DIGITS_ONLY.test(value);
};

// Decimal number validation (for percentage, amount inputs)
export const isValidDecimalInput = (value: string): boolean => {
  return value === "" || REGEX.DECIMAL_NUMBER.test(value);
};

// Extract only digits from a string
export const extractDigits = (value: string): string => {
  return value.replace(REGEX.NON_DIGIT, "");
};

// Convert string to slug format (replace spaces and special chars with hyphens)
export const toSlug = (value: string): string => {
  return value
    .toLowerCase()
    .replace(REGEX.WHITESPACE, "-")
    .replace(REGEX.FORWARD_SLASH, "-");
};

// Convert base64url to base64 (for JWT decoding)
export const base64UrlToBase64 = (base64Url: string): string => {
  return base64Url
    .replace(REGEX.BASE64_URL_HYPHEN, "+")
    .replace(REGEX.BASE64_URL_UNDERSCORE, "/");
};

