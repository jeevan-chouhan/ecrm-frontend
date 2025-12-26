import { useMemo, memo } from "react";
import { useTranslation } from "react-i18next";
import { COLORS } from "../../../constants";
import { formatDateValue } from "../../../utils";
import { DetailField, EmptyState } from "./DisplayComponents";
import ScrollableContainer from "./ScrollableContainer";

export interface WorkExperienceItem {
  id: string;
  companyName: string;
  jobTitle: string;
  startDate: string | Date | null;
  endDate: string | Date | null;
  currentlyWorking: boolean;
}

interface WorkExperienceDisplayProps {
  experiences: WorkExperienceItem[];
}

const WorkExperienceDisplay = ({ experiences }: WorkExperienceDisplayProps) => {
  const { t } = useTranslation();

  const formatDateRange = useMemo(() => (experience: WorkExperienceItem): string => {
    const startDate = formatDateValue(experience.startDate);
    if (experience.currentlyWorking) {
      return `${startDate} - ${t("applicant.currentlyWorking", "Currently Working")}`;
    }
    const endDate = formatDateValue(experience.endDate);
    return `${startDate} - ${endDate}`;
  }, [t]);

  if (!experiences || experiences.length === 0) {
    return (
      <EmptyState message={t("applicantDetailView.noWorkExperiences", "No work experiences added yet.")} />
    );
  }

  return (
    <ScrollableContainer
      maxHeight="400px"
      className="space-y-4"
      scrollbarClassName="work-experience-scroll"
    >
      {experiences.map((experience, index) => (
        <div
          key={experience.id || index}
          className="pb-4 border-b last:border-b-0 last:pb-0"
          style={{ borderColor: COLORS.border }}
        >
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4">
            <DetailField
              label={t("applicant.companyName", "Company Name")}
              value={experience.companyName || "-"}
            />
            <DetailField
              label={t("applicant.jobTitle", "Job Title")}
              value={experience.jobTitle || "-"}
            />
            <DetailField
              label={t("applicant.startDate", "Start Date")}
              value={formatDateValue(experience.startDate)}
            />
            <DetailField
              label={t("applicant.endDate", "End Date")}
              value={
                experience.currentlyWorking
                  ? t("applicant.currentlyWorking", "Currently Working")
                  : formatDateValue(experience.endDate)
              }
            />
            <DetailField
              label={t("applicant.currentlyWorking", "Currently Working")}
              value={experience.currentlyWorking ? t("common.yes", "Yes") : t("common.no", "No")}
            />
            <DetailField
              label={t("applicantDetailView.duration", "Duration")}
              value={formatDateRange(experience)}
            />
          </div>
        </div>
      ))}
    </ScrollableContainer>
  );
};

export default memo(WorkExperienceDisplay);

