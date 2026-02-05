import { useState, useEffect, useRef, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { Layout, Button, Input, FileUpload, PhoneInput } from "../../components";
import { COLORS } from "../../constants";
import { userService } from "../../services";
import { useAppSelector, useAppDispatch } from "../../redux/hooks";
import { showLoader, hideLoader } from "../../redux/slices/loader/loaderSlice";
import { addToast } from "../../redux/slices/toast/toastSlice";
import { handleApiError, formatStatus } from "../../utils";

interface ProfileData {
  name: string;
  email: string;
  countryCode: string;
  contactNumber: string;
  role: string;
  profilePhotoUrl: string | null; // fileFormat from API
  isPrimaryAdmin ?: boolean;
}

const Profile = () => {
  const { t } = useTranslation();
  const dispatch = useAppDispatch();
  const { user } = useAppSelector((state) => state.auth);
  
  const [profileImage, setProfileImage] = useState<File | null>(null);
  const [profileData, setProfileData] = useState<ProfileData>({
    name: "",
    email: "",
    countryCode: "",
    contactNumber: "",
    role: "",
    profilePhotoUrl: null,
    isPrimaryAdmin: false
  });
  const [isSaving, setIsSaving] = useState(false);

  // Ref to prevent duplicate API calls
  const hasFetchedProfile = useRef(false);

  // Fetch profile details
  const fetchProfileDetails = useCallback(async () => {
    if (!user?.userId || hasFetchedProfile.current) return;

    hasFetchedProfile.current = true;
    dispatch(showLoader());

    try {
      const response = await userService.getProfileDetails({ userId: user.userId });
      
      if (response.status === "success" && response.data) {
        const data = response.data as any; // API response with fileFormat
        
        // Build full phone number for PhoneInput (dialCode + number)
        const dialCode = data.countryCode?.replace("+", "") || "";
        const fullPhone = dialCode ? `${dialCode}${data.contactNumber || ""}` : data.contactNumber || "";

        setProfileData({
          name: data.name || "",
          email: data.email || "",
          countryCode: data.countryCode || "",
          contactNumber: fullPhone,
          role: formatStatus(data?.isPrimaryAdmin == true ? "Primary Admin" : data.role || ""),
          profilePhotoUrl: data.fileFormat || null, // Use fileFormat from API
        });
      }
    } catch (error: any) {
      hasFetchedProfile.current = false; // Allow retry on error
      const { message } = handleApiError(error, "Failed to fetch profile details");
      dispatch(addToast({ type: "error", message }));
    } finally {
      dispatch(hideLoader());
    }
  }, [user?.userId, dispatch]);

  // Fetch profile on mount
  useEffect(() => {
    fetchProfileDetails();
  }, [fetchProfileDetails]);

  const handleFieldChange = (field: keyof ProfileData, value: string) => {
    setProfileData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  // Allowed profile image file types
  const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/jpg", "image/png"];
  const ALLOWED_EXTENSIONS = [".jpg", ".jpeg", ".png"];

  const handleImageChange = (file: File | File[] | null) => {
    // Handle single file (Profile only uses single file upload)
    const singleFile = Array.isArray(file) ? file[0] || null : file;
    
    if (singleFile) {
      // Validate file type
      const fileExtension = singleFile.name.toLowerCase().slice(singleFile.name.lastIndexOf("."));
      const isValidType = ALLOWED_IMAGE_TYPES.includes(singleFile.type) || ALLOWED_EXTENSIONS.includes(fileExtension);
      
      if (!isValidType) {
        dispatch(addToast({
          type: "error",
          message: t("validation.invalidImageType", "Only JPG, JPEG, and PNG files are allowed."),
        }));
        return;
      }
    }
    
    setProfileImage(singleFile);
  };

  const handleRemoveImage = () => {
    setProfileImage(null);
    // Also clear the existing image URL when user removes the image
    setProfileData((prev) => ({
      ...prev,
      profilePhotoUrl: null,
    }));
  };

  const handleSave = async () => {
    if (!user?.userId) return;

    // Extract phone number without country code
    const dialCode = profileData.countryCode.replace("+", "");
    const phoneNumber = profileData.contactNumber.startsWith(dialCode)
      ? profileData.contactNumber.slice(dialCode.length)
      : profileData.contactNumber;

    setIsSaving(true);
    dispatch(showLoader());

    try {
      const response = await userService.updateProfile(
        { userId: user.userId },
        {
          name: profileData.name.trim(),
          countryCode: profileData.countryCode,
          contactNumber: phoneNumber,
          profilePhoto: profileImage, // Send file directly like register
        }
      );

      if (response.status === "success") {
        dispatch(addToast({ 
          type: "success", 
          message: t("profile.updateSuccess", "Profile updated successfully") 
        }));
      }
    } catch (error: any) {
      const { message } = handleApiError(error, "Failed to update profile");
      dispatch(addToast({ type: "error", message }));
    } finally {
      setIsSaving(false);
      dispatch(hideLoader());
    }
  };

  // Check if save button should be disabled
  const isSaveDisabled = !profileData.name.trim() || !profileData.contactNumber || isSaving;

  return (
    <Layout>
      <div
        className="bg-white rounded-lg shadow-sm p-4 md:p-6"
        style={{ backgroundColor: COLORS.surface }}
      >
        {/* Title with Role */}
        <div className="flex items-center justify-between mb-8">
          <h1
            className="text-xl md:text-2xl font-bold"
            style={{ color: COLORS.textDark }}
          >
            {t("profile.title", "Profile Setting")}
          </h1>
          <div className="flex items-center gap-2">
            <span style={{ color: COLORS.textMuted }}>
              {t("profile.role", "Role")}
            </span>
            <span
              className="font-semibold"
              style={{ color: COLORS.textDark }}
            >
              {profileData.role}
            </span>
          </div>
        </div>

        {/* Profile Content - Two Column Layout */}
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Left Section - File Upload */}
          <div className="w-full lg:w-80 shrink-0">
            <FileUpload
              label={t("profile.uploadImage", "Upload Image")}
              accept=".jpg,.jpeg,.png,image/jpeg,image/png"
              maxSizeMB={2}
              value={profileImage}
              onChange={handleImageChange}
              onRemove={handleRemoveImage}
              showPreview={true}
              previewSize="lg"
              supportedFormats="PNG, JPG, JPEG"
              dismissible={false}
              existingPreviewUrl={profileImage ? null : profileData.profilePhotoUrl}
            />
          </div>

          {/* Right Section - Form Fields */}
          <div className="flex-1">
            {/* Form Fields */}
            <div className="space-y-5">
              {/* Name */}
              <Input
                label={<>{t("profile.name", "Name")} <span style={{ color: COLORS.error }}>*</span></>}
                value={profileData.name}
                onChange={(e) => handleFieldChange("name", e.target.value)}
                fullWidth
              />

              {/* Email */}
              <Input
                label={<>{t("profile.email", "Email")} <span style={{ color: COLORS.error }}>*</span></>}
                type="email"
                value={profileData.email}
                onChange={(e) => handleFieldChange("email", e.target.value)}
                fullWidth
                disabled
              />

              {/* Contact Number */}
              <PhoneInput
                label={<>{t("profile.contactNumber", "Contact Number")} <span style={{ color: COLORS.error }}>*</span></>}
                value={profileData.contactNumber}
                onChange={(phone, countryData) => {
                  handleFieldChange("contactNumber", phone);
                  if (countryData?.dialCode) {
                    handleFieldChange("countryCode", `+${countryData.dialCode}`);
                  }
                }}
                placeholder={t("common.enterContactNumber", "Enter Contact Number")}
                fullWidth
              />
            </div>
          </div>
        </div>

        {/* Save Button */}
        <div className="mt-8 flex justify-end">
          <Button 
            variant="accent" 
            size="md" 
            rounded 
            onClick={handleSave}
            disabled={isSaveDisabled}
          >
            {t("common.save", "Save")}
          </Button>
        </div>
      </div>
    </Layout>
  );
};

export default Profile;
