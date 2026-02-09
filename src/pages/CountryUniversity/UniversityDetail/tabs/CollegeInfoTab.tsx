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

// Official website as clickable link
const WebsiteLink = ({
  label,
  url,
}: {
  label: string;
  url?: string;
}) => {
  const href = url?.trim();
  if (!href) {
    return (
      <div>
        <p className="text-xs font-medium mb-1" style={{ color: COLORS.textMuted }}>
          {label}
        </p>
        <p className="text-sm" style={{ color: COLORS.textDark }}>
          -
        </p>
      </div>
    );
  }
  const displayUrl = href.startsWith("http") ? href : `https://${href}`;
  return (
    <div>
      <p className="text-xs font-medium mb-1" style={{ color: COLORS.textMuted }}>
        {label}
      </p>
      <a
        href={displayUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="text-sm underline hover:opacity-80"
        style={{ color: COLORS.primary }}
      >
        {displayUrl}
      </a>
    </div>
  );
};

const CollegeInfoTab = ({ university }: CollegeInfoTabProps) => {
  const { t } = useTranslation();
  const { collegeInfo } = university;

  return (
    <div className="space-y-6">
      <div>
        <h3 className="font-semibold text-lg mb-4" style={{ color: COLORS.textDark }}>
          {t("collegeInfo.collegeInformation", "College Information")}
        </h3>

        <div className="grid grid-cols-2 gap-x-6 gap-y-4">
          {/* Row 1: Description (full width) */}
          <div className="col-span-2">
            <p className="text-xs font-medium mb-1" style={{ color: COLORS.textMuted }}>
              {t("collegeInfo.description", "Description")}
            </p>
            <p className="text-sm" style={{ color: COLORS.textDark }}>
              {collegeInfo?.description || university.description || "-"}
            </p>
          </div>

          {/* Row 2: DLI Number | Official Website */}
          <div>
            <InfoItem
              label={t("collegeInfo.dliNumber", "DLI Number")}
              value={collegeInfo?.dliNumber}
            />
          </div>
          <div>
            <WebsiteLink
              label={t("collegeInfo.officialWebsite", "Official Website")}
              url={collegeInfo?.officialWebsite || university.website}
            />
          </div>

          {/* Row 3: Contact Number | Email */}
          <div>
            <InfoItem
              label={t("collegeInfo.contactNumber", "Contact Number")}
              value={collegeInfo?.phone}
            />
          </div>
          <div>
            <InfoItem
              label={t("collegeInfo.email", "Email")}
              value={collegeInfo?.email}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default CollegeInfoTab;
