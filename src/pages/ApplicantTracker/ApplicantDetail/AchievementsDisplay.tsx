import { memo, useState, useEffect, useRef, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { COLORS } from "../../../constants";
import { getLabelFromConstant } from "../../../utils";
import { DetailField, EmptyState } from "./DisplayComponents";
import ScrollableContainer from "./ScrollableContainer";
import { File } from "../../../assets";
import type { SelectOption } from "../../../components";
import { applicantService } from "../../../services";
import { useAppDispatch } from "../../../redux/hooks";
import { addToast } from "../../../redux/slices/toast/toastSlice";
import { handleApiError } from "../../../utils";

export interface AchievementItem {
  id: string;
  category: string;
  description: string;
  documents?: string | null; // URL or file name
}

interface AchievementsDisplayProps {
  achievements: AchievementItem[];
}

const AchievementsDisplay = ({ achievements }: AchievementsDisplayProps) => {
  const { t } = useTranslation();
  const dispatch = useAppDispatch();
  const isFetchingCategoriesRef = useRef(false);
  const [categoryOptions, setCategoryOptions] = useState<SelectOption[]>([]);

  // Fetch categories from API
  const fetchCategories = useCallback(async () => {
    if (isFetchingCategoriesRef.current) {
      return;
    }

    isFetchingCategoriesRef.current = true;

    try {
      const categories = await applicantService.getCategories();
      
      // Convert to SelectOption format, filter by isActive and sort by sortOrder
      const options: SelectOption[] = categories
        .filter((category) => category.isActive)
        .sort((a, b) => a.sortOrder - b.sortOrder)
        .map((category) => ({
          value: category.code,
          label: category.name,
        }));

      setCategoryOptions(options);
    } catch (error: any) {
      const { message } = handleApiError(error, "Failed to fetch categories");
      dispatch(addToast({ type: "error", message }));
      setCategoryOptions([]);
    } finally {
      isFetchingCategoriesRef.current = false;
    }
  }, [dispatch]);

  // Fetch categories on mount
  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  if (!achievements || achievements.length === 0) {
    return (
      <EmptyState message={t("applicantDetailView.noAchievements", "No achievements added yet.")} />
    );
  }

  return (
    <ScrollableContainer
      maxHeight="400px"
      className="space-y-4"
      scrollbarClassName="achievements-scroll"
    >
        {achievements.map((achievement, index) => (
          <div
            key={achievement.id || index}
            className="pb-4 border-b last:border-b-0 last:pb-0"
            style={{ borderColor: COLORS.border }}
          >
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4">
              <DetailField
                label={t("applicant.selectCategory", "Category")}
                value={getLabelFromConstant(achievement.category, categoryOptions)}
              />
              <div className="md:col-span-2 lg:col-span-2">
                <DetailField
                  label={t("applicant.description", "Description")}
                  value={<p className="text-sm font-medium whitespace-pre-wrap">{achievement.description || "-"}</p>}
                />
              </div>
              {achievement.documents && (
                <div className="md:col-span-2 lg:col-span-3">
                  <DetailField
                    label={t("applicant.uploadDocuments", "Documents")}
                    value={
                      <div className="flex items-center gap-2">
                        <File className="w-4 h-4" style={{ color: COLORS.accent }} />
                        <span className="text-sm font-medium" style={{ color: COLORS.accent }}>
                          {achievement.documents}
                        </span>
                      </div>
                    }
                  />
                </div>
              )}
            </div>
          </div>
        ))}
    </ScrollableContainer>
  );
};

export default memo(AchievementsDisplay);

