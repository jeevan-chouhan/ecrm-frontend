import { memo, useRef } from "react";
import { useTranslation } from "react-i18next";
import { COLORS } from "../../constants";
import { CloudUpload } from "../../assets";

interface FileDropZoneProps {
  accept: string;
  multiple: boolean;
  disabled: boolean;
  supportedFormats: string;
  isDragging: boolean;
  error?: string;
  maxSizeMB?: number;
  onFileSelect: (files: FileList) => void;
  onDragStateChange: (isDragging: boolean) => void;
}

const FileDropZone = memo(({
  accept,
  multiple,
  disabled,
  supportedFormats,
  isDragging,
  error,
  maxSizeMB = 2,
  onFileSelect,
  onDragStateChange,
}: FileDropZoneProps) => {
  const { t } = useTranslation();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    onDragStateChange(false);
    if (disabled) return;

    const files = e.dataTransfer.files;
    if (files.length > 0) {
      onFileSelect(files);
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (!disabled) {
      onDragStateChange(true);
    }
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    onDragStateChange(false);
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      onFileSelect(files);
      // Reset input to allow selecting the same file again
      e.target.value = "";
    }
  };

  const handleBrowseClick = () => {
    if (!disabled) {
      fileInputRef.current?.click();
    }
  };

  return (
    <div
      onDrop={handleDrop}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onClick={handleBrowseClick}
      className={`
        border-2 border-dashed rounded-lg p-4 text-center cursor-pointer
        transition-colors duration-200
        ${disabled ? "opacity-50 cursor-not-allowed" : ""}
        ${isDragging ? "border-indigo-500 bg-indigo-50" : "border-slate-300"}
        ${error ? "border-red-500" : ""}
      `}
    >
      <input
        ref={fileInputRef}
        type="file"
        accept={accept}
        multiple={multiple}
        onChange={handleFileInputChange}
        disabled={disabled}
        className="hidden"
      />

      <div className="flex flex-col items-center gap-1.5">
        {/* Cloud Icon */}
        <CloudUpload
          className="w-8 h-8"
          style={{ color: COLORS.textMuted }}
        />

        <div>
          <p className="text-xs font-medium mb-0.5" style={{ color: COLORS.textDark }}>
            {multiple ? t("fileUpload.dropFilesHere") : t("fileUpload.dropFileHere")}
          </p>
          <p className="text-xs mb-0.5" style={{ color: COLORS.textMuted }}>
            <button
              type="button"
              className="underline font-medium hover:no-underline"
              style={{ color: COLORS.accent }}
              onClick={(e) => {
                e.stopPropagation();
                handleBrowseClick();
              }}
            >
              {t("fileUpload.browseFiles")}
            </button>
          </p>
          <p className="text-xs" style={{ color: COLORS.textMuted }}>
            {supportedFormats}
          </p>
          <p className="text-xs mt-1" style={{ color: COLORS.textMuted }}>
            {t("fileUpload.maxFileSize", { maxSize: maxSizeMB })}
          </p>
        </div>
      </div>
    </div>
  );
});

FileDropZone.displayName = "FileDropZone";

export default FileDropZone;

