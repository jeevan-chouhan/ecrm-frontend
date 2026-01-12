import { enrollmentTypes, genderTypes, applicationStatusOptions, applicantStageOptions } from "../constants";

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

/**
 * Format status to capitalize first letter
 * @param value - The status value (e.g., "ACTIVE", "INACTIVE")
 * @returns Formatted status (e.g., "Active", "Inactive") or "N/A" if not found
 */
export const formatStatus = (value: string | null | undefined): string => {
  if (!value) return "N/A";
  return value.charAt(0).toUpperCase() + value.slice(1).toLowerCase();
};

/**
 * Create a Map for O(1) lookup performance
 * Maps application status values to their labels
 */
const applicationStatusMap = new Map(
  applicationStatusOptions.map((option) => [option.value, option.label])
);

/**
 * Create a Map for O(1) lookup performance
 * Maps application stage values to their labels
 */
const applicationStageMap = new Map(
  applicantStageOptions.map((option) => [option.value, option.label])
);

/**
 * Get application status label from enum value (e.g., "UNDER_UNIVERSITY_REVIEW" -> "Under University Review")
 * Uses O(1) Map lookup for optimal performance
 * @param statusValue - The application status enum value (e.g., "UNDER_UNIVERSITY_REVIEW", "DOCUMENT_PENDING")
 * @returns The formatted label (e.g., "Under University Review", "Document Pending") or original value if not found
 */
export const getApplicationStatusLabel = (statusValue: string | null | undefined): string => {
  if (!statusValue) return "-";
  return applicationStatusMap.get(statusValue) || statusValue;
};

/**
 * Get application stage label from enum value (e.g., "APPLICATION_SUBMITTED" -> "Application Submitted")
 * Uses O(1) Map lookup for optimal performance
 * @param stageValue - The application stage enum value (e.g., "APPLICATION_SUBMITTED", "OFFER_AWAITING")
 * @returns The formatted label (e.g., "Application Submitted", "Offer Awaiting") or original value if not found
 */
export const getApplicationStageLabel = (stageValue: string | null | undefined): string => {
  if (!stageValue) return "-";
  return applicationStageMap.get(stageValue) || stageValue;
};

