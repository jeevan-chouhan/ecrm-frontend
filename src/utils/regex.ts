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
  const digitsOnly = phone.replace(/\D/g, "");
  return digitsOnly.length >= 10;
};

export const isValidName = (name: string): boolean => {
  return REGEX.NAME.test(name) && name.trim().length > 0;
};

