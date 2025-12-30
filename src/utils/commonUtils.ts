import { enrollmentTypes, genderTypes } from "../constants";

/**
 * Common utility functions
 */

/**
 * Generic function to get label from a constant array by value
 * @param value - The value to search for
 * @param constants - Array of objects with value and label properties
 * @returns The label if found, otherwise the original value or "-"
 */
export const getLabelFromConstant = <T extends { value: string; label: string }>(
  value: string | undefined,
  constants: T[]
): string => {
  if (!value) return "-";
  const option = constants.find((opt) => opt.value === value);
  return option?.label || value;
};

/**
 * Get enrollment type label from value
 * @param value - The enrollment type value (e.g., "referred-to-agency")
 * @returns The enrollment type label (e.g., "Referred to Agency Partner") or "-" if not found
 */
export const getEnrollmentTypeLabel = (value: string | undefined): string => {
  return getLabelFromConstant(value, enrollmentTypes);
};

/**
 * Get gender label from value
 * @param value - The gender value (e.g., "female")
 * @returns The gender label (e.g., "Female") or "-" if not found
 */
export const getGenderLabel = (value: string | undefined): string => {
  return getLabelFromConstant(value, genderTypes);
};

