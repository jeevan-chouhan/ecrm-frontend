import { useState, useEffect, useRef, useCallback } from "react";
import { useTranslation } from "react-i18next";
import * as pdfjsLib from "pdfjs-dist";
import { Button } from "../../../components";
import { COLORS } from "../../../constants";
import { File, Close } from "../../../assets";
import { getAccessToken } from "../../../utils";

// Set up PDF.js worker
pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;

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
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [numPages, setNumPages] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [pdfDocument, setPdfDocument] = useState<pdfjsLib.PDFDocumentProxy | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Reset states when file changes
    setError(null);
    setNumPages(0);
    setCurrentPage(1);
    setPdfDocument(null);

    if (file?.type === "pdf" && file.url) {
      setLoading(true);
      
      const token = getAccessToken();
      
      // Fetch PDF data
      const fetchPdfData = async () => {
        try {
          // Use fetch with auth headers for all URLs
          const headers: HeadersInit = {};
          if (token) {
            headers.Authorization = `Bearer ${token}`;
          }
          
          const response = await fetch(file.url, {
            method: "GET",
            headers,
            credentials: "include",
          });
          
          if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
          }
          
          const pdfData = await response.arrayBuffer();
          
          // Load PDF using PDF.js
          const loadingTask = pdfjsLib.getDocument({ data: pdfData });
          const pdf = await loadingTask.promise;
          
                setPdfDocument(pdf);
                setNumPages(pdf.numPages);
                setLoading(false);
              } catch (err) {
                setError("Failed to load PDF. Please use 'Open in New Tab' to view.");
                setLoading(false);
              }
      };
      
      fetchPdfData();
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

      // Calculate scale to fit container
      const container = containerRef.current;
      const containerWidth = container?.clientWidth || 800;
      const containerHeight = container?.clientHeight || 600;
      
      const viewport = page.getViewport({ scale: 1.0 });
      const scale = Math.min(
        containerWidth / viewport.width,
        containerHeight / viewport.height,
        2.0 // Max scale for quality
      );
      
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
  }, [pdfDocument, currentPage]);

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

  if (!isOpen || !file) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-lg shadow-xl w-full max-w-6xl max-h-[95vh] overflow-hidden flex flex-col"
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
        <div className="flex-1 overflow-hidden p-4" style={{ minHeight: "calc(95vh - 80px)" }}>
          {file.type === "pdf" && (
            <div className="w-full h-full flex flex-col" style={{ minHeight: "calc(95vh - 120px)" }}>
              {loading ? (
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
              ) : (
                <>
                  <div 
                    ref={containerRef}
                    className="flex-1 w-full overflow-auto flex items-center justify-center p-4" 
                    style={{ minHeight: "calc(95vh - 160px)", backgroundColor: "#525252" }}
                  >
                    <canvas ref={canvasRef} className="shadow-lg" />
                  </div>
                  {numPages > 0 && (
                    <div className="mt-2 flex items-center justify-between gap-4 px-4 py-2" style={{ borderTop: `1px solid ${COLORS.border}` }}>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={handlePreviousPage}
                          disabled={currentPage <= 1}
                          rounded
                        >
                          {t("common.previous", "Previous")}
                        </Button>
                        <span style={{ color: COLORS.textMuted }}>
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
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => window.open(file.url, "_blank")}
                        rounded
                      >
                        {t("common.openInNewTab", "Open in New Tab")}
                      </Button>
                    </div>
                  )}
                </>
              )}
            </div>
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
