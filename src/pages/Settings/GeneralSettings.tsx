import { useState, useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import { Input, MultiSelect, Button } from "../../components";
import { COLORS, typography } from "../../constants";
import { agencyService } from "../../services";
import type { GlobalAndServingCountry, GlobalAndServingUniversity } from "../../services";
import { useAppSelector, useAppDispatch } from "../../redux/hooks";
import { showLoader, hideLoader } from "../../redux/slices/loader/loaderSlice";
import { addToast } from "../../redux/slices/toast/toastSlice";

const GeneralSettings = () => {
  const { t } = useTranslation();
  const dispatch = useAppDispatch();
  const { user } = useAppSelector((state) => state.auth);
  const hasFetched = useRef(false);
  
  // Track if any country or university was initially selected (to decide POST vs PUT)
  const hasInitialSelection = useRef(false);

  // Form state
  const [agencyName, setAgencyName] = useState("");
  const [selectedCountries, setSelectedCountries] = useState<string[]>([]);
  const [selectedUniversities, setSelectedUniversities] = useState<string[]>([]);

  // Dropdown options from API
  const [countryOptions, setCountryOptions] = useState<{ value: string; label: string }[]>([]);
  const [universityOptions, setUniversityOptions] = useState<{ value: string; label: string }[]>([]);

  // Fetch general settings on mount
  useEffect(() => {
    if (!user?.agencyId || hasFetched.current) return;
    hasFetched.current = true;

    const fetchGeneralSettings = async () => {
      dispatch(showLoader());
      try {
        const response = await agencyService.getGeneralSettings(user.agencyId!);
        if (response.status === "success" && response.data) {
          const { agencyName: name, globalAndServingCountries, globalAndServingUniversities } = response.data;

          // Set agency name (read-only)
          setAgencyName(name || "");

          // Check if any country or university has isSelect: true
          const hasSelectedCountry = globalAndServingCountries?.some((c: GlobalAndServingCountry) => c.isSelect) || false;
          const hasSelectedUniversity = globalAndServingUniversities?.some((u: GlobalAndServingUniversity) => u.isSelect) || false;
          hasInitialSelection.current = hasSelectedCountry || hasSelectedUniversity;

          // Set country options from globalAndServingCountries
          // Select only countries where isSelect is true
          if (globalAndServingCountries?.length) {
            setCountryOptions(globalAndServingCountries.map((c: GlobalAndServingCountry) => ({
              value: c.countryId.toString(),
              label: c.countryName,
            })));
            setSelectedCountries(
              globalAndServingCountries
                .filter((c: GlobalAndServingCountry) => c.isSelect)
                .map((c: GlobalAndServingCountry) => c.countryId.toString())
            );
          }

          // Set university options from globalAndServingUniversities
          // Select only universities where isSelect is true
          if (globalAndServingUniversities?.length) {
            setUniversityOptions(globalAndServingUniversities.map((u: GlobalAndServingUniversity) => ({
              value: u.universityId.toString(),
              label: u.universityName,
            })));
            setSelectedUniversities(
              globalAndServingUniversities
                .filter((u: GlobalAndServingUniversity) => u.isSelect)
                .map((u: GlobalAndServingUniversity) => u.universityId.toString())
            );
          }
        }
      } catch (error) {
        console.error("Failed to fetch general settings:", error);
        dispatch(addToast({ type: "error", message: t("common.fetchFailed", "Failed to fetch data") }));
      } finally {
        dispatch(hideLoader());
      }
    };

    fetchGeneralSettings();
  }, [user?.agencyId, dispatch, t]);

  const handleSave = async () => {
    if (!user?.agencyId) return;

    dispatch(showLoader());
    try {
      const payload = {
        agencyId: user.agencyId,
        countryIds: selectedCountries.map((id) => parseInt(id, 10)),
        universityIds: selectedUniversities.map((id) => parseInt(id, 10)),
      };

      // If no initial selection (all isSelect were false) -> POST
      // If any initial selection existed (at least one isSelect was true) -> PUT
      if (hasInitialSelection.current) {
        await agencyService.updateServing(payload);
      } else {
        await agencyService.createServing(payload);
        // After first save, set flag to true for subsequent saves
        hasInitialSelection.current = true;
      }

      dispatch(addToast({ type: "success", message: t("common.savedSuccessfully", "Saved successfully") }));
    } catch (error) {
      console.error("Failed to save settings:", error);
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
        {/* Agency Name (Read-only) */}
        <Input
          label={t("settingsPage.agencyName", "Agency Name")}
          value={agencyName}
          fullWidth
          disabled
        />

        {/* Countries Serving */}
        <MultiSelect
          label={t("settingsPage.addCountriesServing", "Countries Serving")}
          options={countryOptions}
          value={selectedCountries}
          onChange={setSelectedCountries}
          placeholder={t("settingsPage.multiSelectCountries", "Select Countries")}
          fullWidth
          searchable
        />

        {/* Universities Serving */}
        <MultiSelect
          label={t("settingsPage.addUniversitiesServing", "Universities Serving")}
          options={universityOptions}
          value={selectedUniversities}
          onChange={setSelectedUniversities}
          placeholder={t("settingsPage.multiSelectUniversities", "Select Universities")}
          fullWidth
          searchable
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
