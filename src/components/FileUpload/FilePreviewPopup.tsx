import { memo } from "react";
import { useTranslation } from "react-i18next";
import { COLORS } from "../../constants";
import Popup from "../Popup/Popup";

interface FilePreviewPopupProps {
  isOpen: boolean;
  onClose: () => void;
  files: File[];
  previewUrls: string[];
  currentIndex: number;
  onIndexChange: (index: number) => void;
  multiple: boolean;
}

const FilePreviewPopup = memo(({
  isOpen,
  onClose,
  files,
  previewUrls,
  currentIndex,
  onIndexChange,
  multiple,
}: FilePreviewPopupProps) => {
  const { t } = useTranslation();

  if (!isOpen || !files[currentIndex]) return null;

  const currentFile = files[currentIndex];
  const currentPreviewUrl = previewUrls[currentIndex];

  return (
    <Popup
      isOpen={isOpen}
      onClose={onClose}
      title={currentFile.name}
      size="xl"
      showCloseButton={true}
      closeOnOverlayClick={true}
      closeOnEscape={true}
    >
      <div className="flex flex-col items-center gap-4">
        <div
          className="relative w-full flex items-center justify-center bg-slate-100 rounded-lg p-4"
          style={{ minHeight: "400px" }}
        >
          {currentPreviewUrl ? (
            <img
              src={currentPreviewUrl}
              alt={currentFile.name}
              className="max-w-full max-h-[70vh] object-contain rounded"
            />
          ) : (
            <div className="text-center" style={{ color: COLORS.textMuted }}>
              <p>{t("fileUpload.previewNotAvailable")}</p>
            </div>
          )}
        </div>

        {multiple && files.length > 1 && (
          <div className="flex items-center justify-between w-full gap-4">
            <button
              type="button"
              onClick={() => onIndexChange(currentIndex > 0 ? currentIndex - 1 : files.length - 1)}
              disabled={files.length <= 1}
              className="px-4 py-2 rounded-lg border transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              style={{
                borderColor: COLORS.border,
                color: COLORS.textDark,
              }}
            >
              {t("common.previous")}
            </button>

            <span className="text-sm" style={{ color: COLORS.textMuted }}>
              {currentIndex + 1} / {files.length}
            </span>

            <button
              type="button"
              onClick={() => onIndexChange(currentIndex < files.length - 1 ? currentIndex + 1 : 0)}
              disabled={files.length <= 1}
              className="px-4 py-2 rounded-lg border transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              style={{
                borderColor: COLORS.border,
                color: COLORS.textDark,
              }}
            >
              {t("common.next")}
            </button>
          </div>
        )}

        <div className="w-full text-sm" style={{ color: COLORS.textMuted }}>
          <p>
            <strong>{t("fileUpload.size")}:</strong> {(currentFile.size / (1024 * 1024)).toFixed(2)} MB
          </p>
          <p>
            <strong>{t("fileUpload.type")}:</strong> {currentFile.type}
          </p>
        </div>
      </div>
    </Popup>
  );
});

FilePreviewPopup.displayName = "FilePreviewPopup";

export default FilePreviewPopup;

