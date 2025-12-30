import { useTranslation } from "react-i18next";
import { Button } from "../../../components";
import { COLORS } from "../../../constants";
import { File, Close } from "../../../assets";

export interface ViewerFile {
  url: string;
  name: string;
  type: string;
}

interface UploadDocViewProps {
  isOpen: boolean;
  file: ViewerFile | null;
  onClose: () => void;
}

const UploadDocView = ({ isOpen, file, onClose }: UploadDocViewProps) => {
  const { t } = useTranslation();

  if (!isOpen || !file) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Viewer Header */}
        <div
          className="flex items-center justify-between px-4 py-3"
          style={{ borderBottom: `1px solid ${COLORS.border}` }}
        >
          <h3 className="font-semibold" style={{ color: COLORS.textDark }}>
            {file.name}
          </h3>
          <Button
            variant="ghost"
            size="sm"
            icon={<Close className="h-5 w-5" style={{ color: COLORS.textMuted }} />}
            onClick={onClose}
          />
        </div>

        {/* Viewer Content */}
        <div className="p-4 overflow-auto" style={{ height: "calc(90vh - 60px)" }}>
          {file.type === "pdf" && (
            <object
              data={file.url}
              type="application/pdf"
              className="w-full h-full"
            >
              <iframe
                src={file.url}
                className="w-full h-full"
                title={file.name}
              />
            </object>
          )}
          {file.type === "image" && (
            <div className="flex items-center justify-center h-full">
              <img
                src={file.url}
                alt={file.name}
                className="max-w-full max-h-full object-contain"
              />
            </div>
          )}
          {file.type === "text" && (
            <iframe
              src={file.url}
              className="w-full h-full bg-white"
              title={file.name}
            />
          )}
          {file.type === "csv" && (
            <iframe
              src={file.url}
              className="w-full h-full bg-white"
              title={file.name}
            />
          )}
          {(file.type === "excel" || file.type === "word") && (
            <div className="flex flex-col items-center justify-center h-full">
              <File className="h-16 w-16 mb-4" style={{ color: COLORS.textMuted }} />
              <p style={{ color: COLORS.textDark }}>
                {t("documentVault.cannotPreview", "This file type cannot be previewed directly.")}
              </p>
            </div>
          )}
          {file.type === "other" && (
            <div className="flex flex-col items-center justify-center h-full">
              <File className="h-16 w-16 mb-4" style={{ color: COLORS.textMuted }} />
              <p style={{ color: COLORS.textDark }}>
                {t("documentVault.cannotPreview", "This file type cannot be previewed directly.")}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default UploadDocView;

