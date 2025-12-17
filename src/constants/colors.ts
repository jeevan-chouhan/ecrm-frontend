// ==========================================
// Final Colour Palette
// ==========================================

export const colors = {
  // Primary Colors
  primary: "#1E90FF",
  primaryHover: "#1C86EE",
  secondary: "#20B2AA",
  secondaryHover: "#1C9E99",
  accent: "#8A2BE2",
  accentHover: "#7B27CC",

  // Background Colors
  background: "#F5F5F5",
  surface: "#FFFFFF",
  surfaceHover: "#F0F0FF",

  // Border Colors
  border: "#D3D3D3",
  borderFocus: "#1E90FF",

  // Text Colors
  textDark: "#333333",
  textMuted: "#6B7280",
  textWhite: "#FFFFFF",
  textPlaceholder: "#9CA3AF",

  // Status Colors
  success: "#10B981",
  successHover: "#059669",
  error: "#EF4444",
  errorHover: "#DC2626",
  warning: "#F59E0B",
  warningHover: "#D97706",
  info: "#3B82F6",
  infoHover: "#2563EB",
} as const;

// ==========================================
// Stage/Status Colors
// ==========================================

export const stageColors = {
  pending: {
    bg: "#FFFACD",
    text: "#92400E",
    label: "Pending",
  },
  lead: {
    bg: "#2F4F4F",
    text: "#FFFFFF",
    label: "Lead",
  },
  applicationSubmitted: {
    bg: "#4169E1",
    text: "#FFFFFF",
    label: "Application Submitted",
  },
  documentSubmission: {
    bg: "#4B0082",
    text: "#FFFFFF",
    label: "Document Submission",
  },
  counselling: {
    bg: "#008080",
    text: "#FFFFFF",
    label: "Counselling + Consideration",
  },
  offer: {
    bg: "#00BFFF",
    text: "#FFFFFF",
    label: "Offer",
  },
  visa: {
    bg: "#9370DB",
    text: "#FFFFFF",
    label: "Visa",
  },
  selected: {
    bg: "#4682B4",
    text: "#FFFFFF",
    label: "Selected + Enrolled",
  },
  rejected: {
    bg: "#8B0000",
    text: "#FFFFFF",
    label: "Rejected",
  },
} as const;

// ==========================================
// Typography
// ==========================================

export const typography = {
  fontFamily: {
    primary: "'Inter', sans-serif",
    fallback: "'Open Sans', sans-serif",
  },
  fontSize: {
    h1: "32px",
    h2: "24px",
    h3: "20px",
    h4: "18px",
    body: "16px",
    small: "14px",
    caption: "12px",
  },
  fontWeight: {
    regular: 400,
    medium: 500,
    semibold: 600,
    bold: 700,
  },
  lineHeight: {
    tight: 1.25,
    normal: 1.5,
    relaxed: 1.75,
  },
} as const;

// ==========================================
// Component Specs
// ==========================================

export const componentSpecs = {
  button: {
    borderRadius: "8px",
    padding: {
      sm: "8px 12px",
      md: "12px 20px",
      lg: "16px 28px",
    },
  },
  input: {
    borderRadius: "8px",
    borderColor: colors.border,
    focusBorderColor: colors.borderFocus,
  },
  card: {
    borderRadius: "12px",
    boxShadow: "0 1px 4px rgba(0, 0, 0, 0.05)",
    background: colors.surface,
  },
  sidebar: {
    width: "240px",
    collapsedWidth: "72px",
  },
} as const;

// ==========================================
// Shadows
// ==========================================

export const shadows = {
  sm: "0 1px 2px rgba(0, 0, 0, 0.05)",
  md: "0 1px 4px rgba(0, 0, 0, 0.05)",
  lg: "0 4px 6px rgba(0, 0, 0, 0.1)",
  xl: "0 10px 15px rgba(0, 0, 0, 0.1)",
} as const;

// ==========================================
// Export Types
// ==========================================

export type ColorKey = keyof typeof colors;
export type StageKey = keyof typeof stageColors;
export type FontSizeKey = keyof typeof typography.fontSize;
export type FontWeightKey = keyof typeof typography.fontWeight;

