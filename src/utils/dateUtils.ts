/**
 * Date formatting utility functions
 */

import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import timezone from "dayjs/plugin/timezone";

// Extend dayjs with plugins
dayjs.extend(utc);
dayjs.extend(timezone);

/**
 * Formats a date to YYYY-MM-DD format (date only) without timezone conversion
 * Use this for API parameters where you want to preserve the local date as selected
 * @param date - Date object or null
 * @returns Formatted date string in YYYY-MM-DD format (e.g., "2025-01-20") or null if date is null
 */
export const formatDateToYYYYMMDD = (date: Date | null): string | null => {
  if (!date) return null;
  // Use local date components to avoid timezone conversion
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

/**
 * Converts a YYYY-MM-DD date string to ISO DATE_TIME format (YYYY-MM-DDTHH:mm:ss)
 * For appliedFrom/appliedTo: sets time to 00:00:00 (start of day)
 * @param dateStr - Date string in YYYY-MM-DD format or null
 * @returns Formatted date string in ISO DATE_TIME format or null if dateStr is null
 */
export const formatDateToISODateTime = (dateStr: string | null, setToStartOfDay = true): string | null => {
  if (!dateStr) return null;
  // Parse YYYY-MM-DD and convert to ISO DATE_TIME
  const [year, month, day] = dateStr.split("-");
  if (!year || !month || !day) return null;
  
  if (setToStartOfDay) {
    return `${year}-${month}-${day}T00:00:00`;
  } else {
    // For end of day, use 23:59:59
    return `${year}-${month}-${day}T23:59:59`;
  }
};

/**
 * Formats a date to DD MMM YYYY format (date only, no time) - converts UTC to local timezone
 * Use this for dates like dateOfBirth, passingYear, work experience dates, etc.
 * @param date - Date object or date string (assumed to be in UTC from backend)
 * @returns Formatted date string in DD MMM YYYY format (e.g., "31 Dec 2025")
 */
export const formatDateOnly = (date: Date | string): string => {
  if (!date) {
    console.warn("Invalid date provided to formatDateOnly:", date);
    return "";
  }
  
  try {
    // Parse the date and convert from UTC to local timezone
    const dayjsDate = dayjs(date).local();
    
    // Validate date
    if (!dayjsDate.isValid()) {
      console.warn("Invalid date provided to formatDateOnly:", date);
      return "";
    }
    
    return dayjsDate.format("DD MMM YYYY");
  } catch (error) {
    console.warn("Error formatting date:", date, error);
    return "";
  }
};

/**
 * Formats a date to DD MMM YYYY, hh:mm A format (with time) - converts UTC to local timezone
 * Use this for created/updated timestamps (createdAt, updatedAt, appliedDate, lastUpdatedDate)
 * @param date - Date object or date string (assumed to be in UTC from backend)
 * @returns Formatted date string in DD MMM YYYY, hh:mm A format (e.g., "31 Dec 2025, 02:30 PM")
 */
export const formatDate = (date: Date | string): string => {
  if (!date) {
    console.warn("Invalid date provided to formatDate:", date);
    return "";
  }
  
  try {
    // Parse the date and convert from UTC to local timezone
    const dayjsDate = dayjs(date).local();
    
    // Validate date
    if (!dayjsDate.isValid()) {
      console.warn("Invalid date provided to formatDate:", date);
      return "";
    }
    
    return dayjsDate.format("DD MMM YYYY, hh:mm A");
  } catch (error) {
    console.warn("Error formatting date:", date, error);
    return "";
  }
};

/**
 * Formats a date value to DD MMM YYYY format (date only), returning "-" if date is null/undefined
 * Use this for dates like dateOfBirth, passingYear, work experience dates, etc.
 * @param date - Date object, date string, null, or undefined (assumed to be in UTC from backend)
 * @returns Formatted date string in DD MMM YYYY format or "-" if date is invalid/null/undefined
 */
export const formatDateValue = (date: string | Date | null | undefined): string => {
  if (!date) return "-";
  try {
    const formatted = formatDateOnly(date);
    return formatted || "-";
  } catch {
    return "-";
  }
};

/**
 * Formats a date to a different format if needed (converts UTC to local timezone)
 * @param date - Date object or date string (assumed to be in UTC from backend)
 * @param format - Format string (e.g., "YYYY-MM-DD", "DD/MM/YYYY", "DD MMM YYYY")
 * @returns Formatted date string
 */
export const formatDateCustom = (date: Date | string, format: string): string => {
  if (!date) {
    console.warn("Invalid date provided to formatDateCustom:", date);
    return "";
  }
  
  try {
    // Parse the date and convert from UTC to local timezone
    const dayjsDate = dayjs(date).local();
    
    // Validate date
    if (!dayjsDate.isValid()) {
      console.warn("Invalid date provided to formatDateCustom:", date);
      return "";
    }
    
    return dayjsDate.format(format);
  } catch (error) {
    console.warn("Error formatting date:", date, error);
    return "";
  }
};

/**
 * Normalizes a date to the start of the day (00:00:00.000) in local timezone
 * @param date - Date object, date string, or null/undefined
 * @returns Date object set to start of day, or null if input is null/undefined
 */
export const normalizeDateToStartOfDay = (date: Date | string | null | undefined): Date | null => {
  if (!date) return null;
  
  try {
    const dayjsDate = dayjs(date).local();
    
    if (!dayjsDate.isValid()) {
      console.warn("Invalid date provided to normalizeDateToStartOfDay:", date);
      return null;
    }
    
    return dayjsDate.startOf("day").toDate();
  } catch (error) {
    console.warn("Error normalizing date:", date, error);
    return null;
  }
};

/**
 * Normalizes a date to the end of the day (23:59:59.999) in local timezone
 * @param date - Date object, date string, or null/undefined
 * @returns Date object set to end of day, or null if input is null/undefined
 */
export const normalizeDateToEndOfDay = (date: Date | string | null | undefined): Date | null => {
  if (!date) return null;
  
  try {
    const dayjsDate = dayjs(date).local();
    
    if (!dayjsDate.isValid()) {
      console.warn("Invalid date provided to normalizeDateToEndOfDay:", date);
      return null;
    }
    
    return dayjsDate.endOf("day").toDate();
  } catch (error) {
    console.warn("Error normalizing date:", date, error);
    return null;
  }
};

/**
 * Formats a date to DD MMM YYYY, hh:mm A format (with time) - converts UTC to local timezone
 * Use this for created/updated timestamps (createdAt, updatedAt, appliedDate, lastUpdatedDate)
 * @param date - Date object or date string (assumed to be in UTC from backend)
 * @returns Formatted date-time string in DD MMM YYYY, hh:mm A format (e.g., "31 Dec 2025, 02:30 PM")
 */
export const formatDateTime = (date: Date | string): string => {
  if (!date) {
    console.warn("Invalid date provided to formatDateTime:", date);
    return "";
  }
  
  try {
    // Parse the date and convert from UTC to local timezone
    const dayjsDate = dayjs(date).local();
    
    // Validate date
    if (!dayjsDate.isValid()) {
      console.warn("Invalid date provided to formatDateTime:", date);
      return "";
    }
    
    return dayjsDate.format("DD MMM YYYY, hh:mm A");
  } catch (error) {
    console.warn("Error formatting date:", date, error);
    return "";
  }
};


/**
 * Formats a date to "MMM D, YYYY" format (e.g., "Jan 28, 2026")
 * Use this for short date display like subscription renewal dates
 * @param date - Date object or date string (assumed to be in UTC from backend)
 * @returns Formatted date string in "MMM D, YYYY" format
 */
export const formatDateShort = (date: Date | string): string => {
  if (!date) {
    console.warn("Invalid date provided to formatDateShort:", date);
    return "";
  }
  
  try {
    // Parse the date and convert from UTC to local timezone
    const dayjsDate = dayjs(date).local();
    
    // Validate date
    if (!dayjsDate.isValid()) {
      console.warn("Invalid date provided to formatDateShort:", date);
      return "";
    }
    
    return dayjsDate.format("MMM D, YYYY");
  } catch (error) {
    console.warn("Error formatting date:", date, error);
    return "";
  }
};

/**
 * Calculate days remaining from today until a given date
 * Use this for calculating trial period remaining days
 * @param renewsOn - Date string for the target date
 * @returns Number of days remaining (0 if date has passed)
 */
export const getDaysRemaining = (renewsOn: string): number => {
  if (!renewsOn) return 0;
  
  try {
    const today = dayjs().startOf("day");
    const renewDate = dayjs(renewsOn).startOf("day");
    
    if (!renewDate.isValid()) {
      console.warn("Invalid date provided to getDaysRemaining:", renewsOn);
      return 0;
    }
    
    const diffDays = renewDate.diff(today, "day");
    return diffDays > 0 ? diffDays : 0;
  } catch (error) {
    console.warn("Error calculating days remaining:", renewsOn, error);
    return 0;
  }
};
