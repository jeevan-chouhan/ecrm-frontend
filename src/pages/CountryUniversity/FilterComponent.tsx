import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { Tooltip } from "@mui/material";
import { SearchBar, Select, Button } from "../../components";
import type { SelectOption } from "../../components";
import type { CountryItem } from "../../services";

export interface FilterValues {
  searchValue: string;
  country: string;
  program: string;
  course: string;
}

export interface AppliedFilters {
  country: string;
  program: string;
  course: string;
}

interface FilterComponentProps {
  // Search
  searchValue: string;
  onSearchChange: (value: string) => void;
  
  // Pending filter values
  pendingCountry: string;
  pendingProgram: string;
  pendingCourse: string;
  onCountryChange: (value: string) => void;
  onProgramChange: (value: string) => void;
  onCourseChange: (value: string) => void;
  
  // Applied filter values (for comparison)
  appliedCountry: string;
  appliedProgram: string;
  appliedCourse: string;
  
  // Actions
  onApply: () => void;
  onClear: () => void;
  
  // Data
  countries: CountryItem[];
  isLoadingCountries?: boolean;
}

const FilterComponent = ({
  searchValue,
  onSearchChange,
  pendingCountry,
  pendingProgram,
  pendingCourse,
  onCountryChange,
  onProgramChange,
  onCourseChange,
  appliedCountry,
  appliedProgram,
  appliedCourse,
  onApply,
  onClear,
  countries,
  isLoadingCountries = false,
}: FilterComponentProps) => {
  const { t } = useTranslation();

  // Check if filters have changed (to enable/disable Apply button)
  const hasFilterChanges = useMemo(() => {
    return (
      pendingCountry !== appliedCountry ||
      pendingProgram !== appliedProgram ||
      pendingCourse !== appliedCourse
    );
  }, [pendingCountry, pendingProgram, pendingCourse, appliedCountry, appliedProgram, appliedCourse]);

  // Check if any filter is applied or pending
  const hasAppliedFilters = useMemo(() => {
    return !!(appliedCountry || appliedProgram || appliedCourse);
  }, [appliedCountry, appliedProgram, appliedCourse]);

  const hasPendingFilters = useMemo(() => {
    return !!(pendingCountry || pendingProgram || pendingCourse);
  }, [pendingCountry, pendingProgram, pendingCourse]);

  // Country options for dropdown
  const countryOptions: SelectOption[] = useMemo(
    () => [
      { value: "", label: t("countryUniversity.selectCountry", "Select Country") },
      ...countries.map((country) => ({
        value: country.id.toString(),
        label: country.name,
      })),
    ],
    [countries, t]
  );

  // Program options (placeholder - would come from API)
  const programOptions: SelectOption[] = useMemo(
    () => [
      { value: "", label: t("countryUniversity.selectProgram", "Select Program") },
      { value: "bachelors", label: t("countryUniversity.bachelors", "Bachelors") },
      { value: "masters", label: t("countryUniversity.masters", "Masters") },
      { value: "phd", label: t("countryUniversity.phd", "PhD") },
      { value: "diploma", label: t("countryUniversity.diploma", "Diploma") },
    ],
    [t]
  );

  // Course options (placeholder - would come from API)
  const courseOptions: SelectOption[] = useMemo(
    () => [
      { value: "", label: t("countryUniversity.selectCourse", "Select Course") },
      { value: "engineering", label: t("countryUniversity.engineering", "Engineering") },
      { value: "business", label: t("countryUniversity.business", "Business") },
      { value: "medicine", label: t("countryUniversity.medicine", "Medicine") },
      { value: "arts", label: t("countryUniversity.arts", "Arts & Humanities") },
      { value: "science", label: t("countryUniversity.science", "Science") },
    ],
    [t]
  );

  return (
    <div className="flex flex-wrap items-center gap-3 mb-6">
      {/* Search Bar */}
      <Tooltip
        title={t("countryUniversity.searchTooltip", "Search by University Name, Courses")}
        arrow
        placement="top"
      >
        <div className="w-full sm:w-auto sm:min-w-[250px] lg:min-w-[300px]">
          <SearchBar
            value={searchValue}
            onChange={onSearchChange}
            placeholder={t("countryUniversity.searchPlaceholder", "Search by university, course...")}
          />
        </div>
      </Tooltip>
      
      {/* Country Filter */}
      <div className="w-full sm:w-auto sm:min-w-[160px]">
        <Select
          label=""
          options={countryOptions}
          value={pendingCountry}
          onChange={onCountryChange}
          placeholder={t("countryUniversity.selectCountry", "Select Country")}
          disabled={isLoadingCountries}
        />
      </div>
      
      {/* Program Filter */}
      <div className="w-full sm:w-auto sm:min-w-[160px]">
        <Select
          label=""
          options={programOptions}
          value={pendingProgram}
          onChange={onProgramChange}
          placeholder={t("countryUniversity.selectProgram", "Select Program")}
        />
      </div>
      
      {/* Course Filter */}
      <div className="w-full sm:w-auto sm:min-w-[160px]">
        <Select
          label=""
          options={courseOptions}
          value={pendingCourse}
          onChange={onCourseChange}
          placeholder={t("countryUniversity.selectCourse", "Select Course")}
        />
      </div>
      
      {/* Apply & Clear Buttons */}
      <div className="flex gap-2">
        <Button
          variant="accent"
          rounded
          onClick={onApply}
          disabled={!hasFilterChanges && !hasPendingFilters}
        >
          {t("common.apply", "Apply")}
        </Button>
        <Button
          variant="cancel"
          rounded
          onClick={onClear}
          disabled={!hasAppliedFilters && !hasPendingFilters}
        >
          {t("countryUniversity.clearFilter", "Clear Filter")}
        </Button>
      </div>
    </div>
  );
};

export default FilterComponent;
