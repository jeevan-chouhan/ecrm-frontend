import { useState, useEffect, useRef, useCallback } from "react";
import { useTranslation } from "react-i18next";
import * as pdfjsLib from "pdfjs-dist";
import { Button } from "../../../components";
import { COLORS } from "../../../constants";
import { File, Close, Download } from "../../../assets";
import { handleApiError } from "../../../utils";
import { applicantService } from "../../../services";
import { useAppDispatch } from "../../../redux/hooks";
import { showLoader, hideLoader } from "../../../redux/slices/loader/loaderSlice";
import { addToast } from "../../../redux/slices/toast/toastSlice";

// Set up PDF.js worker
pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;

export interface ViewerFile {
  url: string;
  name: string;
  type: string;
  documentId?: number | string;
  applicantId?: number | string;
}

interface UploadDocViewProps {
  isOpen: boolean;
  file: ViewerFile | null;
  onClose: () => void;
}

const UploadDocView = ({ isOpen, file, onClose }: UploadDocViewProps) => {
  const { t } = useTranslation();
  const dispatch = useAppDispatch();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [numPages, setNumPages] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [pdfDocument, setPdfDocument] = useState<pdfjsLib.PDFDocumentProxy | null>(null);
  const [pdfScale, setPdfScale] = useState(1.0);
  // Image viewer states
  const [imageScale, setImageScale] = useState(1.0);
  const [imageRotation, setImageRotation] = useState(0);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Handle download using the same API as actions column
  const handleDownload = useCallback(async () => {
    if (!file?.documentId || !file?.applicantId) return;

    dispatch(showLoader());
    try {
      const response = await applicantService.getDocumentDownloadUrl(file.applicantId, file.documentId);
      
      if (response.status === "success" && response.data) {
        const downloadUrl = response.data; // data is a string URL
        
        // Create a link and trigger download directly to avoid CORS issues
        const link = document.createElement("a");
        link.href = downloadUrl;
        link.download = file.name;
        link.target = "_blank"; // Open in new tab as fallback
        link.rel = "noopener noreferrer"; // Security best practice
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        // Show success message
        dispatch(
          addToast({
            type: "success",
            message: t("documentVault.downloadStarted", "Download started"),
          })
        );
      } else {
        throw new Error(response.message || "Failed to get download URL");
      }
    } catch (error) {
      const errorMessage = handleApiError(error);
      dispatch(
        addToast({
          type: "error",
          message: typeof errorMessage === "string" ? errorMessage : "Failed to download document",
        })
      );
    } finally {
      dispatch(hideLoader());
    }
  }, [file, dispatch, t]);

  // Image viewer handlers
  const handleImageZoomIn = useCallback(() => {
    setImageScale((prev) => Math.min(prev + 0.25, 3.0));
  }, []);

  const handleImageZoomOut = useCallback(() => {
    setImageScale((prev) => Math.max(prev - 0.25, 0.5));
  }, []);

  const handleImageReset = useCallback(() => {
    setImageScale(1.0);
    setImageRotation(0);
  }, []);

  const handleImageRotate = useCallback(() => {
    setImageRotation((prev) => (prev + 90) % 360);
  }, []);

  useEffect(() => {
    // Reset states when file changes
    setError(null);
    setNumPages(0);
    setCurrentPage(1);
    setPdfDocument(null);
    setPdfScale(1.0);
    setImageScale(1.0);
    setImageRotation(0);

    if (file?.type === "pdf" && file.url) {
      // For S3 pre-signed URLs with inline disposition, use iframe to avoid CORS
      // Check if URL is a pre-signed S3 URL
      if (file.url.includes('s3.amazonaws.com') && file.url.includes('response-content-disposition=inline')) {
        // Use iframe for S3 pre-signed URLs to avoid CORS issues
        setLoading(false);
        return;
      }
      
      // For other PDFs, try PDF.js loading
      setLoading(true);
      
      const loadPdf = async () => {
        try {
          // Try loading directly with the URL (works for some servers)
          let loadingTask = pdfjsLib.getDocument({ 
            url: file.url,
            httpHeaders: {},
            withCredentials: false,
            verbosity: 0 // Suppress warnings
          });
          
          const pdf = await loadingTask.promise;
          setPdfDocument(pdf);
          setNumPages(pdf.numPages);
          setLoading(false);
        } catch (err) {
          console.error("PDF loading error:", err);
          // If PDF.js fails, fall back to iframe
          setLoading(false);
        }
      };
      
      loadPdf();
    }
  }, [file]);

  // Render PDF page - memoized to prevent unnecessary re-renders
  const renderPage = useCallback(async () => {
    if (!pdfDocument || !canvasRef.current || currentPage < 1) return;

    try {
      const page = await pdfDocument.getPage(currentPage);
      const canvas = canvasRef.current;
      if (!canvas) return;

      const context = canvas.getContext("2d");
      if (!context) return;

      // Calculate scale to fit container with zoom support
      const container = containerRef.current;
      const containerWidth = container?.clientWidth || 800;
      const containerHeight = container?.clientHeight || 600;
      
      const viewport = page.getViewport({ scale: 1.0 });
      const baseScale = Math.min(
        containerWidth / viewport.width,
        containerHeight / viewport.height
      );
      
      // Apply user zoom
      const scale = baseScale * pdfScale;
      const scaledViewport = page.getViewport({ scale });
      
      canvas.height = scaledViewport.height;
      canvas.width = scaledViewport.width;

      await page.render({
        canvasContext: context,
        viewport: scaledViewport,
      } as any).promise;
    } catch (err) {
      setError("Failed to render PDF page.");
    }
  }, [pdfDocument, currentPage, pdfScale]);

  useEffect(() => {
    renderPage();
  }, [renderPage]);


  const handlePreviousPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  const handleNextPage = () => {
    if (currentPage < numPages) {
      setCurrentPage(currentPage + 1);
    }
  };

  const handleZoomIn = () => {
    setPdfScale((prev) => Math.min(prev + 0.25, 3.0));
  };

  const handleZoomOut = () => {
    setPdfScale((prev) => Math.max(prev - 0.25, 0.5));
  };

  const handleResetZoom = () => {
    setPdfScale(1.0);
  };

  if (!isOpen || !file) return null;

  // For images and other file types, use custom modal
  const popupMaxWidth = file.type === "image" ? "max-w-[50vw]" : "max-w-3xl";
  const popupMaxHeight = "max-h-[60vh]";

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
      onClick={onClose}
    >
      <div
        className={`bg-white rounded-lg shadow-xl w-full ${popupMaxWidth} ${popupMaxHeight} overflow-hidden flex flex-col`}
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
        <div className="flex-1 overflow-hidden flex flex-col" style={{ minHeight: "calc(50vh - 80px)" }}>
          {file.type === "image" && (
            <>
              <div className="flex-1 w-full overflow-auto flex items-center justify-center p-4" style={{ backgroundColor: "#525252", minHeight: 0 }}>
                <img
                  src={file.url}
                  alt={file.name}
                  style={{
                    transform: `scale(${imageScale}) rotate(${imageRotation}deg)`,
                    transition: "transform 0.2s ease",
                    maxWidth: "100%",
                    maxHeight: "100%",
                    objectFit: "contain",
                  }}
                />
              </div>
              <div className="flex-shrink-0 flex flex-col sm:flex-row items-center justify-between gap-2 px-4 py-2" style={{ borderTop: `1px solid ${COLORS.border}`, backgroundColor: COLORS.surface }}>
                <div className="flex items-center gap-1 flex-wrap justify-center">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleImageZoomOut}
                    disabled={imageScale <= 0.5}
                    rounded
                    title={t("documentVault.zoomOut", "Zoom Out")}
                    style={{ minWidth: "36px", padding: "6px 12px" }}
                  >
                    −
                  </Button>
                  <span style={{ color: COLORS.textMuted, minWidth: "50px", textAlign: "center", fontSize: "0.875rem", whiteSpace: "nowrap" }}>
                    {Math.round(imageScale * 100)}%
                  </span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleImageZoomIn}
                    disabled={imageScale >= 3.0}
                    rounded
                    title={t("documentVault.zoomIn", "Zoom In")}
                    style={{ minWidth: "36px", padding: "6px 12px" }}
                  >
                    +
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleImageRotate}
                    rounded
                    title={t("documentVault.rotate", "Rotate")}
                    style={{ fontSize: "0.75rem", padding: "6px 12px" }}
                  >
                    ↻
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleImageReset}
                    rounded
                    title={t("documentVault.reset", "Reset")}
                    style={{ fontSize: "0.75rem", padding: "6px 12px" }}
                  >
                    {t("documentVault.reset", "Reset")}
                  </Button>
                </div>
                <div className="flex items-center gap-2">
                  {file.documentId && file.applicantId && (
                    <Button
                      variant="ghost"
                      size="sm"
                      icon={<Download className="h-4 w-4" />}
                      onClick={handleDownload}
                      rounded
                      title={t("common.download", "Download")}
                      style={{ fontSize: "0.75rem", padding: "6px 12px" }}
                    >
                      {t("common.download", "Download")}
                    </Button>
                  )}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => window.open(file.url, "_blank")}
                    rounded
                    style={{ fontSize: "0.75rem", padding: "6px 12px" }}
                  >
                    {t("common.openInNewTab", "Open")}
                  </Button>
                </div>
              </div>
            </>
          )}
          {file.type === "pdf" && (
            <div className="w-full h-full flex flex-col" style={{ minHeight: "calc(50vh - 120px)" }}>
              {/* For S3 pre-signed URLs with inline disposition, use iframe to avoid CORS */}
              {file.url.includes('s3.amazonaws.com') && file.url.includes('response-content-disposition=inline') ? (
                <div className="flex-1 w-full h-full overflow-hidden">
                  <iframe
                    src={file.url}
                    className="w-full h-full border-0"
                    title={file.name}
                    style={{ minHeight: "calc(50vh - 120px)" }}
                  />
                </div>
              ) : loading ? (
                <div className="flex items-center justify-center h-full">
                  <p style={{ color: COLORS.textMuted }}>{t("common.loading", "Loading...")}</p>
                </div>
              ) : error ? (
                <div className="flex flex-col items-center justify-center h-full space-y-4">
                  <File className="h-16 w-16" style={{ color: COLORS.textMuted }} />
                  <p style={{ color: COLORS.textDark }}>{error}</p>
                  <Button
                    variant="accent"
                    size="sm"
                    onClick={() => window.open(file.url, "_blank")}
                    rounded
                  >
                    {t("common.openInNewTab", "Open in New Tab")}
                  </Button>
                </div>
              ) : pdfDocument ? (
                <>
                  <div 
                    ref={containerRef}
                    className="flex-1 w-full overflow-auto flex items-center justify-center p-4" 
                    style={{ minHeight: "calc(50vh - 160px)", backgroundColor: "#525252" }}
                  >
                    <canvas ref={canvasRef} className="shadow-lg" />
                  </div>
                  {numPages > 0 && (
                    <div className="mt-2 flex flex-col sm:flex-row items-center justify-between gap-2 px-4 py-2" style={{ borderTop: `1px solid ${COLORS.border}` }}>
                      <div className="flex items-center gap-2 flex-wrap justify-center">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={handlePreviousPage}
                          disabled={currentPage <= 1}
                          rounded
                        >
                          {t("common.previous", "Previous")}
                        </Button>
                        <span style={{ color: COLORS.textMuted, fontSize: "0.875rem", whiteSpace: "nowrap" }}>
                          {t("documentVault.page", "Page")} {currentPage} {t("common.of", "of")} {numPages}
                        </span>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={handleNextPage}
                          disabled={currentPage >= numPages}
                          rounded
                        >
                          {t("common.next", "Next")}
                        </Button>
                      </div>
                      <div className="flex items-center gap-1 flex-wrap justify-center">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={handleZoomOut}
                          disabled={pdfScale <= 0.5}
                          rounded
                          title={t("documentVault.zoomOut", "Zoom Out")}
                          style={{ minWidth: "36px", padding: "6px 12px" }}
                        >
                          −
                        </Button>
                        <span style={{ color: COLORS.textMuted, minWidth: "50px", textAlign: "center", fontSize: "0.875rem", whiteSpace: "nowrap" }}>
                          {Math.round(pdfScale * 100)}%
                        </span>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={handleZoomIn}
                          disabled={pdfScale >= 3.0}
                          rounded
                          title={t("documentVault.zoomIn", "Zoom In")}
                          style={{ minWidth: "36px", padding: "6px 12px" }}
                        >
                          +
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={handleResetZoom}
                          rounded
                          title={t("documentVault.resetZoom", "Reset Zoom")}
                          style={{ fontSize: "0.75rem", padding: "6px 12px" }}
                        >
                          {t("documentVault.reset", "Reset")}
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => window.open(file.url, "_blank")}
                          rounded
                          style={{ fontSize: "0.75rem", padding: "6px 12px" }}
                        >
                          {t("common.openInNewTab", "Open")}
                        </Button>
                      </div>
                    </div>
                  )}
                </>
              ) : (
                <div className="flex flex-col items-center justify-center h-full space-y-4">
                  <File className="h-16 w-16" style={{ color: COLORS.textMuted }} />
                  <p style={{ color: COLORS.textDark }}>{t("common.loading", "Loading PDF...")}</p>
                  <Button
                    variant="accent"
                    size="sm"
                    onClick={() => window.open(file.url, "_blank")}
                    rounded
                  >
                    {t("common.openInNewTab", "Open in New Tab")}
                  </Button>
                </div>
              )}
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
