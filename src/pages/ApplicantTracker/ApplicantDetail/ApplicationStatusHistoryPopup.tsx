import { memo, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { Popup } from "../../../components";
import { COLORS } from "../../../constants";
import { formatDate } from "../../../utils";
import type { ApplicationStatusHistory } from "./types";
import ScrollableContainer from "./ScrollableContainer";

interface ApplicationStatusHistoryPopupProps {
  isOpen: boolean;
  applicationId: string | null;
  universityName: string;
  statusHistory: ApplicationStatusHistory[];
  onClose: () => void;
}

const ApplicationStatusHistoryPopup = ({
  isOpen,
  applicationId,
  universityName,
  statusHistory,
  onClose,
}: ApplicationStatusHistoryPopupProps) => {
  const { t } = useTranslation();

  // Sort status history by time (newest first) - reverse the array
  const sortedStatusHistory = useMemo(() => {
    if (!statusHistory || statusHistory.length === 0) return [];
    
    // Create a copy and sort by time (newest first)
    return [...statusHistory].sort((a, b) => {
      const dateA = new Date(a.time).getTime();
      const dateB = new Date(b.time).getTime();
      return dateB - dateA; // Descending order (newest first)
    });
  }, [statusHistory]);

  // Format time to show date and time
  const formatDateTime = (dateString: string): string => {
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) {
        return dateString; // Return original if invalid
      }
      const formattedDate = formatDate(date);
      const hours = String(date.getHours()).padStart(2, "0");
      const minutes = String(date.getMinutes()).padStart(2, "0");
      return `${formattedDate} ${hours}:${minutes}`;
    } catch {
      return dateString;
    }
  };

  return (
    <Popup
      isOpen={isOpen}
      onClose={onClose}
      title={t("applicantDetailView.applicationStatusHistory", "Application Status History")}
      size="lg"
      closeOnOverlayClick={true}
      closeOnEscape={true}
    >
      <div className="py-2">
        {applicationId && (
          <div className="space-y-4">
            {/* University Name */}
            <div className="mb-4">
              <p className="text-sm font-medium" style={{ color: COLORS.textMuted }}>
                {t("applicantDetailView.university", "University")}:
              </p>
              <p className="text-base font-semibold" style={{ color: COLORS.textDark }}>
                {universityName}
              </p>
            </div>

            {/* Status History List */}
            {sortedStatusHistory && sortedStatusHistory.length > 0 ? (
              <ScrollableContainer
                maxHeight="500px"
                className="space-y-4 pr-2"
                scrollbarClassName="status-history-scroll"
              >
                {sortedStatusHistory.map((historyItem, index) => (
                  <div
                    key={historyItem.id || index}
                    className="relative pl-6 pb-4 border-l-2 last:border-l-0 last:pb-0"
                    style={{ borderColor: COLORS.border }}
                  >
                    {/* Timeline Dot */}
                    <div
                      className="absolute left-0 top-1 w-3 h-3 rounded-full -translate-x-[7px]"
                      style={{ backgroundColor: COLORS.accent }}
                    />

                    {/* Content */}
                    <div className="space-y-2">
                      {/* Status Name */}
                      <div>
                        <p
                          className="text-sm font-semibold"
                          style={{ color: COLORS.textDark }}
                        >
                          {historyItem.statusName}
                        </p>
                      </div>

                      {/* Notes */}
                      {historyItem.notes && (
                        <div>
                          <p
                            className="text-xs font-medium mb-1"
                            style={{ color: COLORS.textMuted }}
                          >
                            {t("applicantTracker.notes", "Notes")}:
                          </p>
                          <p
                            className="text-sm"
                            style={{ color: COLORS.textDark }}
                          >
                            {historyItem.notes}
                          </p>
                        </div>
                      )}

                      {/* Time */}
                      <div>
                        <p
                          className="text-xs"
                          style={{ color: COLORS.textMuted }}
                        >
                          {formatDateTime(historyItem.time)}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </ScrollableContainer>
            ) : (
              <div className="text-center py-8">
                <p className="text-sm" style={{ color: COLORS.textMuted }}>
                  {t("applicantDetailView.noStatusHistory", "No status history available.")}
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </Popup>
  );
};

export default memo(ApplicationStatusHistoryPopup);

