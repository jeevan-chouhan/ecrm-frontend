import { memo } from "react";
import { useTranslation } from "react-i18next";
import { Tooltip } from "@mui/material";
import { Button } from "../../../components";
import { COLORS } from "../../../constants";
import { getEnrollmentTypeLabel } from "../../../utils";
import { ArrowLeft, Edit, ToggleStatus } from "../../../assets";
import type { ApplicantDetail } from "./types";

interface ApplicantHeaderProps {
  applicant: ApplicantDetail;
  onBack: () => void;
  onEdit: () => void;
  onStatusToggle: () => void;
}

const ApplicantHeader = ({ applicant, onBack, onEdit, onStatusToggle }: ApplicantHeaderProps) => {
  const { t } = useTranslation();

  return (
    <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
      <div className="flex items-center gap-4">
        {/* Back Button */}
        <Button
          variant="accent"
          size="sm"
          rounded
          icon={<ArrowLeft className="h-5 w-5" />}
          onClick={onBack}
        />
        <div className="flex-1">
          <h1
            className="text-2xl md:text-3xl font-bold mb-2"
            style={{ color: COLORS.textDark }}
          >
            {applicant.applicantName}
          </h1>
          <div className="space-y-1">
            <p className="text-sm" style={{ color: COLORS.textMuted }}>
              {t("applicantTracker.applicantId", "ID")} - {applicant.applicantId}
            </p>
            <p className="text-sm" style={{ color: COLORS.textMuted }}>
              {t("applicantTracker.applicantStage", "Applicant Stage")} - {applicant.applicantStage}
            </p>
            <p className="text-sm" style={{ color: COLORS.textMuted }}>
              {t("applicantTracker.enrollmentType", "Enrolment Type")} - {getEnrollmentTypeLabel(applicant.enrollmentType)}
            </p>
          </div>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <Tooltip title={t("common.edit", "Edit")} arrow>
          <button
            onClick={onEdit}
            className="p-2 rounded-md transition-colors hover:bg-slate-100"
            style={{ color: COLORS.accent }}
            aria-label={t("common.edit", "Edit")}
          >
            <Edit className="w-5 h-5" />
          </button>
        </Tooltip>
        <Tooltip title={t("applicantTracker.changeStatus", "Change Status")} arrow>
          <button
            onClick={onStatusToggle}
            className="p-2 rounded-md transition-colors hover:bg-slate-100"
            style={{
              color: applicant.status === "Active" ? COLORS.error : COLORS.success,
            }}
            aria-label={t("applicantTracker.changeStatus", "Change Status")}
          >
            <ToggleStatus className="w-5 h-5" />
          </button>
        </Tooltip>
      </div>
    </div>
  );
};

export default memo(ApplicantHeader);

