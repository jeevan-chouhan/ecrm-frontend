import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Button, Card } from "../../../../components";
import { COLORS } from "../../../../constants";
import type { UniversityDetail } from "../types";

interface CampusTabProps {
  university: UniversityDetail;
}

const CampusTab = ({ university }: CampusTabProps) => {
  const { t } = useTranslation();
  const [showAllCourses, setShowAllCourses] = useState(false);

  const displayedCourses = showAllCourses 
    ? university.courses 
    : university.courses.slice(0, 3);

  return (
    <div className="space-y-8">
      {/* Campus Information */}
      <div className="space-y-4">
        <h3 className="font-semibold text-lg" style={{ color: COLORS.textDark }}>
          {t("universityDetail.campusInformation", "Campus Information")}
        </h3>
        <p className="text-sm leading-relaxed" style={{ color: COLORS.textMuted }}>
          {university.campusInfo}
        </p>
        
        {university.campusHighlights && university.campusHighlights.length > 0 && (
          <div className="mt-4">
            <h4 className="font-medium text-md mb-3" style={{ color: COLORS.textDark }}>
              {t("universityDetail.campusHighlights", "Campus Highlights")}
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              {university.campusHighlights.map((highlight, index) => (
                <div
                  key={index}
                  className="flex items-center gap-2 p-3 rounded-lg"
                  style={{ backgroundColor: COLORS.background }}
                >
                  <span style={{ color: COLORS.accent }}>🏛️</span>
                  <span className="text-sm" style={{ color: COLORS.textMuted }}>
                    {highlight}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Divider */}
      <div className="border-t" style={{ borderColor: COLORS.border }} />

      {/* Courses Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-lg" style={{ color: COLORS.textDark }}>
            {t("universityDetail.availableCourses", "Available Courses")}
          </h3>
          <span className="text-sm" style={{ color: COLORS.textMuted }}>
            {university.courses.length} {t("universityDetail.coursesAvailable", "courses available")}
          </span>
        </div>
        
        <div className="space-y-3">
          {displayedCourses.map((course) => (
            <Card key={course.id} padding="md" className="hover:shadow-md transition-shadow">
              <div className="flex flex-col md:flex-row md:justify-between md:items-start gap-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span
                      className="text-xs px-2 py-0.5 rounded"
                      style={{ backgroundColor: COLORS.accentLight, color: COLORS.accent }}
                    >
                      {course.level}
                    </span>
                  </div>
                  <h4
                    className="font-medium text-sm"
                    style={{ color: COLORS.textDark }}
                  >
                    {course.name}
                  </h4>
                  <p className="text-xs mt-1" style={{ color: COLORS.textMuted }}>
                    Duration: {course.duration}
                  </p>
                </div>
                <div className="flex flex-col items-end gap-1">
                  <p
                    className="font-semibold text-sm px-3 py-1 rounded"
                    style={{ backgroundColor: COLORS.background, color: COLORS.textDark }}
                  >
                    {course.tuitionFees}
                  </p>
                </div>
              </div>
              <div className="mt-3 pt-3 border-t" style={{ borderColor: COLORS.border }}>
                <p className="text-xs" style={{ color: COLORS.textMuted }}>
                  <span className="font-medium">Exams Accepted:</span> {course.examsAccepted.join(", ")}
                </p>
              </div>
            </Card>
          ))}
        </div>
        
        {university.courses.length > 3 && (
          <div className="flex justify-center pt-2">
            <Button
              variant="ghost"
              onClick={() => setShowAllCourses(!showAllCourses)}
              className="text-sm"
            >
              {showAllCourses 
                ? t("universityDetail.showLess", "Show Less") 
                : t("universityDetail.showAllCourses", `Show All ${university.courses.length} Courses`)}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default CampusTab;
