import { useEffect, useRef } from "react";
import type { ReactNode } from "react";
import { Close } from "../../assets";

type PopupSize = "sm" | "md" | "lg" | "xl" | "full";

interface PopupProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
  size?: PopupSize;
  showCloseButton?: boolean;
  closeOnOverlayClick?: boolean;
  closeOnEscape?: boolean;
  footer?: ReactNode;
  minHeight?: string;
}

const sizeStyles: Record<PopupSize, string> = {
  sm: "max-w-sm",
  md: "max-w-md",
  lg: "max-w-lg",
  xl: "max-w-xl",
  full: "max-w-4xl",
};

const Popup = ({
  isOpen,
  onClose,
  title,
  children,
  size = "md",
  showCloseButton = true,
  closeOnOverlayClick = true,
  closeOnEscape = true,
  footer,
  minHeight,
}: PopupProps) => {
  const popupRef = useRef<HTMLDivElement>(null);

  // Handle escape key
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (closeOnEscape && event.key === "Escape") {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener("keydown", handleEscape);
      document.body.style.overflow = "hidden";
    }

    return () => {
      document.removeEventListener("keydown", handleEscape);
      document.body.style.overflow = "unset";
    };
  }, [isOpen, closeOnEscape, onClose]);

  // Handle overlay click
  const handleOverlayClick = (event: React.MouseEvent) => {
    if (closeOnOverlayClick && event.target === event.currentTarget) {
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      onClick={handleOverlayClick}
    >
      {/* Overlay */}
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />

      {/* Popup Content */}
      <div
        ref={popupRef}
        className={`
          relative w-full ${sizeStyles[size]}
          bg-white rounded-xl shadow-2xl
          transform transition-all duration-300
          animate-popup-in
        `}
        style={{
          animation: "popupIn 0.2s ease-out",
        }}
      >
        {/* Header */}
        {(title || showCloseButton) && (
          <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
            {title && (
              <h2 className="text-lg font-semibold text-slate-800">{title}</h2>
            )}
            {showCloseButton && (
              <button
                onClick={onClose}
                className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors ml-auto"
              >
                <Close className="h-5 w-5" />
              </button>
            )}
          </div>
        )}

        {/* Body */}
        <div 
          className="px-6 py-4 max-h-[calc(100vh-200px)] overflow-y-auto"
          style={{ minHeight: minHeight || "auto" }}
        >
          {children}
        </div>

        {/* Footer */}
        {footer && (
          <div className="px-6 py-4 border-t border-slate-200 bg-slate-50 rounded-b-xl">
            {footer}
          </div>
        )}
      </div>

      {/* Animation Styles */}
      <style>{`
        @keyframes popupIn {
          from {
            opacity: 0;
            transform: scale(0.95) translateY(-10px);
          }
          to {
            opacity: 1;
            transform: scale(1) translateY(0);
          }
        }
      `}</style>
    </div>
  );
};

export default Popup;

