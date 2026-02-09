import { useState, useEffect, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { Button, Card, Select } from "../../../../components";
import { COLORS } from "../../../../constants";
import { applicantService } from "../../../../services";
import type { CampusItem, CourseItem } from "../../../../services";
import { useAppSelector } from "../../../../redux/hooks";
import type { UniversityDetail, Course } from "../types";

interface CampusTabProps {
  university: UniversityDetail;
  universityId?: string | null;
}

function mapApiCourseToCourse(item: CourseItem): Course {
  return {
    id: item.id,
    name: item.name,
    level: item.courseType || "—",
    duration: "—",
    tuitionFees: "—",
    examsAccepted: [],
  };
}

const CampusTab = ({ university, universityId }: CampusTabProps) => {
  const { t } = useTranslation();
  const { user } = useAppSelector((state) => state.auth);
  const agencyId = user?.agencyId ?? null;

  const [showAllCourses, setShowAllCourses] = useState(false);
  const [campuses, setCampuses] = useState<CampusItem[]>([]);
  const [selectedCampusId, setSelectedCampusId] = useState<number | string | null>(null);
  const [apiCourses, setApiCourses] = useState<CourseItem[]>([]);
  const [isLoadingCampuses, setIsLoadingCampuses] = useState(false);
  const [isLoadingCourses, setIsLoadingCourses] = useState(false);

  // Fetch campuses for this university (country & university campus based)
  useEffect(() => {
    if (!agencyId || !universityId) return;
    let cancelled = false;
    setIsLoadingCampuses(true);
    applicantService
      .getCampuses(agencyId, universityId)
      .then((list) => {
        if (!cancelled) {
          setCampuses(list || []);
          if (list?.length > 0 && selectedCampusId == null) {
            setSelectedCampusId(list[0].id);
          }
        }
      })
      .finally(() => {
        if (!cancelled) setIsLoadingCampuses(false);
      });
    return () => {
      cancelled = true;
    };
  }, [agencyId, universityId]);

  // Fetch courses for selected campus
  useEffect(() => {
    if (!agencyId || selectedCampusId == null) {
      setApiCourses([]);
      return;
    }
    let cancelled = false;
    setIsLoadingCourses(true);
    applicantService
      .getCourses(agencyId, selectedCampusId, null)
      .then((list) => {
        if (!cancelled) setApiCourses(list || []);
      })
      .finally(() => {
        if (!cancelled) setIsLoadingCourses(false);
      });
    return () => {
      cancelled = true;
    };
  }, [agencyId, selectedCampusId]);

  // Combined courses: API-based (mapped) or fallback to university.courses
  const coursesToShow = useMemo(() => {
    const fromApi = apiCourses.map((c) => mapApiCourseToCourse(c));
    if (fromApi.length > 0) return fromApi;
    return university.courses;
  }, [apiCourses, university.courses]);

  const displayedCourses = showAllCourses
    ? coursesToShow
    : coursesToShow.slice(0, 3);

  const campusOptions = useMemo(
    () =>
      campuses.map((c) => ({
        value: c.id.toString(),
        label: c.name,
      })),
    [campuses]
  );

  const selectedCampus = useMemo(
    () => campuses.find((c) => c.id === selectedCampusId || c.id.toString() === selectedCampusId) ?? null,
    [campuses, selectedCampusId]
  );
  const selectedCampusName = selectedCampus?.name ?? null;

  return (
    <div className="space-y-8">
      {/* Campus-based courses UI: Select campus first, then campus info, then list courses */}
      <div className="space-y-4">
        <h3 className="font-semibold text-lg" style={{ color: COLORS.textDark }}>
          {t("universityDetail.coursesByCampus", "Courses by Campus")}
        </h3>
        {agencyId && universityId && (
          <div className="space-y-2">
            <label className="text-sm font-medium" style={{ color: COLORS.textDark }}>
              {t("universityDetail.selectCampus", "Select Campus")}
            </label>
            {isLoadingCampuses ? (
              <p className="text-sm" style={{ color: COLORS.textMuted }}>
                Loading campuses...
              </p>
            ) : campusOptions.length > 0 ? (
              <Select
                options={campusOptions}
                value={selectedCampusId != null ? selectedCampusId.toString() : ""}
                onChange={(val) => setSelectedCampusId(val ? parseInt(val, 10) : null)}
                placeholder={t("universityDetail.selectCampus", "Select Campus")}
                fullWidth
              />
            ) : (
              <p className="text-sm" style={{ color: COLORS.textMuted }}>
                {t("universityDetail.noCampuses", "No campuses")}
              </p>
            )}
          </div>
        )}

        {/* Campus info: Campus Name, Address, Total Students | Visit College Website */}
        {selectedCampus && (
          <div className="rounded-lg border p-4 space-y-4" style={{ borderColor: COLORS.border }}>
            <div className="grid grid-cols-2 gap-x-6 gap-y-4">
              <div>
                <p className="text-xs font-medium mb-1" style={{ color: COLORS.textMuted }}>
                  {t("universityDetail.campusName", "Campus Name")}
                </p>
                <p className="text-sm" style={{ color: COLORS.textDark }}>
                  {selectedCampus.name}
                </p>
              </div>
              <div>
                <p className="text-xs font-medium mb-1" style={{ color: COLORS.textMuted }}>
                  {t("universityDetail.address", "Address")}
                </p>
                <p className="text-sm" style={{ color: COLORS.textDark }}>
                  {selectedCampus.address?.trim() || "—"}
                </p>
              </div>
              <div>
                <p className="text-xs font-medium mb-1" style={{ color: COLORS.textMuted }}>
                  {t("universityDetail.totalStudents", "Total Students")}
                </p>
                <p className="text-sm" style={{ color: COLORS.textDark }}>
                  {selectedCampus.totalStudents != null && selectedCampus.totalStudents !== ""
                    ? String(selectedCampus.totalStudents)
                    : "—"}
                </p>
              </div>
              <div>
                <p className="text-xs font-medium mb-1" style={{ color: COLORS.textMuted }}>
                  {t("universityDetail.visitCollegeWebsite", "Visit College Website")}
                </p>
                {selectedCampus.website?.trim() ? (
                  <a
                    href={selectedCampus.website.startsWith("http") ? selectedCampus.website : `https://${selectedCampus.website}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm underline hover:opacity-80"
                    style={{ color: COLORS.primary }}
                  >
                    {selectedCampus.website}
                  </a>
                ) : (
                  <p className="text-sm" style={{ color: COLORS.textDark }}>
                    —
                  </p>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="border-t" style={{ borderColor: COLORS.border }} />

      {/* Available Courses (for selected campus - no price) */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h3 className="font-semibold text-lg" style={{ color: COLORS.textDark }}>
              {t("universityDetail.availableCourses", "Available Courses")}
            </h3>
            {selectedCampusName && (
              <p className="text-sm mt-0.5" style={{ color: COLORS.textMuted }}>
                {t("universityDetail.forCampus", "For campus")}: {selectedCampusName}
              </p>
            )}
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm" style={{ color: COLORS.textMuted }}>
              {coursesToShow.length} {t("universityDetail.coursesAvailable", "courses available")}
            </span>
          </div>
        </div>

        {isLoadingCourses && coursesToShow.length === 0 ? (
          <p className="text-sm" style={{ color: COLORS.textMuted }}>
            Loading courses...
          </p>
        ) : (
          <>
            <div className="space-y-3">
              {displayedCourses.map((course) => (
                <Card key={course.id} padding="md" className="hover:shadow-md transition-shadow">
                  <div className="flex flex-col gap-2">
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
                    <p className="text-xs" style={{ color: COLORS.textMuted }}>
                      Duration: {course.duration}
                    </p>
                    {course.department && (
                      <p className="text-xs" style={{ color: COLORS.textMuted }}>
                        Department: {course.department}
                      </p>
                    )}
                    {course.examsAccepted && course.examsAccepted.length > 0 && (
                      <div className="mt-2 pt-2 border-t" style={{ borderColor: COLORS.border }}>
                        <p className="text-xs" style={{ color: COLORS.textMuted }}>
                          <span className="font-medium">Exams Accepted:</span> {course.examsAccepted.join(", ")}
                        </p>
                      </div>
                    )}
                  </div>
                </Card>
              ))}
            </div>

            {coursesToShow.length > 3 && (
              <div className="flex justify-center pt-2">
                <Button
                  variant="ghost"
                  onClick={() => setShowAllCourses(!showAllCourses)}
                  className="text-sm"
                >
                  {showAllCourses
                    ? t("universityDetail.showLess", "Show Less")
                    : t("universityDetail.showAllCourses", `Show All ${coursesToShow.length} Courses`)}
                </Button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default CampusTab;
