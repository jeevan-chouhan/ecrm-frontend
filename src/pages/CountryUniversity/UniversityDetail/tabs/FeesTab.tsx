import { useTranslation } from "react-i18next";
import { COLORS } from "../../../../constants";
import type { UniversityDetail } from "../types";

interface FeesTabProps {
  university: UniversityDetail;
}

const formatFeeRange = (min: number, max?: number) =>
  max != null && max !== min
    ? `$${min.toLocaleString()} - $${max.toLocaleString()}`
    : `$${min.toLocaleString()}`;

const PROGRAM_TYPE_LABELS: Record<string, string> = {
  BACHELOR: "Bachelor",
  MASTER: "Master",
  PHD: "PhD",
};

const FeesTab = ({ university }: FeesTabProps) => {
  const { t } = useTranslation();
  const hasFeeStructures = university.feeStructures && university.feeStructures.length > 0;

  if (!hasFeeStructures) {
    return (
      <div className="space-y-4">
        <p className="text-sm" style={{ color: COLORS.textMuted }}>
          {t("universityDetail.noFeeStructures", "No fee structures available.")}
        </p>
      </div>
    );
  }

  const structures = university.feeStructures!;

  return (
    <div className="space-y-4">
      <h4 className="font-semibold text-base" style={{ color: COLORS.textDark }}>
        {t("universityDetail.feeStructureTitle", "Fee Structure")}
      </h4>
      <div className="rounded-lg overflow-hidden border" style={{ borderColor: COLORS.border }}>
        <table className="w-full">
          <thead>
            <tr style={{ backgroundColor: COLORS.background }}>
              <th className="text-left text-sm font-medium px-4 py-3" style={{ color: COLORS.textDark }}>
                {t("universityDetail.programType", "Program Type")}
              </th>
              <th className="text-right text-sm font-medium px-4 py-3" style={{ color: COLORS.textDark }}>
                {t("universityDetail.tuitionFeePerYear", "Tuition Fee (per year)")}
              </th>
              <th className="text-right text-sm font-medium px-4 py-3" style={{ color: COLORS.textDark }}>
                {t("universityDetail.admissionFee", "Admission Fee")}
              </th>
              <th className="text-right text-sm font-medium px-4 py-3" style={{ color: COLORS.textDark }}>
                {t("universityDetail.otherFees", "Other Fees")}
              </th>
            </tr>
          </thead>
          <tbody>
            {structures.map((row) => (
              <tr
                key={row.id}
                className="border-t"
                style={{ borderColor: COLORS.border }}
              >
                <td className="text-sm px-4 py-3" style={{ color: COLORS.textDark }}>
                  {PROGRAM_TYPE_LABELS[row.programType] ?? row.programType}
                </td>
                <td className="text-sm text-right px-4 py-3" style={{ color: COLORS.textDark }}>
                  {formatFeeRange(row.tuitionFeePerYear, row.tuitionFeePerYearMax)}
                </td>
                <td className="text-sm text-right px-4 py-3" style={{ color: COLORS.textDark }}>
                  {formatFeeRange(row.admissionFee, row.admissionFeeMax)}
                </td>
                <td className="text-sm text-right px-4 py-3" style={{ color: COLORS.textDark }}>
                  {formatFeeRange(row.otherFees, row.otherFeesMax)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default FeesTab;
