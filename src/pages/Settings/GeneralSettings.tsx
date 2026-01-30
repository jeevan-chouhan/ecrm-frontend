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
  
  // Track if we should fetch universities on country change (skip on initial load)
  const shouldFetchUniversitiesOnChange = useRef(false);

  // Form state
  const [agencyName, setAgencyName] = useState("");
  const [selectedCountries, setSelectedCountries] = useState<string[]>([]);
  const [selectedUniversities, setSelectedUniversities] = useState<string[]>([]);

  // Dropdown options from API
  const [countryOptions, setCountryOptions] = useState<{ value: string; label: string }[]>([]);
  const [universityOptions, setUniversityOptions] = useState<{ value: string; label: string }[]>([]);

  // Function to fetch universities based on selected countries
  const fetchUniversitiesByCountries = async (countryIds: string[], preserveSelection: boolean = false) => {
    if (!user?.agencyId || countryIds.length === 0) {
      setUniversityOptions([]);
      setSelectedUniversities([]);
      return;
    }

    try {
      const response = await agencyService.getSettingUniversityList(
        user.agencyId,
        countryIds.map((id) => parseInt(id, 10))
      );

      if (response.status === "success" && response.data) {
        // Update university options
        const newUniversityOptions = response.data.map((u) => ({
          value: u.universityId.toString(),
          label: u.universityName,
        }));
        setUniversityOptions(newUniversityOptions);

        if (preserveSelection) {
          // Use isSelect from API response to set selected universities
          const selectedUniIds = response.data
            .filter((u) => u.isSelect)
            .map((u) => u.universityId.toString());
          setSelectedUniversities(selectedUniIds);
        } else {
          // Preserve selected universities that are still in the new list
          const validUniversityIds = new Set(newUniversityOptions.map((u) => u.value));
          setSelectedUniversities((prev) =>
            prev.filter((id) => validUniversityIds.has(id))
          );
        }
      }
    } catch (error) {
      console.error("Failed to fetch universities:", error);
      dispatch(addToast({ type: "error", message: t("common.fetchFailed", "Failed to fetch universities") }));
    }
  };

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
            const selectedCountryIds = globalAndServingCountries
              .filter((c: GlobalAndServingCountry) => c.isSelect)
              .map((c: GlobalAndServingCountry) => c.countryId.toString());
            setSelectedCountries(selectedCountryIds);

            // Fetch universities for selected countries on initial load
            // Use preserveSelection=true to set selected universities from API response
            if (selectedCountryIds.length > 0) {
              await fetchUniversitiesByCountries(selectedCountryIds, true);
            } else {
              // No countries selected, clear universities
              setUniversityOptions([]);
              setSelectedUniversities([]);
            }
          }

          // Enable fetching universities on country change after initial load
          shouldFetchUniversitiesOnChange.current = true;
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

      // Fetch universities after save to refresh the list
      // Use preserveSelection=true to maintain selected universities from API response
      if (selectedCountries.length > 0) {
        await fetchUniversitiesByCountries(selectedCountries, true);
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
          onChange={async (countries) => {
            setSelectedCountries(countries);
            // Clear universities if all countries are deselected
            if (countries.length === 0) {
              setUniversityOptions([]);
              setSelectedUniversities([]);
            } else if (shouldFetchUniversitiesOnChange.current) {
              // Fetch universities when countries change
              await fetchUniversitiesByCountries(countries);
            }
          }}
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
          placeholder={selectedCountries.length > 0 ? t("settingsPage.multiSelectUniversities", "Select Universities") : t("settingsPage.selectCountriesFirst", "Please select countries first")}
          fullWidth
          searchable
          disabled={selectedCountries.length === 0}
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
