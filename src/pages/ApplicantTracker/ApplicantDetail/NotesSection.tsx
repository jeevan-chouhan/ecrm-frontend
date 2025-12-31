import { memo } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "../../../components";
import { COLORS } from "../../../constants";

interface NotesSectionProps {
  notes: string;
  isSaving: boolean;
  hasChanges: boolean;
  onNotesChange: (notes: string) => void;
  onSaveNotes: () => void;
}

const NotesSection = ({ notes, isSaving, hasChanges, onNotesChange, onSaveNotes }: NotesSectionProps) => {
  const { t } = useTranslation();

  return (
    <div className="space-y-3">
      <label
        className="text-sm font-medium block"
        style={{ color: COLORS.textDark }}
      >
        {t("applicantTracker.notes", "Notes")}
      </label>
      <textarea
        value={notes}
        onChange={(e) => onNotesChange(e.target.value)}
        placeholder={t("applicant.enterNotes", "Enter Notes")}
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
      <div className="flex justify-end">
        <Button
          variant="accent"
          size="sm"
          rounded
          onClick={onSaveNotes}
          isLoading={isSaving}
          disabled={isSaving || !hasChanges}
        >
          {t("common.submit", "Submit")}
        </Button>
      </div>
    </div>
  );
};

export default memo(NotesSection);

