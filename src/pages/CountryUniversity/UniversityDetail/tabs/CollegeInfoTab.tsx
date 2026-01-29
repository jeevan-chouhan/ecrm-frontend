import { useTranslation } from "react-i18next";
import { COLORS } from "../../../../constants";
import type { UniversityDetail } from "../types";

interface CollegeInfoTabProps {
  university: UniversityDetail;
}

// Info Item Component - displays label on top, value below
const InfoItem = ({ label, value }: { label: string; value?: string | number }) => (
  <div>
    <p className="text-xs font-medium mb-1" style={{ color: COLORS.textMuted }}>
      {label}
    </p>
    <p className="text-sm" style={{ color: COLORS.textDark }}>
      {value || "-"}
    </p>
  </div>
);

const CollegeInfoTab = ({ university }: CollegeInfoTabProps) => {
  const { t } = useTranslation();
  const { collegeInfo } = university;

  return (
    <div className="space-y-6">
      {/* College Information Section */}
      <div>
        <h3 className="font-semibold text-lg mb-4" style={{ color: COLORS.textDark }}>
          {t("collegeInfo.collegeInformation", "College Information")}
        </h3>
        
        {/* Row 1: Campus Name, DLI Number, Location */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <InfoItem 
            label={t("collegeInfo.universityCampusName", "University Campus Name")} 
            value={collegeInfo?.campusName || university.name} 
          />
          <InfoItem 
            label={t("collegeInfo.dliNumber", "DLI Number")} 
            value={collegeInfo?.dliNumber} 
          />
          <InfoItem 
            label={t("collegeInfo.location", "Location")} 
            value={collegeInfo?.location || university.location} 
          />
        </div>

        {/* Row 2: City, State, Email */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <InfoItem 
            label={t("collegeInfo.city", "City")} 
            value={collegeInfo?.city} 
          />
          <InfoItem 
            label={t("collegeInfo.state", "State")} 
            value={collegeInfo?.state} 
          />
          <InfoItem 
            label={t("collegeInfo.email", "Email")} 
            value={collegeInfo?.email} 
          />
        </div>

        {/* Row 3: Phone */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <InfoItem 
            label={t("collegeInfo.phone", "Phone")} 
            value={collegeInfo?.phone} 
          />
        </div>

        {/* Description - full width */}
        <div>
          <p className="text-xs font-medium mb-1" style={{ color: COLORS.textMuted }}>
            {t("collegeInfo.description", "Description")}
          </p>
          <p className="text-sm" style={{ color: COLORS.textDark }}>
            {collegeInfo?.description || university.description || "-"}
          </p>
        </div>
      </div>
    </div>
  );
};

export default CollegeInfoTab;
