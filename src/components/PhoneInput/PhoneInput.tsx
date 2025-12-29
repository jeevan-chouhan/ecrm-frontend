import PhoneInput2 from "react-phone-input-2";
import "react-phone-input-2/lib/style.css";
import type { ReactNode } from "react";
import { COLORS } from "../../constants";

interface PhoneInputProps {
  label?: string | ReactNode;
  value?: string;
  onChange?: (value: string, country?: any) => void;
  onBlur?: () => void;
  error?: string;
  placeholder?: string;
  fullWidth?: boolean;
  disabled?: boolean;
  country?: string;
}

const PhoneInput = ({
  label,
  value = "",
  onChange,
  onBlur,
  error,
  placeholder = "Enter phone number",
  fullWidth = false,
  disabled = false,
  country = "in",
}: PhoneInputProps) => {
  const handleChange = (phone: string, countryData: any) => {
    onChange?.(phone, countryData);
  };

  return (
    <div className={`${fullWidth ? "w-full" : ""}`}>
      {label && (
        <label
          className="block text-sm font-medium mb-1.5"
          style={{ color: COLORS.textDark, fontFamily: "'Inter', sans-serif" }}
        >
          {label}
        </label>
      )}
      <PhoneInput2
        country={country}
        value={value}
        onChange={handleChange}
        disabled={disabled}
        placeholder={placeholder}
        enableSearch
        searchPlaceholder="Search country..."
        inputProps={{
          onBlur: onBlur,
        }}
        inputStyle={{
          width: "100%",
          height: "42px",
          fontSize: "14px",
          fontFamily: "'Inter', sans-serif",
          borderRadius: "8px",
          border: `1px solid ${error ? COLORS.error : COLORS.border}`,
          backgroundColor: COLORS.surface,
          color: COLORS.textDark,
          paddingLeft: "48px",
        }}
        buttonStyle={{
          borderRadius: "8px 0 0 8px",
          borderTop: `1px solid ${error ? COLORS.error : COLORS.border}`,
          borderBottom: `1px solid ${error ? COLORS.error : COLORS.border}`,
          borderLeft: `1px solid ${error ? COLORS.error : COLORS.border}`,
          borderRight: "none",
          backgroundColor: COLORS.surface,
        }}
        dropdownStyle={{
          borderRadius: "8px",
          border: `1px solid ${COLORS.border}`,
          boxShadow: "0 4px 12px rgba(0, 0, 0, 0.15)",
        }}
        searchStyle={{
          width: "100%",
          margin: "0",
          padding: "8px 12px",
          borderRadius: "4px",
        }}
        containerClass="phone-input-container"
        inputClass="phone-input-field"
        buttonClass="phone-input-button"
        dropdownClass="phone-input-dropdown"
      />
      {error && (
        <p className="mt-1.5 text-sm" style={{ color: COLORS.error }}>
          {error}
        </p>
      )}

      {/* Custom styles to override library defaults */}
      <style>{`
        .phone-input-container {
          width: 100%;
        }
        .phone-input-container .flag-dropdown {
          border-radius: 8px 0 0 8px !important;
          border-top: 1px solid ${COLORS.border} !important;
          border-bottom: 1px solid ${COLORS.border} !important;
          border-left: 1px solid ${COLORS.border} !important;
          border-right: none !important;
          transition: border-color 0.2s ease;
        }
        .phone-input-container .flag-dropdown:hover,
        .phone-input-container .flag-dropdown:focus,
        .phone-input-container .flag-dropdown.open {
          background-color: ${COLORS.surfaceHover} !important;
        }
        .phone-input-container .selected-flag {
          border-radius: 8px 0 0 8px !important;
          padding: 0 8px 0 12px !important;
        }
        .phone-input-container .country-list {
          border-radius: 8px !important;
          max-height: 250px !important;
        }
        .phone-input-container .country-list .country:hover {
          background-color: ${COLORS.surfaceHover} !important;
        }
        .phone-input-container .country-list .country.highlight {
          background-color: ${COLORS.surfaceHover} !important;
        }
        .phone-input-field:focus {
          border-color: ${COLORS.accent} !important;
          box-shadow: 0 0 0 3px ${COLORS.accent}20 !important;
        }
        /* When input is focused, also change flag dropdown border */
        .phone-input-container:focus-within .flag-dropdown {
          border-top-color: ${COLORS.accent} !important;
          border-bottom-color: ${COLORS.accent} !important;
          border-left-color: ${COLORS.accent} !important;
        }
      `}</style>
    </div>
  );
};

export default PhoneInput;
