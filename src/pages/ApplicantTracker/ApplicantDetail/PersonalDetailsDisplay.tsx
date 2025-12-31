import { useMemo, memo } from "react";
import { useTranslation } from "react-i18next";
import { COLORS } from "../../../constants";
import { formatDateValue, getEnrollmentTypeLabel, getGenderLabel } from "../../../utils";
import { DetailField } from "./DisplayComponents";

interface PersonalDetailsData {
  profilePhoto?: string | null;
  enrollmentType?: string;
  name?: string;
  dateOfBirth?: string | Date | null;
  gender?: string;
  countryCode?: string;
  contactNumber?: string;
  emailId?: string;
  permanentAddress?: string;
  notes?: string;
}

interface PersonalDetailsDisplayProps {
  data: PersonalDetailsData;
}

const PersonalDetailsDisplay = ({ data }: PersonalDetailsDisplayProps) => {
  const { t } = useTranslation();

  const formatContactNumber = useMemo((): string => {
    if (!data.contactNumber) return "-";
    if (data.countryCode) {
      return `${data.countryCode} ${data.contactNumber}`;
    }
    return data.contactNumber;
  }, [data.contactNumber, data.countryCode]);

  const details = useMemo(() => [
    {
      label: t("applicant.enrollmentType", "Enrollment Type"),
      value: getEnrollmentTypeLabel(data.enrollmentType),
    },
    {
      label: t("applicant.name", "Name"),
      value: data.name || "-",
    },
    {
      label: t("applicant.dateOfBirth", "Date of Birth"),
      value: formatDateValue(data.dateOfBirth),
    },
    {
      label: t("applicant.gender", "Gender"),
      value: getGenderLabel(data.gender),
    },
    {
      label: t("applicant.contactNumber", "Contact Number"),
      value: formatContactNumber,
    },
    {
      label: t("applicant.emailId", "Email ID"),
      value: data.emailId || "-",
    },
    {
      label: t("applicant.permanentAddress", "Permanent/Postal Address"),
      value: data.permanentAddress || "-",
    },
  ], [data, formatContactNumber, t]);

  return (
    <div className="space-y-3">
      {/* Profile Photo and Details Grid */}
      <div className="flex flex-col md:flex-row gap-4">
        {/* Profile Photo */}
        {data.profilePhoto && (
          <div className="flex-shrink-0">
            <div className="space-y-1.5">
              <label
                className="text-xs font-medium tracking-wide block"
                style={{ color: COLORS.textMuted }}
              >
                {t("applicant.uploadProfilePhoto", "Profile Photo")}
              </label>
              <div className="relative">
                <img
                  src={data.profilePhoto}
                  alt="Profile"
                  className="w-20 h-20 md:w-24 md:h-24 object-cover rounded-lg border"
                  style={{ borderColor: COLORS.border }}
                />
              </div>
            </div>
          </div>
        )}

        {/* Details Grid - 2 columns on medium, 3 columns on large screens */}
        <div className="flex-1 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4">
          {details.map((detail, index) => (
            <DetailField key={index} label={detail.label} value={detail.value} />
          ))}
        </div>
      </div>

      {/* Notes - Full Width */}
      {data.notes && (
        <div className="pt-2 border-t" style={{ borderColor: COLORS.border }}>
          <DetailField
            label={t("applicant.notes", "Notes")}
            value={<p className="text-sm font-medium whitespace-pre-wrap">{data.notes}</p>}
          />
        </div>
      )}
    </div>
  );
};

export default memo(PersonalDetailsDisplay);

