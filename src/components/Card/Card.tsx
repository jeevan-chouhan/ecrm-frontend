import type { ReactNode } from "react";
import { COLORS, componentSpecs, shadows } from "../../constants";

interface CardProps {
  children: ReactNode;
  title?: string;
  subtitle?: string;
  headerAction?: ReactNode;
  footer?: ReactNode;
  padding?: "none" | "sm" | "md" | "lg";
  shadow?: "none" | "sm" | "md" | "lg";
  bordered?: boolean;
  hoverable?: boolean;
  className?: string;
}

const paddingStyles = {
  none: "0",
  sm: "12px",
  md: "16px",
  lg: "24px",
};

const Card = ({
  children,
  title,
  subtitle,
  headerAction,
  footer,
  padding = "md",
  shadow = "md",
  hoverable = false,
  className = "",
}: CardProps) => {
  return (
    <div
      className={`
        transition-shadow duration-200
        ${hoverable ? "hover:shadow-lg cursor-pointer" : ""}
        ${className}
      `}
      style={{
        backgroundColor: componentSpecs.card.background,
        borderRadius: componentSpecs.card.borderRadius,
        boxShadow: shadow !== "none" ? shadows[shadow] : "none",
        border: `1px solid ${COLORS.border}`,
      }}
    >
      {/* Header */}
      {(title || headerAction) && (
        <div
          className="flex items-center justify-between"
          style={{
            padding: padding !== "none" ? "16px 20px" : "0",
            borderBottom: children || footer ? `1px solid ${COLORS.border}` : "none",
          }}
        >
          <div>
            {title && (
              <h3
                className="text-lg font-semibold"
                style={{ color: COLORS.textDark, fontFamily: "'Inter', sans-serif" }}
              >
                {title}
              </h3>
            )}
            {subtitle && (
              <p
                className="mt-0.5 text-sm"
                style={{ color: COLORS.textMuted }}
              >
                {subtitle}
              </p>
            )}
          </div>
          {headerAction && <div>{headerAction}</div>}
        </div>
      )}

      {/* Body */}
      <div style={{ padding: paddingStyles[padding] }}>{children}</div>

      {/* Footer */}
      {footer && (
        <div
          style={{
            padding: padding !== "none" ? "16px 20px" : "0",
            borderTop: `1px solid ${COLORS.border}`,
            backgroundColor: COLORS.background,
            borderBottomLeftRadius: componentSpecs.card.borderRadius,
            borderBottomRightRadius: componentSpecs.card.borderRadius,
          }}
        >
          {footer}
        </div>
      )}
    </div>
  );
};

export default Card;
