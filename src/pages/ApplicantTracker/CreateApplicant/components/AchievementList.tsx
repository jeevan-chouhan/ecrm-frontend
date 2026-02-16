import { memo, useMemo, useState, useEffect, useRef, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "../../../../components";
import { COLORS } from "../../../../constants";
import { Edit, Trash } from "../../../../assets";
import AchievementForm from "../AchievementForm";
import type { AchievementItem } from "../types";
import type { SelectOption } from "../../../../components";
import { applicantService } from "../../../../services";
import { useAppDispatch } from "../../../../redux/hooks";
import { addToast } from "../../../../redux/slices/toast/toastSlice";
import { handleApiError } from "../../../../utils";

interface AchievementListProps {
  achievements: AchievementItem[];
  editingIndex: number | null;
  getFieldError: (index: number, fieldName: keyof AchievementItem) => string | undefined;
  updateAchievementField: (
    index: number,
    field: keyof AchievementItem,
    value: string | File | null
  ) => Promise<void>;
  onEdit: (index: number) => void;
  onDelete: (index: number) => void;
  onSave: (index: number) => Promise<void>;
  onCancelEdit: () => void;
  findIndexById: (id: string) => number;
  categoryOptions?: SelectOption[]; // Optional: if provided, use it instead of fetching
}

/**
 * Component to display list of saved achievements
 */
const AchievementList = ({
  achievements,
  editingIndex,
  getFieldError,
  updateAchievementField,
  onEdit,
  onDelete,
  onSave,
  onCancelEdit,
  findIndexById,
  categoryOptions: propCategoryOptions,
}: AchievementListProps) => {
  const { t } = useTranslation();
  const dispatch = useAppDispatch();
  const isFetchingCategoriesRef = useRef(false);
  const [categoryOptionsState, setCategoryOptionsState] = useState<SelectOption[]>([]);

  // Use provided categoryOptions or fetch if not provided
  const categoryOptions = propCategoryOptions || categoryOptionsState;

  // Fetch categories from API only if not provided as prop
  const fetchCategories = useCallback(async () => {
    if (propCategoryOptions || isFetchingCategoriesRef.current) {
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

      setCategoryOptionsState(options);
    } catch (error: any) {
      const { message } = handleApiError(error, "Failed to fetch categories");
      dispatch(addToast({ type: "error", message }));
      setCategoryOptionsState([]);
    } finally {
      isFetchingCategoriesRef.current = false;
    }
  }, [dispatch, propCategoryOptions]);

  // Fetch categories on mount only if not provided as prop
  useEffect(() => {
    if (!propCategoryOptions) {
      fetchCategories();
    }
  }, [fetchCategories, propCategoryOptions]);

  // Helper function to get category label from value
  const categoryMap = useMemo(() => {
    return new Map(categoryOptions.map(cat => [cat.value, cat.label]));
  }, [categoryOptions]);
  
  const getCategoryLabel = (value: string) => categoryMap.get(value) || value;

  if (achievements.length === 0) {
    return null;
  }

  return (
    <div className="mt-6">
      <h2 className="text-lg font-bold mb-4" style={{ color: COLORS.textDark }}>
        {t("applicant.addedAchievements")}
      </h2>

      <div className="space-y-4">
        {achievements.map((achievement) => {
          const index = findIndexById(achievement.id);
          const isEditing = editingIndex === index;

          return (
            <div
              key={achievement.id}
              className="p-4 rounded-lg border"
              style={{ borderColor: COLORS.border, backgroundColor: COLORS.surface }}
            >
              {isEditing ? (
                <>
                  <AchievementForm
                    achievement={achievement}
                    index={index}
                    onFieldChange={updateAchievementField}
                    getFieldError={getFieldError}
                    showCancel={false}
                    showAddMore={false}
                    dismissibleFileUpload={false}
                    categoryOptions={categoryOptions}
                  />
                  <div className="flex gap-2 mt-4 justify-end">
                    <Button
                      type="button"
                      variant="accent"
                      onClick={() => onSave(index)}
                      rounded
                    >
                      {t("common.save")}
                    </Button>
                    <Button
                      type="button"
                      variant="cancel"
                      onClick={onCancelEdit}
                      rounded
                    >
                      {t("common.cancel")}
                    </Button>
                  </div>
                </>
              ) : (
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <p className="text-sm font-medium" style={{ color: COLORS.textDark }}>
                      {getCategoryLabel(achievement.category)} - {achievement.description.substring(0, 50)}
                      {achievement.description.length > 50 ? "..." : ""}
                    </p>
                    {achievement.documents && (
                      <p className="text-xs mt-1" style={{ color: COLORS.textMuted }}>
                        {t("applicant.documentAttached")}: {achievement.documents.name}
                      </p>
                    )}
                  </div>
                  <div className="flex items-end justify-end gap-2">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      icon={<Edit className="h-5 w-5" style={{ color: COLORS.accent }} />}
                      iconOnly
                      onClick={() => onEdit(index)}
                      title={t("common.edit")}
                      rounded
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      icon={<Trash className="h-5 w-5" style={{ color: COLORS.error }} />}
                      iconOnly
                      onClick={() => onDelete(index)}
                      title={t("common.delete")}
                      rounded
                    />
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default memo(AchievementList);

