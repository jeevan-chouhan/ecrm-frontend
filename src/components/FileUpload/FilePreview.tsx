import { memo } from "react";
import { useTranslation } from "react-i18next";
import { Close } from "../../assets";
import { COLORS } from "../../constants";

interface FilePreviewProps {
  files: File[];
  previewUrls: string[];
  previewSize: "sm" | "md" | "lg";
  multiple: boolean;
  onRemove: (index: number) => void;
  onPreview: (index: number) => void;
  onChangeFile?: () => void;
  existingPreviewUrl?: string | null;
}

const previewSizes = {
  sm: "w-12 h-12",
  md: "w-16 h-16",
  lg: "w-20 h-20",
};

const FilePreview = memo(({
  files,
  previewUrls,
  previewSize,
  multiple,
  onRemove,
  onPreview,
  onChangeFile,
  existingPreviewUrl,
}: FilePreviewProps) => {
  const { t } = useTranslation();

  if (multiple) {
    return (
      <div className="space-y-2">
        <div className="flex flex-wrap gap-2">
          {files.map((file, index) => (
            <div key={index} className="relative group">
              {previewUrls[index] ? (
                <img
                  src={previewUrls[index]}
                  alt={`Preview ${index + 1}`}
                  className={`${previewSizes[previewSize]} object-cover rounded border cursor-pointer hover:opacity-80 transition-opacity`}
                  style={{ borderColor: COLORS.border }}
                  onClick={() => onPreview(index)}
                />
              ) : (
                <div
                  className={`${previewSizes[previewSize]} flex items-center justify-center rounded border bg-slate-100 cursor-pointer hover:opacity-80 transition-opacity`}
                  style={{ borderColor: COLORS.border }}
                  onClick={() => onPreview(index)}
                >
                  <span className="text-xs" style={{ color: COLORS.textMuted }}>
                    {file.name.substring(0, 3).toUpperCase()}
                  </span>
                </div>
              )}
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onRemove(index);
                }}
                className="absolute -top-1 -right-1 p-0.5 bg-white rounded-full shadow-md hover:bg-slate-100 transition-colors opacity-0 group-hover:opacity-100"
                style={{ color: COLORS.error }}
              >
                <Close className="h-3 w-3" />
              </button>
            </div>
          ))}
        </div>
        {files.length > 0 && (
          <button
            type="button"
            onClick={() => onPreview(0)}
            className="text-xs underline hover:no-underline"
            style={{ color: COLORS.accent }}
          >
            {t("fileUpload.previewAll", { count: files.length })}
          </button>
        )}
      </div>
    );
  }

  // Single file preview
  const file = files[0];
  const previewUrl = previewUrls[0];
  const isExistingImage = !file && existingPreviewUrl;
  const displayUrl = previewUrl || existingPreviewUrl;

  return (
    <div className="flex items-center gap-3">
      <div className="relative group">
        {displayUrl ? (
          <img
            src={displayUrl}
            alt="Preview"
            className={`${previewSizes[previewSize]} object-cover rounded border cursor-pointer hover:opacity-80 transition-opacity`}
            style={{ borderColor: COLORS.border }}
            onClick={(e) => {
              e.stopPropagation();
              onPreview(0);
            }}
          />
        ) : (
          <div
            className={`${previewSizes[previewSize]} flex items-center justify-center rounded border bg-slate-100 cursor-pointer hover:opacity-80 transition-opacity`}
            style={{ borderColor: COLORS.border }}
            onClick={(e) => {
              e.stopPropagation();
              onPreview(0);
            }}
          >
            <span className="text-xs" style={{ color: COLORS.textMuted }}>
              {file?.name.substring(0, 3).toUpperCase()}
            </span>
          </div>
        )}
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onRemove(0);
          }}
          className="absolute -top-1 -right-1 p-0.5 bg-white rounded-full shadow-md hover:bg-slate-100 transition-colors opacity-0 group-hover:opacity-100"
          style={{ color: COLORS.error }}
        >
          <Close className="h-3 w-3" />
        </button>
      </div>
      <div className="flex-1 min-w-0">
        {file ? (
          <>
            <p className="text-xs font-medium truncate" style={{ color: COLORS.textDark }}>
              {file.name}
            </p>
            <p className="text-xs mt-0.5" style={{ color: COLORS.textMuted }}>
              {(file.size / (1024 * 1024)).toFixed(2)} MB
            </p>
          </>
        ) : isExistingImage ? (
          <p className="text-xs font-medium" style={{ color: COLORS.textDark }}>
            {t("fileUpload.currentImage", "Current image")}
          </p>
        ) : null}
        <div className="flex flex-wrap gap-2 mt-1">
          {displayUrl && (
            <button
              type="button"
              onClick={() => onPreview(0)}
              className="text-xs underline hover:no-underline"
              style={{ color: COLORS.accent }}
            >
              {t("fileUpload.preview")}
            </button>
          )}
          {onChangeFile && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onChangeFile();
              }}
              className="text-xs underline hover:no-underline"
              style={{ color: COLORS.accent }}
            >
              {t("fileUpload.changeFile")}
            </button>
          )}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onRemove(0);
            }}
            className="text-xs underline hover:no-underline"
            style={{ color: COLORS.error }}
          >
            {t("fileUpload.deleteFile")}
          </button>
        </div>
      </div>
    </div>
  );
});

FilePreview.displayName = "FilePreview";

export default FilePreview;

