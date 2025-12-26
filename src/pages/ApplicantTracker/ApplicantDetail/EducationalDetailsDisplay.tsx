import { useMemo, memo } from "react";
import { useTranslation } from "react-i18next";
import { highestQualifications, scoreTypes } from "../../../constants";
import { formatDateValue, getLabelFromConstant } from "../../../utils";
import { DetailField } from "./DisplayComponents";

interface EducationalDetailsData {
  highestQualification?: string;
  institutionName?: string;
  boardUniversity?: string;
  program?: string;
  major?: string;
  scoreType?: string;
  score?: string;
  passingYear?: string | Date | null;
}

interface EducationalDetailsDisplayProps {
  data: EducationalDetailsData;
}

const EducationalDetailsDisplay = ({ data }: EducationalDetailsDisplayProps) => {
  const { t } = useTranslation();

  const formatScore = useMemo(() => {
    if (!data.score) return "-";
    if (data.scoreType) {
      const scoreTypeLabel = getLabelFromConstant(data.scoreType, scoreTypes);
      return `${data.score} (${scoreTypeLabel})`;
    }
    return data.score;
  }, [data.score, data.scoreType]);

  const details = useMemo(() => [
    {
      label: t("applicant.highestQualification", "Highest Qualification"),
      value: getLabelFromConstant(data.highestQualification, highestQualifications),
    },
    {
      label: t("applicant.institutionName", "Institution Name"),
      value: data.institutionName || "-",
    },
    {
      label: t("applicant.boardUniversity", "Board/University"),
      value: data.boardUniversity || "-",
    },
    {
      label: t("applicant.program", "Program"),
      value: data.program || "-",
    },
    {
      label: t("applicant.major", "Major (field of study)"),
      value: data.major || "-",
    },
    {
      label: t("applicant.scoreType", "Score type"),
      value: getLabelFromConstant(data.scoreType, scoreTypes),
    },
    {
      label: t("applicant.score", "Score"),
      value: formatScore,
    },
    {
      label: t("applicant.passingYear", "Passing year"),
      value: formatDateValue(data.passingYear),
    },
  ], [data, formatScore, t]);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4">
      {details.map((detail, index) => (
        <DetailField key={index} label={detail.label} value={detail.value} />
      ))}
    </div>
  );
};

export default memo(EducationalDetailsDisplay);

