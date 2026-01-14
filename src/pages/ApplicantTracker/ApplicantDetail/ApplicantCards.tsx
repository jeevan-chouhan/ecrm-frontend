import type React from "react";
import { memo, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { Card } from "../../../components";
import { COLORS } from "../../../constants";
import { Applicant, University, Document } from "../../../assets";
import type { ApplicantDetail, DocumentItem } from "./types";
import PersonalDetailsDisplay from "./PersonalDetailsDisplay";
import EducationalDetailsDisplay from "./EducationalDetailsDisplay";
import WorkExperienceDisplay from "./WorkExperienceDisplay";
import AchievementsDisplay from "./AchievementsDisplay";
import DocumentsDisplay from "./DocumentsDisplay";

interface ApplicantCardsProps {
  applicant: ApplicantDetail | null;
}

const ApplicantCards = ({ applicant }: ApplicantCardsProps) => {
  const { t } = useTranslation();

  // Memoize document handlers to prevent re-renders
  const handleDocumentView = useCallback((doc: DocumentItem) => {
    // TODO: Implement document view functionality
    if (import.meta.env.DEV) {
      console.log("View document:", doc);
    }
  }, []);

  const handleDocumentDownload = useCallback((doc: DocumentItem) => {
    // TODO: Implement document download functionality
    if (import.meta.env.DEV) {
      console.log("Download document:", doc);
    }
  }, []);

  // Memoize renderCard function
  const renderCard = useCallback((
    id: string,
    title: string,
    icon: React.ComponentType<{ className?: string; style?: React.CSSProperties }>,
    content: React.ReactNode,
    footer?: React.ReactNode
  ) => {
    const IconComponent = icon;
    return (
      <Card
        key={id}
        title={
          <div className="flex items-center gap-3">
            <div
              className="flex items-center justify-center rounded-lg"
              style={{
                width: "40px",
                height: "40px",
                backgroundColor: `${COLORS.textWhite}20`,
              }}
            >
              <IconComponent
                className="w-5 h-5"
                style={{ color: COLORS.textWhite }}
              />
            </div>
            <span style={{ color: COLORS.textWhite }}>
              {title}
            </span>
          </div>
        }
        padding="lg"
        footer={footer}
        className="transition-all duration-200 hover:shadow-md"
        headerBackgroundColor={COLORS.accent}
      >
        {content && (
          <div className="py-2">
            {typeof content === "string" ? (
              <p className="text-sm" style={{ color: COLORS.textMuted }}>
                {content}
              </p>
            ) : (
              content
            )}
          </div>
        )}
      </Card>
    );
  }, []);

  return (
    <div className="space-y-4">
      {/* Personal Details and Educational Details - Side by Side on Desktop */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Personal Details Card */}
        {renderCard(
          "personal",
          t("applicant.personalDetails", "Personal Details"),
          Applicant,
          applicant?.personalDetails ? (
            <PersonalDetailsDisplay data={applicant.personalDetails} />
          ) : (
            <div className="flex items-center justify-center min-h-[120px]">
              <p className="text-sm text-center" style={{ color: COLORS.textMuted }}>
                {t("applicantDetailView.noPersonalDetails", "No Personal Details Added Yet.")}
              </p>
            </div>
          )
        )}

        {/* Educational Details Card */}
        {renderCard(
          "educational",
          t("applicant.educationalDetails", "Educational Background"),
          University,
          applicant?.educationalDetails ? (
            <EducationalDetailsDisplay data={applicant.educationalDetails} />
          ) : (
            <div className="flex items-center justify-center min-h-[120px]">
              <p className="text-sm text-center" style={{ color: COLORS.textMuted }}>
                {t("applicantDetailView.noEducationalDetails", "No Educational Details Added Yet.")}
              </p>
            </div>
          )
        )}
      </div>

      {/* Work Experience and Achievements - Side by Side on Desktop */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Work Experience Card */}
        {renderCard(
          "work",
          t("applicant.workExperience", "Work Experience"),
          Applicant,
          applicant?.workExperience?.experiences && applicant.workExperience.experiences.length > 0 ? (
            <WorkExperienceDisplay experiences={applicant.workExperience.experiences} />
          ) : (
            <div className="flex items-center justify-center min-h-[120px]">
              <p className="text-sm text-center" style={{ color: COLORS.textMuted }}>
                {t("applicantDetailView.noWorkExperience", "No Work Experience Added Yet.")}
              </p>
            </div>
          )
        )}

        {/* Achievements Card */}
        {renderCard(
          "achievements",
          t("applicant.achievements", "Achievements"),
          University,
          applicant?.achievements?.achievements && applicant.achievements.achievements.length > 0 ? (
            <AchievementsDisplay achievements={applicant.achievements.achievements} />
          ) : (
            <div className="flex items-center justify-center min-h-[120px]">
              <p className="text-sm text-center" style={{ color: COLORS.textMuted }}>
                {t("applicantDetailView.noAchievements", "No Achievements Added Yet.")}
              </p>
            </div>
          )
        )}
      </div>

      {/* View Documents Card */}
      {renderCard(
        "documents",
        t("applicantDetailView.viewDocuments", "View Documents"),
        Document,
        applicant?.documents?.documents && applicant.documents.documents.length > 0 ? (
          <DocumentsDisplay
            documents={applicant.documents.documents}
            onView={handleDocumentView}
            onDownload={handleDocumentDownload}
          />
        ) : (
          <div className="flex items-center justify-center min-h-[120px]">
            <p className="text-sm text-center" style={{ color: COLORS.textMuted }}>
              {t("applicantDetailView.noDocuments", "No Documents Added Yet.")}
            </p>
          </div>
        )
      )}
    </div>
  );
};

export default memo(ApplicantCards);

