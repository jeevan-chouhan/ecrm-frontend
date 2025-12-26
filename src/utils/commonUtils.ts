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

