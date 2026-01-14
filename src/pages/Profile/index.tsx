import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Layout, Button, Input, FileUpload, PhoneInput } from "../../components";
import { COLORS } from "../../constants";

interface ProfileData {
  name: string;
  email: string;
  contactNumber: string;
  password: string;
  role: string;
}

const Profile = () => {
  const { t } = useTranslation();
  const [profileImage, setProfileImage] = useState<File | null>(null);

  const [profileData, setProfileData] = useState<ProfileData>({
    name: "Arthur Cumin",
    email: "abc@ex.in",
    contactNumber: "919876543210",
    password: "**********",
    role: "Primary Admin",
  });

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

  const handleSave = () => {
    console.log("Profile saved:", { ...profileData, profileImage });
  };

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
            {t("profile.title", "Profile setting")}
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
              accept="image/png,image/jpeg,image/jpg"
              maxSizeMB={5}
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
              />

              {/* Contact Number */}
              <PhoneInput
                label={<>{t("profile.contactNumber", "Contact Number")} <span style={{ color: COLORS.error }}>*</span></>}
                value={profileData.contactNumber}
                onChange={(phone) => handleFieldChange("contactNumber", phone)}
                country="in"
                fullWidth
              />

              {/* Password */}
              <Input
                label={<>{t("profile.password", "Password")} <span style={{ color: COLORS.error }}>*</span></>}
                type="password"
                value={profileData.password}
                onChange={(e) => handleFieldChange("password", e.target.value)}
                fullWidth
              />
            </div>
          </div>
        </div>

        {/* Save Button */}
        <div className="mt-8 flex justify-end">
          <Button variant="accent" size="md" rounded onClick={handleSave}>
            {t("common.save", "Save")}
          </Button>
        </div>
      </div>
    </Layout>
  );
};

export default Profile;
