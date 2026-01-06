/**
 * Date formatting utility functions
 */

// Month abbreviations
const MONTH_NAMES = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

/**
 * Formats a date to DD MMM YYYY format
 * @param date - Date object or date string
 * @returns Formatted date string in DD MMM YYYY format (e.g., "31 Dec 2025")
 */
export const formatDate = (date: Date | string): string => {
  const d = typeof date === "string" ? new Date(date) : date;
  
  // Validate date
  if (isNaN(d.getTime())) {
    console.warn("Invalid date provided to formatDate:", date);
    return "";
  }
  
  const day = d.getDate();
  const month = MONTH_NAMES[d.getMonth()];
  const year = d.getFullYear();
  return `${day} ${month} ${year}`;
};

/**
 * Formats a date value to DD-MM-YYYY format, returning "-" if date is null/undefined
 * @param date - Date object, date string, null, or undefined
 * @returns Formatted date string or "-" if date is invalid/null/undefined
 */
export const formatDateValue = (date: string | Date | null | undefined): string => {
  if (!date) return "-";
  try {
    const formatted = formatDate(date);
    return formatted || "-";
  } catch {
    return "-";
  }
};

/**
 * Formats a date to a different format if needed
 * @param date - Date object or date string
 * @param format - Format string (e.g., "YYYY-MM-DD", "DD/MM/YYYY", "DD MMM YYYY")
 * @returns Formatted date string
 */
export const formatDateCustom = (date: Date | string, format: string): string => {
  const d = typeof date === "string" ? new Date(date) : date;
  
  // Validate date
  if (isNaN(d.getTime())) {
    console.warn("Invalid date provided to formatDateCustom:", date);
    return "";
  }
  
  const day = String(d.getDate()).padStart(2, "0");
  const dayNum = String(d.getDate());
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const monthName = MONTH_NAMES[d.getMonth()];
  const year = d.getFullYear();
  
  return format
    .replace("DD", day)
    .replace("D", dayNum)
    .replace("MMM", monthName)
    .replace("MM", month)
    .replace("YYYY", String(year))
    .replace("YY", String(year).slice(-2));
};

/**
 * Normalizes a date to the start of the day (00:00:00.000)
 * @param date - Date object, date string, or null/undefined
 * @returns Date object set to start of day, or null if input is null/undefined
 */
export const normalizeDateToStartOfDay = (date: Date | string | null | undefined): Date | null => {
  if (!date) return null;
  const d = typeof date === "string" ? new Date(date) : date;
  
  // Validate date
  if (isNaN(d.getTime())) {
    console.warn("Invalid date provided to normalizeDateToStartOfDay:", date);
    return null;
  }
  
  const normalized = new Date(d);
  normalized.setHours(0, 0, 0, 0);
  return normalized;
};

/**
 * Normalizes a date to the end of the day (23:59:59.999)
 * @param date - Date object, date string, or null/undefined
 * @returns Date object set to end of day, or null if input is null/undefined
 */
export const normalizeDateToEndOfDay = (date: Date | string | null | undefined): Date | null => {
  if (!date) return null;
  const d = typeof date === "string" ? new Date(date) : date;
  
  // Validate date
  if (isNaN(d.getTime())) {
    console.warn("Invalid date provided to normalizeDateToEndOfDay:", date);
    return null;
  }
  
  const normalized = new Date(d);
  normalized.setHours(23, 59, 59, 999);
  return normalized;
};

