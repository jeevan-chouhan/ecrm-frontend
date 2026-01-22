import { useTranslation } from "react-i18next";
import { COLORS } from "../../../../constants";
import type { UniversityDetail } from "../types";

interface FeesTabProps {
  university: UniversityDetail;
}

const FeesTab = ({ university }: FeesTabProps) => {
  const { t } = useTranslation();

  return (
    <div className="space-y-4">
      <h3 className="font-semibold text-lg mb-3" style={{ color: COLORS.textDark }}>
        {t("universityDetail.feesStructure", "Fees Structure")}
      </h3>
      
      <div className="rounded-lg overflow-hidden border" style={{ borderColor: COLORS.border }}>
        <table className="w-full">
          <thead>
            <tr style={{ backgroundColor: COLORS.background }}>
              <th className="text-left text-sm font-medium px-4 py-3" style={{ color: COLORS.textDark }}>
                {t("universityDetail.feeType", "Fee Type")}
              </th>
              <th className="text-right text-sm font-medium px-4 py-3" style={{ color: COLORS.textDark }}>
                {t("universityDetail.amount", "Amount")}
              </th>
            </tr>
          </thead>
          <tbody>
            {university.fees.map((fee, index) => (
              <tr
                key={index}
                className="border-t"
                style={{ borderColor: COLORS.border }}
              >
                <td className="text-sm px-4 py-3" style={{ color: COLORS.textMuted }}>
                  {fee.label}
                </td>
                <td className="text-sm font-medium text-right px-4 py-3" style={{ color: COLORS.textDark }}>
                  {fee.amount}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      
      <p className="text-xs" style={{ color: COLORS.textMuted }}>
        * {t("universityDetail.feesDisclaimer", "Fees are subject to change. Please verify on official website.")}
      </p>
    </div>
  );
};

export default FeesTab;
