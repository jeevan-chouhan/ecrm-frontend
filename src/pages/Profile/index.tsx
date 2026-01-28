import { useState, useEffect, useRef, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { Layout, Button, Input, FileUpload, PhoneInput } from "../../components";
import { COLORS } from "../../constants";
import { userService } from "../../services";
import type { ProfilePhotoInfo } from "../../services";
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
  profilePhotoInfo: ProfilePhotoInfo | null;
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
    profilePhotoInfo: null,
    isPrimaryAdmin:false
  });
  const [isSaving, setIsSaving] = useState(false);

  // Ref to prevent duplicate API calls
  const hasFetchedProfile = useRef(false);

  // Parse profile photo JSON string
  const parseProfilePhoto = (photoString: string | null): ProfilePhotoInfo | null => {
    if (!photoString) return null;
    try {
      return JSON.parse(photoString);
    } catch {
      return null;
    }
  };

  // Fetch profile details
  const fetchProfileDetails = useCallback(async () => {
    if (!user?.userId || hasFetchedProfile.current) return;

    hasFetchedProfile.current = true;
    dispatch(showLoader());

    try {
      const response = await userService.getProfileDetails({ userId: user.userId });
      
      if (response.status === "success" && response.data) {
        const data = response.data;
        const photoInfo = parseProfilePhoto(data.profilePhoto);
        
        // Build full phone number for PhoneInput (dialCode + number)
        const dialCode = data.countryCode?.replace("+", "") || "";
        const fullPhone = dialCode ? `${dialCode}${data.contactNumber || ""}` : data.contactNumber || "";

        setProfileData({
          name: data.name || "",
          email: data.email || "",
          countryCode: data.countryCode || "",
          contactNumber: fullPhone,
          role: formatStatus(data?.isPrimaryAdmin == true ? "Primary Admin" : data.role || ""),
          profilePhotoInfo: photoInfo,
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

  const handleImageChange = (file: File | File[] | null) => {
    // Handle single file (Profile only uses single file upload)
    const singleFile = Array.isArray(file) ? file[0] || null : file;
    setProfileImage(singleFile);
  };

  const handleRemoveImage = () => {
    setProfileImage(null);
  };

  const handleSave = async () => {
    if (!user?.userId) return;

    // Extract phone number without country code
    const dialCode = profileData.countryCode.replace("+", "");
    const phoneNumber = profileData.contactNumber.startsWith(dialCode)
      ? profileData.contactNumber.slice(dialCode.length)
      : profileData.contactNumber;

    // Build profile photo info
    let profilePhotoPayload: ProfilePhotoInfo | null = profileData.profilePhotoInfo;
    
    // If a new image is uploaded, create new photo info
    if (profileImage) {
      profilePhotoPayload = {
        size: profileImage.size,
        fileName: profileImage.name,
        filePath: `/uploads/${profileImage.name}`,
        fileType: profileImage.type,
        accessUrl: URL.createObjectURL(profileImage), // This will be replaced by actual URL after upload
      };
    }

    setIsSaving(true);
    dispatch(showLoader());

    try {
      const response = await userService.updateProfile(
        { userId: user.userId },
        {
          name: profileData.name.trim(),
          countryCode: profileData.countryCode,
          contactNumber: phoneNumber,
          profilePhoto: profilePhotoPayload,
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
            {/* Show existing profile photo if available */}
            {profileData.profilePhotoInfo?.accessUrl && !profileImage && (
              <div className="mb-4">
                <p
                  className="text-sm font-medium mb-2"
                  style={{ color: COLORS.textDark }}
                >
                  {t("profile.currentPhoto", "Current Photo")}
                </p>
                <img
                  src={profileData.profilePhotoInfo.accessUrl}
                  alt="Profile"
                  className="w-32 h-32 rounded-lg object-cover border"
                  style={{ borderColor: COLORS.border }}
                />
              </div>
            )}
            <FileUpload
              label={t("profile.uploadImage", "Upload Image")}
              accept="image/png,image/jpeg,image/jpg"
              maxSizeMB={2}
              value={profileImage}
              onChange={handleImageChange}
              onRemove={handleRemoveImage}
              showPreview={true}
              previewSize="lg"
              supportedFormats="PNG, JPG"
              dismissible={false}
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
