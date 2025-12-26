/**
 * Date formatting utility functions
 */

/**
 * Formats a date to DD-MM-YYYY format
 * @param date - Date object or date string
 * @returns Formatted date string in DD-MM-YYYY format (e.g., "25-12-2025")
 */
export const formatDate = (date: Date | string): string => {
  const d = typeof date === "string" ? new Date(date) : date;
  
  // Validate date
  if (isNaN(d.getTime())) {
    console.warn("Invalid date provided to formatDate:", date);
    return "";
  }
  
  const day = String(d.getDate()).padStart(2, "0");
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const year = d.getFullYear();
  return `${day}-${month}-${year}`;
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
 * @param format - Format string (e.g., "YYYY-MM-DD", "DD/MM/YYYY")
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
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const year = d.getFullYear();
  
  return format
    .replace("DD", day)
    .replace("MM", month)
    .replace("YYYY", String(year))
    .replace("YY", String(year).slice(-2));
};

