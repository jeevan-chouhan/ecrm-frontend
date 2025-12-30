import { useState, useCallback, memo, useRef } from "react";
import { useFormik, FormikProvider } from "formik";
import * as Yup from "yup";
import { useTranslation } from "react-i18next";
import { Close } from "../../assets";
import { COLORS } from "../../constants";
import FilePreview from "./FilePreview";
import FilePreviewPopup from "./FilePreviewPopup";
import FileDropZone from "./FileDropZone";
import { useFileUpload } from "./useFileUpload";

interface FileUploadProps {
  // External Formik integration (optional - if parent form uses Formik)
  name?: string; // If provided and parent has Formik, will integrate with parent Formik
  formikValue?: File | File[] | null;
  formikError?: string;
  formikTouched?: boolean;

  // Standalone props (works independently)
  label?: string;
  accept?: string;
  maxSizeMB?: number;
  value?: File | File[] | null;
  onChange?: (file: File | File[] | null) => void;
  onRemove?: () => void;
  showPreview?: boolean;
  previewSize?: "sm" | "md" | "lg";
  error?: string;
  disabled?: boolean;
  dismissible?: boolean;
  supportedFormats?: string;
  multiple?: boolean;
  required?: boolean; // For validation
  validationSchema?: Yup.Schema<any>; // Custom validation schema
}

const FileUpload = ({
  name,
  formikValue,
  formikError,
  formikTouched,
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
  multiple = false,
  required = false,
  validationSchema,
}: FileUploadProps) => {
  const { t } = useTranslation();
  const [showSection, setShowSection] = useState(true);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Internal Formik for standalone validation (only if not using external Formik)
  const internalFormik = useFormik({
    initialValues: {
      file: value || null,
    },
    validationSchema: validationSchema || Yup.object().shape({
      file: required
        ? Yup.mixed()
            .required(t("validation.required"))
            .test("fileSize", t("fileUpload.fileSizeExceeded", { fileName: "", maxSize: maxSizeMB }), (file) => {
              if (!file) return false; // Required field must have a file
              const files = Array.isArray(file) ? file : [file];
              return files.every((f) => f && f.size <= maxSizeMB * 1024 * 1024);
            })
        : Yup.mixed().nullable(),
    }),
    onSubmit: () => {
      // Handled by onChange
    },
    enableReinitialize: true,
  });

  // Determine if we should use external Formik or internal
  // Use standalone mode if value/onChange are provided, otherwise use internal Formik
  const isStandaloneMode = !name || (value !== undefined || onChange !== undefined);

  // Use provided value, or internal Formik value, or external Formik value
  const currentValue = value !== undefined 
    ? value 
    : (isStandaloneMode ? internalFormik.values.file : formikValue);
  const currentError = error !== undefined
    ? error
    : (isStandaloneMode ? internalFormik.errors.file : formikError);
  const isTouched = isStandaloneMode ? internalFormik.touched.file : formikTouched ?? false;
  const showError = isTouched && currentError;


  const handleChange = useCallback(
    (file: File | File[] | null) => {
      // Always call external onChange if provided (for parent Formik or standalone)
      if (onChange) {
        onChange(file);
      }
      
      // Also update internal Formik if in standalone mode
      if (isStandaloneMode && value === undefined) {
        internalFormik.setFieldValue("file", file);
        internalFormik.setFieldTouched("file", true);
      }
    },
    [isStandaloneMode, internalFormik, onChange, value]
  );

  const setError = useCallback(
    (errorMessage: string) => {
      if (isStandaloneMode) {
        internalFormik.setFieldError("file", errorMessage);
      }
    },
    [isStandaloneMode, internalFormik]
  );

  const {
    files,
    previewUrls,
    isDragging,
    previewIndex,
    showPreviewPopup,
    setIsDragging,
    setPreviewIndex,
    setShowPreviewPopup,
    handleFileSelect,
    handleRemove,
    handlePreview,
  } = useFileUpload({
    value: currentValue ?? null,
    accept,
    maxSizeMB,
    supportedFormats,
    multiple,
    onChange: handleChange,
    isFormikMode: false, // Using internal state management
    setError,
  });


  const handleRemoveWithCallback = useCallback(
    (index: number) => {
      handleRemove(index);
      onRemove?.();
    },
    [handleRemove, onRemove]
  );

  if (!showSection) return null;

  const shouldShowPreview = showPreview && files.length > 0;

  return (
    <FormikProvider value={internalFormik}>
      <div
        className="relative p-3 rounded-lg"
        style={{
          backgroundColor: COLORS.background,
          border: `1px solid ${showError ? COLORS.error : COLORS.border}`,
          boxShadow: "0 1px 3px rgba(0, 0, 0, 0.1)",
        }}
      >
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-xs font-semibold" style={{ color: COLORS.textDark }}>
            {label}
            {required && <span style={{ color: COLORS.error }}> *</span>}
          </h3>
          {dismissible && (
            <button
              type="button"
              onClick={() => setShowSection(false)}
              className="p-1 hover:bg-slate-200 rounded transition-colors"
              style={{ color: COLORS.textMuted }}
            >
              <Close className="h-4 w-4" />
            </button>
          )}
        </div>

        {shouldShowPreview ? (
          <>
            <FilePreview
              files={files}
              previewUrls={previewUrls}
              previewSize={previewSize}
              multiple={multiple}
              onRemove={handleRemoveWithCallback}
              onPreview={handlePreview}
              onChangeFile={() => {
                if (fileInputRef.current) {
                  fileInputRef.current.click();
                }
              }}
            />
            <input
              ref={fileInputRef}
              type="file"
              accept={accept}
              multiple={multiple}
              onChange={(e) => {
                if (e.target.files && e.target.files.length > 0) {
                  handleFileSelect(e.target.files);
                  e.target.value = "";
                }
              }}
              disabled={disabled}
              className="hidden"
            />
          </>
        ) : (
          <FileDropZone
            accept={accept}
            multiple={multiple}
            disabled={disabled}
            supportedFormats={supportedFormats}
            isDragging={isDragging}
            error={showError ? currentError : undefined}
            onFileSelect={handleFileSelect}
            onDragStateChange={setIsDragging}
          />
        )}

        {showError && (
          <p className="mt-2 text-xs" style={{ color: COLORS.error }}>
            {currentError}
          </p>
        )}
      </div>

      <FilePreviewPopup
        isOpen={showPreviewPopup}
        onClose={() => setShowPreviewPopup(false)}
        files={files}
        previewUrls={previewUrls}
        currentIndex={previewIndex}
        onIndexChange={setPreviewIndex}
        multiple={multiple}
      />
    </FormikProvider>
  );
};

export default memo(FileUpload);
