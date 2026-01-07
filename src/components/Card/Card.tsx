import type { ReactNode } from "react";
import { COLORS, componentSpecs, shadows } from "../../constants";

interface CardProps {
  children: ReactNode;
  title?: string | ReactNode;
  subtitle?: string;
  headerIcon?: ReactNode;
  headerAction?: ReactNode;
  footer?: ReactNode;
  padding?: "none" | "sm" | "md" | "lg";
  shadow?: "none" | "sm" | "md" | "lg";
  bordered?: boolean;
  hoverable?: boolean;
  className?: string;
  headerBackgroundColor?: string;
  headerTextColor?: string;
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
  headerIcon,
  headerAction,
  footer,
  padding = "md",
  shadow = "md",
  hoverable = false,
  className = "",
  headerBackgroundColor,
  headerTextColor,
}: CardProps) => {
  const hasColoredHeader = !!headerBackgroundColor;
  
  return (
    <div
      className={`
        transition-shadow duration-200 overflow-hidden
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
            borderBottom: children || footer ? (hasColoredHeader ? "none" : `1px solid ${COLORS.border}`) : "none",
            backgroundColor: headerBackgroundColor || "transparent",
            borderTopLeftRadius: componentSpecs.card.borderRadius,
            borderTopRightRadius: componentSpecs.card.borderRadius,
          }}
        >
          <div className="flex items-center gap-3">
            {headerIcon && (
              <div 
                className="w-10 h-10 rounded-lg flex items-center justify-center"
                style={{ backgroundColor: hasColoredHeader ? "rgba(255, 255, 255, 0.2)" : COLORS.surface }}
              >
                {headerIcon}
              </div>
            )}
            <div>
              {title && (
                <h3
                  className="text-lg font-semibold"
                  style={{ color: headerTextColor || COLORS.textDark }}
                >
                  {title}
                </h3>
              )}
              {subtitle && (
                <p
                  className="mt-0.5 text-sm"
                  style={{ color: hasColoredHeader ? "rgba(255, 255, 255, 0.8)" : COLORS.textMuted }}
                >
                  {subtitle}
                </p>
              )}
            </div>
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
