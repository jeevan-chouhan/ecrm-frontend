import { useState, type ReactNode } from "react";
import { ChevronDown } from "../../assets";
import { COLORS } from "../../constants";

interface AccordionProps {
  title: ReactNode;
  count?: number;
  children: ReactNode;
  defaultExpanded?: boolean;
  className?: string;
}

interface AccordionGroupProps {
  children: ReactNode;
  className?: string;
}

const Accordion = ({
  title,
  count,
  children,
  defaultExpanded = false,
  className = "",
}: AccordionProps) => {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);

  return (
    <div
      className={`rounded-lg overflow-hidden ${className}`}
      style={{ border: `1px solid ${COLORS.border}` }}
    >
      {/* Accordion Header */}
      <button
        type="button"
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between px-4 py-3 transition-colors duration-200 hover:bg-slate-50"
        style={{
          backgroundColor: COLORS.surface,
        }}
      >
        <div className="flex items-center gap-2">
          <span
            className="font-medium text-sm"
            style={{ color: COLORS.textDark }}
          >
            {title}
          </span>
          {count !== undefined && (
            <span className="text-sm" style={{ color: COLORS.textMuted }}>
              ({count})
            </span>
          )}
        </div>
        <ChevronDown
          className={`h-5 w-5 transition-transform duration-200 ${
            isExpanded ? "rotate-180" : ""
          }`}
          style={{ color: COLORS.textMuted }}
        />
      </button>

      {/* Accordion Content */}
      {isExpanded && (
        <div
          className="px-4 pb-4"
          style={{
            borderTop: `1px solid ${COLORS.border}`,
            backgroundColor: COLORS.background,
          }}
        >
          {children}
        </div>
      )}
    </div>
  );
};

// Accordion Group for managing multiple accordions
const AccordionGroup = ({ children, className = "" }: AccordionGroupProps) => {
  return <div className={`space-y-3 ${className}`}>{children}</div>;
};

// Accordion Item for content inside accordion
interface AccordionItemProps {
  children: ReactNode;
  actions?: ReactNode;
  className?: string;
}

const AccordionItem = ({
  children,
  actions,
  className = "",
}: AccordionItemProps) => {
  return (
    <div
      className={`flex items-center justify-between py-2 px-2 rounded-md hover:bg-white transition-colors duration-150 group ${className}`}
    >
      <span className="text-sm" style={{ color: COLORS.textDark }}>
        {children}
      </span>
      {actions && (
        <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
          {actions}
        </div>
      )}
    </div>
  );
};

// Accordion Section Label
interface AccordionLabelProps {
  children: ReactNode;
  className?: string;
}

const AccordionLabel = ({ children, className = "" }: AccordionLabelProps) => {
  return (
    <p
      className={`text-xs font-medium pt-4 pb-2 ${className}`}
      style={{ color: COLORS.textMuted }}
    >
      {children}
    </p>
  );
};

export default Accordion;
export { Accordion, AccordionGroup, AccordionItem, AccordionLabel };

