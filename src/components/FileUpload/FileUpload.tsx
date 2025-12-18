import { useState, useRef, useCallback, useEffect } from "react";
import { Close } from "../../assets";
import { COLORS } from "../../constants";

interface FileUploadProps {
  label?: string;
  accept?: string;
  maxSizeMB?: number;
  value?: File | null;
  onChange?: (file: File | null) => void;
  onRemove?: () => void;
  showPreview?: boolean;
  previewSize?: "sm" | "md" | "lg";
  error?: string;
  disabled?: boolean;
  dismissible?: boolean;
  supportedFormats?: string;
}

const FileUpload = ({
  label = "Upload file",
  accept = "image/png,image/jpeg,image/jpg",
  maxSizeMB = 10,
  value,
  onChange,
  onRemove,
  showPreview = true,
  previewSize = "md",
  error,
  disabled = false,
  dismissible = true,
  supportedFormats = "PNG, JPG",
}: FileUploadProps) => {
  const [isDragging, setIsDragging] = useState(false);
  const [showSection, setShowSection] = useState(true);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const previewSizes = {
    sm: "w-16 h-16",
    md: "w-24 h-24",
    lg: "w-32 h-32",
  };

  const handleFileSelect = useCallback(
    (file: File) => {
      const validTypes = accept.split(",").map((type) => type.trim());
      const fileSizeMB = file.size / (1024 * 1024);

      if (!validTypes.some((type) => file.type.match(type.replace("*", ".*")))) {
        alert(`Please select a valid file format: ${supportedFormats}`);
        return;
      }

      if (fileSizeMB > maxSizeMB) {
        alert(`File size should be less than ${maxSizeMB}MB`);
        return;
      }

      onChange?.(file);
    },
    [accept, maxSizeMB, supportedFormats, onChange]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      setIsDragging(false);
      if (disabled) return;

      const file = e.dataTransfer.files[0];
      if (file) {
        handleFileSelect(file);
      }
    },
    [disabled, handleFileSelect]
  );

  const handleDragOver = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      if (!disabled) {
        setIsDragging(true);
      }
    },
    [disabled]
  );

  const handleDragLeave = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const handleBrowseClick = () => {
    if (!disabled) {
      fileInputRef.current?.click();
    }
  };

  const handleRemove = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange?.(null);
    onRemove?.();
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  useEffect(() => {
    if (value && value.type.startsWith("image/")) {
      const url = URL.createObjectURL(value);
      setPreviewUrl(url);

      // Cleanup function to revoke the URL when component unmounts or value changes
      return () => {
        URL.revokeObjectURL(url);
      };
    } else {
      setPreviewUrl(null);
    }
  }, [value]);

  if (!showSection) return null;

  return (
    <div
      className="relative p-4 rounded-lg"
      style={{
        backgroundColor: "#F9FAFB",
        border: `1px solid ${error ? COLORS.error : COLORS.border}`,
        boxShadow: "0 1px 3px rgba(0, 0, 0, 0.1)",
      }}
    >
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold" style={{ color: COLORS.textDark }}>
          {label}
        </h3>
        {dismissible && (
          <button
            type="button"
            onClick={() => {
              if (previewUrl) {
                URL.revokeObjectURL(previewUrl);
                setPreviewUrl(null);
              }
              setShowSection(false);
            }}
            className="p-1 hover:bg-slate-200 rounded transition-COLORS"
            style={{ color: COLORS.textMuted }}
          >
            <Close className="h-5 w-5" />
          </button>
        )}
      </div>

      {showPreview && previewUrl && value ? (
        <div className="flex items-center gap-4">
          <div className="relative">
            <img
              src={previewUrl}
              alt="Preview"
              className={`${previewSizes[previewSize]} object-cover rounded-lg border`}
              style={{ borderColor: COLORS.border }}
            />
            <button
              type="button"
              onClick={handleRemove}
              className="absolute -top-2 -right-2 p-1 bg-white rounded-full shadow-md hover:bg-slate-100 transition-COLORS"
              style={{ color: COLORS.error }}
            >
              <Close className="h-4 w-4" />
            </button>
          </div>
          <div className="flex-1">
            <p className="text-sm font-medium" style={{ color: COLORS.textDark }}>
              {value.name}
            </p>
            <p className="text-xs mt-1" style={{ color: COLORS.textMuted }}>
              {(value.size / (1024 * 1024)).toFixed(2)} MB
            </p>
            <button
              type="button"
              onClick={handleBrowseClick}
              className="mt-2 text-sm underline hover:no-underline"
              style={{ color: COLORS.primary }}
            >
              Change file
            </button>
          </div>
        </div>
      ) : (
        <div
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onClick={handleBrowseClick}
          className={`
            border-2 border-dashed rounded-lg p-8 text-center cursor-pointer
            transition-COLORS duration-200
            ${disabled ? "opacity-50 cursor-not-allowed" : ""}
            ${isDragging ? "border-indigo-500 bg-indigo-50" : "border-slate-300"}
            ${error ? "border-red-500" : ""}
          `}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept={accept}
            onChange={handleFileInputChange}
            disabled={disabled}
            className="hidden"
          />

          <div className="flex flex-col items-center gap-2">
            {/* Cloud Icon */}
            <svg
              className="w-12 h-12"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              style={{ color: COLORS.textMuted }}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
              />
            </svg>

            <div>
              <p className="text-sm font-medium mb-1" style={{ color: COLORS.textDark }}>
                Drop files here
              </p>
              <p className="text-sm mb-1" style={{ color: COLORS.textMuted }}>
                <button
                  type="button"
                  className="underline font-medium hover:no-underline"
                  style={{ color: COLORS.primary }}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleBrowseClick();
                  }}
                >
                  Browse files
                </button>
              </p>
              <p className="text-xs" style={{ color: COLORS.textMuted }}>
                Supported format: {supportedFormats}
              </p>
            </div>
          </div>
        </div>
      )}

      {error && (
        <p className="mt-2 text-sm" style={{ color: COLORS.error }}>
          {error}
        </p>
      )}
    </div>
  );
};

export default FileUpload;

