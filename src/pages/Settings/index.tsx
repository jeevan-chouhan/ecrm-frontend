import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Layout, Card, Popup, Input, MultiSelect, Button } from "../../components";
import { Settings as SettingsIcon, Document } from "../../assets";
import { COLORS, ROUTES } from "../../constants";
import { userService } from "../../services";
import type { CountryItem, UniversityItem } from "../../services";
import { useAppSelector, useAppDispatch } from "../../redux/hooks";
import { showLoader, hideLoader } from "../../redux/slices/loader/loaderSlice";
import { addToast } from "../../redux/slices/toast/toastSlice";

const Settings = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { user } = useAppSelector((state) => state.auth);

  // General Settings Popup state
  const [isGeneralSettingsOpen, setIsGeneralSettingsOpen] = useState(false);
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
  const fetchUniversities = useCallback(async (countryId: number | null = null) => {
    setIsLoadingUniversities(true);
    try {
      const response = await userService.getUniversities({
        agencyId: user?.agencyId ?? null,
        countryId,
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

  // Fetch data when popup opens
  useEffect(() => {
    if (isGeneralSettingsOpen) {
      fetchCountries();
      fetchUniversities();
    }
  }, [isGeneralSettingsOpen, fetchCountries, fetchUniversities]);

  // Convert to dropdown options
  const countryOptions = countries.map((country) => ({
    value: country.id.toString(),
    label: country.name,
  }));

  const universityOptions = universities.map((uni) => ({
    value: uni.id.toString(),
    label: uni.name,
  }));

  const handleGeneralSettings = () => {
    setIsGeneralSettingsOpen(true);
  };

  const handleCloseGeneralSettings = () => {
    setIsGeneralSettingsOpen(false);
    // Reset form
    setAgencyName("");
    setSelectedCountries([]);
    setSelectedUniversities([]);
  };

  const handleSaveGeneralSettings = async () => {
    dispatch(showLoader());
    try {
      // TODO: Call API to save settings
      console.log("Saving settings:", {
        agencyName,
        selectedCountries,
        selectedUniversities,
      });
      dispatch(addToast({ type: "success", message: t("common.savedSuccessfully", "Saved successfully") }));
      handleCloseGeneralSettings();
    } catch (error) {
      dispatch(addToast({ type: "error", message: t("common.saveFailed", "Failed to save") }));
    } finally {
      dispatch(hideLoader());
    }
  };

  const handlePlanManagement = () => {
    // Navigate to plan management page
    navigate(ROUTES.SETTINGS_PRICING);
  };

  return (
    <Layout>
      <div className="space-y-6">
        {/* Page Heading */}
        <h1
          className="text-xl md:text-2xl font-bold"
          style={{ color: COLORS.textDark }}
        >
          {t("settingsPage.title", "Settings")}
        </h1>

        {/* Cards in single row */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* General Settings Card */}
          <Card
            title={t("settingsPage.generalSetting", "General Setting")}
            headerIcon={<SettingsIcon className="w-5 h-5" style={{ color: COLORS.textDark }} />}
            hoverable
            className="cursor-pointer"
            padding="md"
          >
            <div onClick={handleGeneralSettings} className="min-h-[60px]">
              <p className="text-sm" style={{ color: COLORS.textMuted }}>
                {t("settingsPage.generalSettingDescription", "Change Name, Country & University, Reminder Sending Duration, Date Setting, Language Preference")}
              </p>
            </div>
          </Card>

          {/* Plan Management Card */}
          <Card
            title={t("settingsPage.planManagement", "Plan Management")}
            headerIcon={<Document className="w-5 h-5" style={{ color: COLORS.textDark }} />}
            hoverable
            className="cursor-pointer"
            padding="md"
          >
            <div onClick={handlePlanManagement} className="min-h-[60px]">
              <p className="text-sm" style={{ color: COLORS.textMuted }}>
                {t("settingsPage.planManagementDescription", "Subscription Plans (Free, Premium) Upgrade/Renew")}
              </p>
            </div>
          </Card>
        </div>
      </div>

      {/* General Settings Popup */}
      <Popup
        isOpen={isGeneralSettingsOpen}
        onClose={handleCloseGeneralSettings}
        title={t("settingsPage.generalSetting", "General Setting")}
        size="lg"
        showCloseButton
      >
        <div className="space-y-5">
          {/* Agency Name */}
          <Input
            label={t("settingsPage.agencyName", "Agency Name")}
            placeholder={t("settingsPage.agencyNamePlaceholder", "Abroad Agency (editable input field)")}
            value={agencyName}
            onChange={(e) => setAgencyName(e.target.value)}
            fullWidth
          />

          {/* Add Countries Serving */}
          <MultiSelect
            label={t("settingsPage.addCountriesServing", "Countries Serving")}
            options={countryOptions}
            value={selectedCountries}
            onChange={setSelectedCountries}
            placeholder={isLoadingCountries ? t("common.loading", "Loading...") : t("settingsPage.multiSelectCountries", "Multi Select Countries")}
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
            placeholder={isLoadingUniversities ? t("common.loading", "Loading...") : t("settingsPage.multiSelectUniversities", "Multi Select Countries")}
            fullWidth
            searchable
            disabled={isLoadingUniversities}
          />
        </div>

        {/* Footer with Save/Cancel buttons */}
        <div className="flex justify-end gap-3 mt-6 pt-4" style={{ borderTop: `1px solid ${COLORS.border}` }}>
          <Button
            variant="cancel"
            rounded
            onClick={handleCloseGeneralSettings}
          >
            {t("common.cancel", "Cancel")}
          </Button>
          <Button
            variant="accent"
            rounded
            onClick={handleSaveGeneralSettings}
          >
            {t("common.save", "Save")}
          </Button>
        </div>
      </Popup>
    </Layout>
  );
};

export default Settings;

