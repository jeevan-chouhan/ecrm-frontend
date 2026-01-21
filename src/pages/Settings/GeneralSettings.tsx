import { useState, useEffect, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { Input, MultiSelect, Button } from "../../components";
import { COLORS, typography } from "../../constants";
import { userService } from "../../services";
import type { CountryItem, UniversityItem } from "../../services";
import { useAppSelector, useAppDispatch } from "../../redux/hooks";
import { showLoader, hideLoader } from "../../redux/slices/loader/loaderSlice";
import { addToast } from "../../redux/slices/toast/toastSlice";

const GeneralSettings = () => {
  const { t } = useTranslation();
  const dispatch = useAppDispatch();
  const { user } = useAppSelector((state) => state.auth);

  // Form state
  const [agencyName, setAgencyName] = useState("");
  const [selectedCountries, setSelectedCountries] = useState<string[]>([]);
  const [selectedUniversities, setSelectedUniversities] = useState<string[]>([]);

  // Dropdown options
  const [countries, setCountries] = useState<CountryItem[]>([]);
  const [universities, setUniversities] = useState<UniversityItem[]>([]);
  const [isLoadingCountries, setIsLoadingCountries] = useState(false);
  const [isLoadingUniversities, setIsLoadingUniversities] = useState(false);

  // Fetch countries
  const fetchCountries = useCallback(async () => {
    if (!user?.agencyId) return;
    setIsLoadingCountries(true);
    try {
      const response = await userService.getCountries(user.agencyId);
      if (Array.isArray(response)) {
        setCountries(response);
      } else if (response.data) {
        setCountries(response.data);
      }
    } catch (error) {
      console.error("Failed to fetch countries:", error);
    } finally {
      setIsLoadingCountries(false);
    }
  }, [user?.agencyId]);

  // Fetch universities
  const fetchUniversities = useCallback(async (countryIds: number[] | null = null) => {
    setIsLoadingUniversities(true);
    try {
      const response = await userService.getUniversities({
        agencyId: user?.agencyId ?? null,
        countryId: countryIds,
      });
      if (Array.isArray(response)) {
        setUniversities(response);
      } else if (response.data) {
        setUniversities(response.data);
      }
    } catch (error) {
      console.error("Failed to fetch universities:", error);
    } finally {
      setIsLoadingUniversities(false);
    }
  }, [user?.agencyId]);

  // Fetch data on mount
  useEffect(() => {
    fetchCountries();
    fetchUniversities();
  }, [fetchCountries, fetchUniversities]);

  // Convert to dropdown options
  const countryOptions = countries.map((country) => ({
    value: country.id.toString(),
    label: country.name,
  }));

  const universityOptions = universities.map((uni) => ({
    value: uni.id.toString(),
    label: uni.name,
  }));

  // Handle country change - fetch universities for selected countries
  const handleCountryChange = (values: string[]) => {
    setSelectedCountries(values);
    setSelectedUniversities([]); // Reset universities
    if (values.length > 0) {
      const countryIds = values.map((v) => parseInt(v, 10));
      fetchUniversities(countryIds);
    } else {
      fetchUniversities(null);
    }
  };

  const handleSave = async () => {
    dispatch(showLoader());
    try {
      // TODO: Call API to save settings
      console.log("Saving settings:", {
        agencyName,
        selectedCountries,
        selectedUniversities,
      });
      dispatch(addToast({ type: "success", message: t("common.savedSuccessfully", "Saved successfully") }));
    } catch (error) {
      dispatch(addToast({ type: "error", message: t("common.saveFailed", "Failed to save") }));
    } finally {
      dispatch(hideLoader());
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2
          className="text-lg font-semibold"
          style={{
            color: COLORS.textDark,
            fontSize: typography.fontSize.h3,
            fontWeight: typography.fontWeight.semibold,
          }}
        >
          {t("settingsPage.generalSetting", "General Setting")}
        </h2>
        <p style={{ color: COLORS.textMuted }}>
          {t("settingsPage.generalSettingDescription", "Change Name, Country & University")}
        </p>
      </div>

      {/* Form */}
      <div className="max-w-2xl space-y-5">
        {/* Agency Name */}
        <Input
          label={t("settingsPage.agencyName", "Agency Name")}
          placeholder={t("settingsPage.agencyNamePlaceholder", "Enter Agency Name")}
          value={agencyName}
          onChange={(e) => setAgencyName(e.target.value)}
          fullWidth
        />

        {/* Add Countries Serving */}
        <MultiSelect
          label={t("settingsPage.addCountriesServing", "Countries Serving")}
          options={countryOptions}
          value={selectedCountries}
          onChange={handleCountryChange}
          placeholder={isLoadingCountries ? t("common.loading", "Loading...") : t("settingsPage.multiSelectCountries", "Select Countries")}
          fullWidth
          searchable
          disabled={isLoadingCountries}
        />

        {/* Add Universities Serving */}
        <MultiSelect
          label={t("settingsPage.addUniversitiesServing", "Universities Serving")}
          options={universityOptions}
          value={selectedUniversities}
          onChange={setSelectedUniversities}
          placeholder={isLoadingUniversities ? t("common.loading", "Loading...") : t("settingsPage.multiSelectUniversities", "Select Universities")}
          fullWidth
          searchable
          disabled={isLoadingUniversities}
        />

        {/* Save Button */}
        <div className="flex justify-end pt-4">
          <Button variant="accent" rounded onClick={handleSave}>
            {t("common.save", "Save")}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default GeneralSettings;
