import { memo, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { Tooltip } from "@mui/material";
import { Popup } from "../../../components";
import { COLORS } from "../../../constants";
import { formatDateTime, getApplicationStatusLabel } from "../../../utils";
import type { ApplicationStatusHistory } from "./types";
import ScrollableContainer from "./ScrollableContainer";

interface StatusHistoryData {
  history: ApplicationStatusHistory[];
  universityName: string;
  applicantName: string;
}

interface ApplicationStatusHistoryPopupProps {
  isOpen: boolean;
  applicationId: string | null;
  statusHistoryData: StatusHistoryData | null;
  isLoading?: boolean;
  onClose: () => void;
}

const ApplicationStatusHistoryPopup = ({
  isOpen,
  applicationId,
  statusHistoryData,
  isLoading = false,
  onClose,
}: ApplicationStatusHistoryPopupProps) => {
  const { t } = useTranslation();

  // Extract data from statusHistoryData object
  const statusHistory = statusHistoryData?.history || [];
  const applicantName = statusHistoryData?.applicantName || "";
  const universityName = statusHistoryData?.universityName || "";

  // API already returns data with latest entry first, so no sorting needed
  // Just use the data directly for optimal performance
  const sortedStatusHistory = useMemo(() => {
    return statusHistory;
  }, [statusHistory]);

  // Use formatDateTime from utils which handles UTC to local timezone conversion

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
            {/* Applicant Name */}
            {applicantName && (
              <div className="mb-4">
                <p className="text-sm font-medium" style={{ color: COLORS.textMuted }}>
                  {t("applicantDetailView.applicantName", "Applicant Name")}:
                </p>
                <p className="text-base font-semibold" style={{ color: COLORS.textDark }}>
                  {applicantName}
                </p>
              </div>
            )}

            {/* University Name */}
            {universityName && (
              <div className="mb-4">
                <p className="text-sm font-medium" style={{ color: COLORS.textMuted }}>
                  {t("applicantDetailView.university", "University")}:
                </p>
                <p className="text-base font-semibold" style={{ color: COLORS.textDark }}>
                  {universityName}
                </p>
              </div>
            )}

            {/* Status History List */}
            {isLoading && sortedStatusHistory.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-sm" style={{ color: COLORS.textMuted }}>
                  {t("common.loading", "Loading...")}
                </p>
              </div>
            ) : sortedStatusHistory && sortedStatusHistory.length > 0 ? (
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
                          {getApplicationStatusLabel(historyItem.statusName)}
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

                      {/* Time and Created By */}
                      <div>
                        <p
                          className="text-xs"
                          style={{ color: COLORS.textMuted }}
                        >
                          <Tooltip title={formatDateTime(historyItem.time)} arrow placement="top">
                            <span>{formatDateTime(historyItem.time)}</span>
                          </Tooltip>
                          {historyItem.createdBy && (
                            <span className="ml-2">
                              • {t("applicantDetailView.createdBy", "Created by")} {historyItem.createdBy}
                            </span>
                          )}
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

