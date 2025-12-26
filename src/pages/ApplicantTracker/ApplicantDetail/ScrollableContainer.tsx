import { useMemo, memo } from "react";
import type { ReactNode } from "react";
import { COLORS } from "../../../constants";

interface ScrollableContainerProps {
  children: ReactNode;
  maxHeight?: string;
  className?: string;
  scrollbarClassName?: string;
}

/**
 * Reusable scrollable container with custom scrollbar styling
 */
const ScrollableContainer = ({
  children,
  maxHeight = "400px",
  className = "",
  scrollbarClassName = "scrollable-container",
}: ScrollableContainerProps) => {
  // Memoize styles to prevent recreation on every render
  const scrollbarStyles = useMemo(() => `
    .${scrollbarClassName}::-webkit-scrollbar {
      width: 10px;
    }
    .${scrollbarClassName}::-webkit-scrollbar-track {
      background: ${COLORS.background};
      border-radius: 10px;
    }
    .${scrollbarClassName}::-webkit-scrollbar-thumb {
      background: ${COLORS.accent};
      border-radius: 10px;
      border: 2px solid ${COLORS.background};
      transition: background 0.2s ease;
    }
    .${scrollbarClassName}::-webkit-scrollbar-thumb:hover {
      background: ${COLORS.accentHover};
    }
    .${scrollbarClassName} {
      scrollbar-width: thin;
      scrollbar-color: ${COLORS.accent} ${COLORS.background};
    }
  `, [scrollbarClassName]);

  return (
    <>
      <style>{scrollbarStyles}</style>
      <div
        className={`${scrollbarClassName} ${className}`}
        style={{
          maxHeight,
          overflowY: "auto",
          paddingRight: "8px",
        }}
      >
        {children}
      </div>
    </>
  );
};

export default memo(ScrollableContainer);

