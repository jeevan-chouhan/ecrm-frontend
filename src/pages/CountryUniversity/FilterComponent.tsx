import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { Tooltip } from "@mui/material";
import { SearchBar, Select, Button } from "../../components";
import type { SelectOption } from "../../components";
import type { CountryItem } from "../../services";

export interface FilterValues {
  searchValue: string;
  country: string;
}

export interface AppliedFilters {
  country: string;
}

interface FilterComponentProps {
  // Search
  searchValue: string;
  onSearchChange: (value: string) => void;
  
  // Pending filter values
  pendingCountry: string;
  onCountryChange: (value: string) => void;
  
  // Applied filter values (for comparison)
  appliedCountry: string;
  
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
  onCountryChange,
  appliedCountry,
  onApply,
  onClear,
  countries,
  isLoadingCountries = false,
}: FilterComponentProps) => {
  const { t } = useTranslation();

  // Check if filters have changed (to enable/disable Apply button)
  const hasFilterChanges = useMemo(() => {
    return pendingCountry !== appliedCountry;
  }, [pendingCountry, appliedCountry]);

  // Check if any filter is applied or pending
  const hasAppliedFilters = useMemo(() => {
    return !!appliedCountry;
  }, [appliedCountry]);

  const hasPendingFilters = useMemo(() => {
    return !!pendingCountry;
  }, [pendingCountry]);

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

  return (
    <div className="flex flex-wrap items-center gap-3 mb-6">
      {/* Search Bar */}
      <Tooltip
        title={t("countryUniversity.searchTooltip", "Search By University Name")}
        arrow
        placement="top"
      >
        <div className="w-full sm:w-auto sm:min-w-[250px] lg:min-w-[300px]">
          <SearchBar
            value={searchValue}
            onChange={onSearchChange}
            placeholder={t("countryUniversity.searchPlaceholder", "Search By University Name")}
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
