import { memo } from "react";
import { useTranslation } from "react-i18next";
import { Popup, Button, Select, Checkbox } from "../../../components";
import { COLORS, applicationStatusOptions } from "../../../constants";
import type { UniversityApplication } from "./types";

interface ApplicationStatusPopupProps {
  isOpen: boolean;
  application: UniversityApplication | null;
  newStatus: string;
  notes: string;
  notifyStudent: boolean;
  isChanging: boolean;
  onClose: () => void;
  onConfirm: () => void;
  onStatusChange: (status: string) => void;
  onNotesChange: (notes: string) => void;
  onNotifyStudentChange: (notify: boolean) => void;
}

const ApplicationStatusPopup = ({
  isOpen,
  application,
  newStatus,
  notes,
  notifyStudent,
  isChanging,
  onClose,
  onConfirm,
  onStatusChange,
  onNotesChange,
  onNotifyStudentChange,
}: ApplicationStatusPopupProps) => {
  const { t } = useTranslation();

  return (
    <Popup
      isOpen={isOpen}
      onClose={onClose}
      title={t("applicantDetailView.updateApplicationStatus", "Update Application Status")}
      size="md"
      closeOnOverlayClick={!isChanging}
      closeOnEscape={!isChanging}
      footer={
        <div className="flex items-center justify-end gap-3">
          <Button
            variant="cancel"
            size="sm"
            onClick={onClose}
            disabled={isChanging}
            rounded
          >
            {t("common.cancel", "Cancel")}
          </Button>
          <Button
            variant="accent"
            size="sm"
            onClick={onConfirm}
            isLoading={isChanging}
            rounded
          >
            {t("applicantDetailView.updateStatus", "Update Status")}
          </Button>
        </div>
      }
    >
      <div className="py-2">
        {application && (
          <div className="space-y-4">
            {/* Current Status Dropdown */}
            <div>
              <Select
                label={t("applicantDetailView.currentStatus", "Current Status")}
                options={applicationStatusOptions}
                value={newStatus}
                onChange={onStatusChange}
                placeholder={t("applicantDetailView.selectStatus", "Select Status")}
                fullWidth
                searchable
                searchPlaceholder={t("applicantDetailView.searchStatus", "Search Status...")}
              />
            </div>

            {/* Notes Textarea */}
            <div>
              <label
                className="block text-sm font-medium mb-1.5"
                style={{ color: COLORS.textDark }}
              >
                {t("applicantTracker.notes", "Notes")}
              </label>
              <textarea
                value={notes}
                onChange={(e) => onNotesChange(e.target.value)}
                placeholder={t("applicantDetailView.addNotesPlaceholder", "Add any additional notes or comments")}
                className="w-full px-4 py-3 rounded-lg resize-none"
                rows={4}
                style={{
                  border: `1px solid ${COLORS.border}`,
                  color: COLORS.textDark,
                  backgroundColor: COLORS.surface,
                  fontFamily: "'Inter', sans-serif",
                  fontSize: "14px",
                }}
              />
            </div>

            {/* Notify Student Checkbox */}
            <div className="flex items-center gap-2">
              <Checkbox
                checked={notifyStudent}
                onChange={onNotifyStudentChange}
              />
              <label
                className="text-sm cursor-pointer"
                style={{ color: COLORS.textDark }}
                onClick={() => onNotifyStudentChange(!notifyStudent)}
              >
                {t("applicantDetailView.sendEmailNotification", "Send email notification to student")}
              </label>
            </div>
          </div>
        )}
      </div>
    </Popup>
  );
};

export default memo(ApplicationStatusPopup);

