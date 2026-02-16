import React, { useState, useEffect, useRef, useCallback } from "react";
import { Input, Select, Button, FileUpload } from "../../../components";
import { useTranslation } from "react-i18next";
import { COLORS } from "../../../constants";
import type { AchievementItem } from "./types";
import type { SelectOption } from "../../../components";
import { applicantService } from "../../../services";
import { useAppDispatch } from "../../../redux/hooks";
import { addToast } from "../../../redux/slices/toast/toastSlice";
import { handleApiError } from "../../../utils";

interface AchievementFormProps {
  achievement: AchievementItem;
  index: number;
  onFieldChange: (index: number, field: keyof AchievementItem, value: string | File | null) => void;
  getFieldError: (index: number, fieldName: keyof AchievementItem) => string | undefined;
  onCancel?: () => void;
  onAddMore?: () => void;
  showCancel?: boolean;
  showAddMore?: boolean;
  dismissibleFileUpload?: boolean;
  categoryOptions?: SelectOption[]; // Optional: if provided, use it instead of fetching
}

const AchievementForm = ({
  achievement,
  index,
  onFieldChange,
  getFieldError,
  onCancel,
  onAddMore,
  showCancel = false,
  showAddMore = false,
  dismissibleFileUpload = false,
  categoryOptions: propCategoryOptions,
}: AchievementFormProps) => {
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

  return (
    <form onSubmit={(e) => { e.preventDefault(); }}>
      <div className="space-y-4">
        {/* Form Fields: Category */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="w-full">
            <label
              className="block text-sm font-medium mb-1.5"
              style={{ color: COLORS.textDark,  }}
            >
              {t("applicant.selectCategory")} <span style={{ color: COLORS.error }}>*</span>
            </label>
            <Select
              options={categoryOptions}
              value={achievement.category}
              onChange={(value) => onFieldChange(index, "category", value)}
              placeholder={t("applicant.selectCategoryPlaceholder")}
              error={getFieldError(index, "category")}
              fullWidth
            />
          </div>
        </div>

        {/* Description and Upload Documents side by side */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="w-full">
            <label
              className="block text-sm font-medium mb-1.5"
              style={{ color: COLORS.textDark,  }}
            >
              {t("applicant.description")} <span style={{ color: COLORS.error }}>*</span>
            </label>
            <Input
              inputType="textarea"
              value={achievement.description}
              onChange={(e) => onFieldChange(index, "description", e.target.value)}
              placeholder={t("applicant.enterDescription")}
              error={getFieldError(index, "description")}
              fullWidth
              rows={4}
            />
          </div>

          {/* Upload Documents */}
          <div className="w-full">
            <FileUpload
              label={t("applicant.uploadDocuments")}
              value={achievement.documents}
              onChange={(file) => onFieldChange(index, "documents", file as File | null)}
              accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
              maxSizeMB={2}
              supportedFormats="PDF, DOC, DOCX, JPG, PNG"
              multiple={false}
              dismissible={dismissibleFileUpload}
            />
          </div>
        </div>

        {/* Action Buttons */}
        {(showCancel || showAddMore) && (
          <div className="flex justify-end gap-2 pt-4 border-t" style={{ borderColor: COLORS.border }}>
            {showCancel && onCancel && (
              <Button
                type="button"
                variant="cancel"
                onClick={onCancel}
                rounded
              >
                {t("common.cancel")}
              </Button>
            )}
            {showAddMore && onAddMore && (
              <Button
                type="button"
                variant="accent"
                onClick={onAddMore}
                rounded
              >
                {t("common.addMore")}
              </Button>
            )}
          </div>
        )}
      </div>
    </form>
  );
};

// Memoize component to prevent unnecessary re-renders when props haven't changed
const MemoizedAchievementForm = React.memo(AchievementForm);

export default MemoizedAchievementForm;

