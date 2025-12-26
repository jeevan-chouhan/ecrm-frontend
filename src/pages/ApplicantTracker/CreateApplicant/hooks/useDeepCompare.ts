/**
 * Efficient deep comparison utility for form values
 * Avoids JSON.stringify overhead by using shallow comparison first,
 * then deep comparison only when necessary
 */

/**
 * Performs a shallow comparison of two objects
 */
function shallowEqual<T>(obj1: T, obj2: T): boolean {
  if (obj1 === obj2) return true;
  if (obj1 == null || obj2 == null) return false;
  if (typeof obj1 !== "object" || typeof obj2 !== "object") return false;

  const keys1 = Object.keys(obj1);
  const keys2 = Object.keys(obj2);

  if (keys1.length !== keys2.length) return false;

  for (const key of keys1) {
    if (!(key in obj2) || (obj1 as any)[key] !== (obj2 as any)[key]) {
      return false;
    }
  }

  return true;
}

/**
 * Performs deep comparison of two values
 * More efficient than JSON.stringify for most cases
 */
export function deepEqual<T>(a: T, b: T): boolean {
  // Quick reference check
  if (a === b) return true;

  // Handle null/undefined
  if (a == null || b == null) return a === b;
  if (a == null && b == null) return true;

  // Handle primitives
  if (typeof a !== "object" || typeof b !== "object") return a === b;

  // Handle arrays
  if (Array.isArray(a) && Array.isArray(b)) {
    if (a.length !== b.length) return false;
    for (let i = 0; i < a.length; i++) {
      if (!deepEqual(a[i], b[i])) return false;
    }
    return true;
  }

  // Handle Date objects
  if (a instanceof Date && b instanceof Date) {
    return a.getTime() === b.getTime();
  }

  // Handle File objects (compare by name and size)
  if (a instanceof File && b instanceof File) {
    return a.name === b.name && a.size === b.size && a.type === b.type;
  }

  // Handle objects - try shallow first, then deep
  if (!shallowEqual(a, b)) {
    // If shallow fails, do deep comparison
    const keysA = Object.keys(a);
    const keysB = Object.keys(b);

    if (keysA.length !== keysB.length) return false;

    for (const key of keysA) {
      if (!keysB.includes(key)) return false;
      if (!deepEqual((a as any)[key], (b as any)[key])) return false;
    }

    return true;
  }

  return true;
}

/**
 * Optimized comparison function that uses shallow comparison first,
 * then falls back to deep comparison only when necessary
 */
export function efficientCompare<T>(prev: T, current: T): boolean {
  // Quick reference check
  if (prev === current) return false;

  // Try shallow comparison first (much faster)
  if (shallowEqual(prev, current)) return false;

  // Only do deep comparison if shallow fails
  return !deepEqual(prev, current);
}

