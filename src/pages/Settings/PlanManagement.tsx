import { useTranslation } from "react-i18next";
import { COLORS, typography } from "../../constants";
import PricingContent from "../Pricing/PricingContent";

const PlanManagement = () => {
  const { t } = useTranslation();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2
          className="text-lg font-semibold"
          style={{
            color: COLORS.textDark,
            fontSize: typography.fontSize.h3,
            fontWeight: typography.fontWeight.semibold,
          }}
        >
          {t("settingsPage.planManagement", "Plan Management")}
        </h2>
        <p style={{ color: COLORS.textMuted }}>
          {t("settingsPage.planManagementSubtitle", "Explore features included in your current plan. Upgrade anytime to unlock more capabilities.")}
        </p>
        <p className="text-xs mt-1" style={{ color: COLORS.textMuted }}>
          * Prices exclude applicable taxes (VAT/GST/Sales Tax), which will be calculated at checkout.
        </p>
      </div>

      {/* Pricing Cards - reuse PricingContent component */}
      <PricingContent showHeader={false} maxWidth="max-w-4xl" />
    </div>
  );
};

export default PlanManagement;
