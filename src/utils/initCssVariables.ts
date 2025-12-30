/**
 * Initialize CSS variables from colors.ts
 * This must run before any CSS is loaded to prevent FOUC (Flash of Unstyled Content)
 * CSS variables are evaluated at render time, but setting them early ensures
 * they're available when styles are first applied
 */
import { COLORS } from '../constants';

// Set CSS variables immediately when this module loads
// This runs synchronously before any CSS imports
const root = document.documentElement;
root.style.setProperty('--color-accent', COLORS.accent);
root.style.setProperty('--color-accent-hover', COLORS.accentHover);
root.style.setProperty('--color-background', COLORS.background);
root.style.setProperty('--color-primary', COLORS.primary);
root.style.setProperty('--color-primary-hover', COLORS.primaryHover);
root.style.setProperty('--color-border-focus', COLORS.borderFocus);

