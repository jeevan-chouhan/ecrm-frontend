import { useMemo, memo, useEffect, useState, useRef, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { formatDateValue, getLabelFromConstant } from "../../../utils";
import { applicantService } from "../../../services";
import { useAppDispatch } from "../../../redux/hooks";
import { addToast } from "../../../redux/slices/toast/toastSlice";
import { handleApiError } from "../../../utils";
import type { SelectOption } from "../../../components";
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
  const dispatch = useAppDispatch();
  const isFetchingHighestQualificationsRef = useRef(false);
  const isFetchingScoreTypesRef = useRef(false);
  const [highestQualificationOptions, setHighestQualificationOptions] = useState<SelectOption[]>([]);
  const [scoreTypeOptions, setScoreTypeOptions] = useState<SelectOption[]>([]);

  // Fetch highest qualifications from API
  const fetchHighestQualifications = useCallback(async () => {
    if (isFetchingHighestQualificationsRef.current) {
      return;
    }

    isFetchingHighestQualificationsRef.current = true;

    try {
      const highestQualifications = await applicantService.getHighestQualifications();
      
      // Convert to SelectOption format, filter by isActive and sort by sortOrder
      const options: SelectOption[] = highestQualifications
        .filter((qualification) => qualification.isActive)
        .sort((a, b) => a.sortOrder - b.sortOrder)
        .map((qualification) => ({
          value: qualification.code,
          label: qualification.name,
        }));

      setHighestQualificationOptions(options);
    } catch (error: any) {
      const { message } = handleApiError(error, "Failed to fetch highest qualifications");
      dispatch(addToast({ type: "error", message }));
      setHighestQualificationOptions([]);
    } finally {
      isFetchingHighestQualificationsRef.current = false;
    }
  }, [dispatch]);

  // Fetch score types from API
  const fetchScoreTypes = useCallback(async () => {
    if (isFetchingScoreTypesRef.current) {
      return;
    }

    isFetchingScoreTypesRef.current = true;

    try {
      const scoreTypes = await applicantService.getScoreTypes();
      
      // Convert to SelectOption format, filter by isActive and sort by sortOrder
      const options: SelectOption[] = scoreTypes
        .filter((scoreType) => scoreType.isActive)
        .sort((a, b) => a.sortOrder - b.sortOrder)
        .map((scoreType) => ({
          value: scoreType.code,
          label: scoreType.name,
        }));

      setScoreTypeOptions(options);
    } catch (error: any) {
      const { message } = handleApiError(error, "Failed to fetch score types");
      dispatch(addToast({ type: "error", message }));
      setScoreTypeOptions([]);
    } finally {
      isFetchingScoreTypesRef.current = false;
    }
  }, [dispatch]);

  // Fetch highest qualifications and score types on mount
  useEffect(() => {
    fetchHighestQualifications();
    fetchScoreTypes();
  }, [fetchHighestQualifications, fetchScoreTypes]);

  const formatScore = useMemo(() => {
    if (!data.score) return "-";
    if (data.scoreType) {
      const scoreTypeLabel = getLabelFromConstant(data.scoreType, scoreTypeOptions);
      return `${data.score} (${scoreTypeLabel})`;
    }
    return data.score;
  }, [data.score, data.scoreType, scoreTypeOptions]);

  const details = useMemo(() => [
    {
      label: t("applicant.highestQualification", "Highest Qualification"),
      value: getLabelFromConstant(data.highestQualification, highestQualificationOptions),
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
      value: getLabelFromConstant(data.scoreType, scoreTypeOptions),
    },
    {
      label: t("applicant.score", "Score"),
      value: formatScore,
    },
    {
      label: t("applicant.passingYear", "Passing year"),
      value: formatDateValue(data.passingYear),
    },
  ], [data, formatScore, t, highestQualificationOptions, scoreTypeOptions]);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4">
      {details.map((detail, index) => (
        <DetailField key={index} label={detail.label} value={detail.value} />
      ))}
    </div>
  );
};

export default memo(EducationalDetailsDisplay);

