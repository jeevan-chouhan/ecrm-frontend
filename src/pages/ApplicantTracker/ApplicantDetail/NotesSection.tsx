import { memo } from "react";
import { useTranslation } from "react-i18next";
import { COLORS, typography } from "../../../constants";

interface NotesSectionProps {
  notes: string;
}

const NotesSection = ({ notes }: NotesSectionProps) => {
  const { t } = useTranslation();

  return (
    <div className="space-y-3">
      <label
        className="text-sm font-medium block"
        style={{ color: COLORS.textDark }}
      >
        {t("applicantTracker.notes", "Notes")}
      </label>
      <div
        className="w-full px-4 py-3 rounded-lg min-h-[100px] whitespace-pre-wrap"
        style={{
          border: `1px solid ${COLORS.border}`,
          color: COLORS.textDark,
          backgroundColor: COLORS.surface,
          fontSize: typography.fontSize.small,
        }}
      >
        {notes || (
          <span style={{ color: COLORS.textMuted }}>
            {t("applicant.noNotes", "No notes available")}
          </span>
        )}
      </div>
    </div>
  );
};

export default memo(NotesSection);

