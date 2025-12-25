import { memo } from "react";
import { COLORS } from "../../../constants";

/**
 * Reusable component for displaying a label-value pair in detail views
 */
interface DetailFieldProps {
  label: string;
  value: string | React.ReactNode;
  className?: string;
}

export const DetailField = memo(({ label, value, className = "" }: DetailFieldProps) => {
  return (
    <div className={className}>
      <div className="space-y-1">
        <label
          className="text-xs font-medium uppercase tracking-wide"
          style={{ color: COLORS.textMuted }}
        >
          {label}
        </label>
        {typeof value === "string" ? (
          <p
            className="text-sm font-medium"
            style={{ color: COLORS.textDark }}
          >
            {value}
          </p>
        ) : (
          <div style={{ color: COLORS.textDark }}>{value}</div>
        )}
      </div>
    </div>
  );
});

DetailField.displayName = "DetailField";

/**
 * Reusable empty state component for displaying "no data" messages
 */
interface EmptyStateProps {
  message: string;
  className?: string;
}

export const EmptyState = memo(({ message, className = "" }: EmptyStateProps) => {
  return (
    <p className={`text-sm ${className}`} style={{ color: COLORS.textMuted }}>
      {message}
    </p>
  );
});

EmptyState.displayName = "EmptyState";

