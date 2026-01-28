import { useState, useEffect, useMemo, useCallback } from "react";
import { useTranslation } from "react-i18next";

interface UseFileUploadOptions {
  value: File | File[] | null;
  accept: string;
  maxSizeMB: number;
  supportedFormats: string;
  multiple: boolean;
  onChange: (file: File | File[] | null) => void;
  isFormikMode: boolean;
  setError?: (error: string) => void;
}

export const useFileUpload = ({
  value,
  accept,
  maxSizeMB,
  supportedFormats,
  multiple,
  onChange,
  isFormikMode,
  setError,
}: UseFileUploadOptions) => {
  const { t } = useTranslation();
  const [isDragging, setIsDragging] = useState(false);
  const [previewUrls, setPreviewUrls] = useState<string[]>([]);
  const [previewIndex, setPreviewIndex] = useState(0);
  const [showPreviewPopup, setShowPreviewPopup] = useState(false);

  // Memoize valid types
  const validTypes = useMemo(
    () => accept.split(",").map((type) => type.trim()),
    [accept]
  );

  // Memoize files array
  const files = useMemo(
    () => (value ? (Array.isArray(value) ? value : [value]) : []),
    [value]
  );

  // Generate preview URLs with proper cleanup
  useEffect(() => {
    const urls: string[] = [];

    if (value && files.length > 0) {
      files.forEach((file) => {
        if (file && file.type && file.type.startsWith("image/")) {
          const url = URL.createObjectURL(file);
          urls.push(url);
        }
      });
    }

    // Cleanup previous URLs before setting new ones
    setPreviewUrls((prevUrls) => {
      prevUrls.forEach((url) => URL.revokeObjectURL(url));
      return urls;
    });

    // Cleanup function to revoke URLs on unmount
    return () => {
      urls.forEach((url) => URL.revokeObjectURL(url));
    };
  }, [value, files]);

  // Validate and process files
  const handleFileSelect = useCallback(
    (fileList: FileList) => {
      const fileArray = Array.from(fileList);
      const validFiles: File[] = [];
      const errors: string[] = [];

      for (const file of fileArray) {
        const fileSizeMB = file.size / (1024 * 1024);

        if (!validTypes.some((type) => file.type.match(type.replace("*", ".*")))) {
          errors.push(
            t("fileUpload.invalidFormat", { fileName: file.name, formats: supportedFormats })
          );
          continue;
        }

        if (fileSizeMB > maxSizeMB) {
          errors.push(
            t("fileUpload.fileSizeExceeded", { fileName: file.name, maxSize: maxSizeMB })
          );
          continue;
        }

        validFiles.push(file);
      }

      // Show errors if any - always use setError if provided, otherwise show alert
      if (errors.length > 0) {
        const errorMessage = errors.join(", ");
        if (setError) {
          setError(errorMessage);
        } else {
          alert(errors.join("\n"));
        }
        // Don't update files if there are errors - return early
        return;
      }

      // Clear any previous errors if files are valid
      if (setError && validFiles.length > 0) {
        setError("");
      }

      // Update files only if we have valid files
      if (validFiles.length > 0) {
        if (multiple) {
          const existingFiles = Array.isArray(value) ? value : value ? [value] : [];
          onChange([...existingFiles, ...validFiles]);
        } else {
          onChange(validFiles[0]);
        }
      }
    },
    [validTypes, maxSizeMB, supportedFormats, multiple, value, onChange, isFormikMode, setError, t]
  );

  const handleRemove = useCallback(
    (index: number) => {
      if (multiple && Array.isArray(value)) {
        const newFiles = value.filter((_, i) => i !== index);
        onChange(newFiles.length > 0 ? newFiles : null);
      } else {
        onChange(null);
      }
    },
    [multiple, value, onChange]
  );

  const handlePreview = useCallback((index: number) => {
    setPreviewIndex(index);
    setShowPreviewPopup(true);
  }, []);

  return {
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
  };
};

