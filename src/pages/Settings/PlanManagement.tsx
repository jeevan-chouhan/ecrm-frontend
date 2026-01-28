import { useState, useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import { COLORS } from "../../constants";
import { agencyService } from "../../services";
import type { CurrentSubscriptionData } from "../../services";
import { useAppSelector } from "../../redux/hooks";
import PricingContent from "../Pricing/PricingContent";

const PlanManagement = () => {
  const { t } = useTranslation();
  const { user } = useAppSelector((state) => state.auth);
  const hasFetched = useRef(false);

  const [subscription, setSubscription] = useState<CurrentSubscriptionData | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Fetch current subscription on mount
  useEffect(() => {
    if (!user?.agencyId || hasFetched.current) return;
    hasFetched.current = true;

    const fetchSubscription = async () => {
      setIsLoading(true);
      try {
        const response = await agencyService.getCurrentSubscription(user.agencyId!);
        if (response.status === "success" && response.data) {
          setSubscription(response.data);
        }
      } catch (error) {
        console.error("Failed to fetch subscription:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchSubscription();
  }, [user?.agencyId]);

  // Format date for display
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  // Get status color
  const getStatusColor = (status: string) => {
    switch (status?.toUpperCase()) {
      case "ACTIVE":
        return COLORS.success;
      case "EXPIRED":
      case "CANCELLED":
        return COLORS.error;
      case "PENDING":
        return COLORS.warning;
      default:
        return COLORS.textMuted;
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header with Subscription Info on the side */}
      <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4 mb-10">
        {/* Left: Title and Description */}
        <div className="text-center md:text-left">
          <h2
            className="text-2xl md:text-3xl font-bold mb-4"
            style={{ color: COLORS.textDark }}
          >
            {t("settingsPage.planManagement", "Plan Management")}
          </h2>
          <p
            className="text-base md:text-lg mb-4"
            style={{ color: COLORS.textMuted }}
          >
            {t("settingsPage.planManagementSubtitle", "Explore features included in your current plan. Upgrade anytime to unlock more capabilities.")}
          </p>
          <p className="text-xs" style={{ color: COLORS.textMuted }}>
            * Prices exclude applicable taxes (VAT/GST/Sales Tax), which will be calculated at checkout.
          </p>
        </div>

        {/* Right: Current Subscription Card */}
        {!isLoading && subscription && (
          <div
            className="rounded-xl p-5 min-w-[280px] shrink-0"
            style={{
              backgroundColor: COLORS.surface,
              border: `1px solid ${COLORS.border}`,
              boxShadow: "0 4px 20px rgba(0, 0, 0, 0.05)",
            }}
          >
            <h3
              className="text-base font-semibold mb-4"
              style={{ color: COLORS.textDark }}
            >
              {t("settingsPage.currentSubscription", "Current Subscription")}
            </h3>
            
            <div className="space-y-3">
              {/* Plan */}
              <div className="flex items-center justify-between gap-8">
                <span className="text-sm" style={{ color: COLORS.textMuted }}>
                  {t("settingsPage.plan", "Plan")}
                </span>
                <span
                  className="text-sm font-semibold"
                  style={{ color: COLORS.textDark }}
                >
                  {subscription.plan || "-"}
                </span>
              </div>

              {/* Status */}
              <div className="flex items-center justify-between gap-8">
                <span className="text-sm" style={{ color: COLORS.textMuted }}>
                  {t("settingsPage.status", "Status")}
                </span>
                <span
                  className="text-sm font-medium px-2 py-0.5 rounded-full"
                  style={{
                    color: getStatusColor(subscription.subscriptionStatus),
                    backgroundColor: `${getStatusColor(subscription.subscriptionStatus)}15`,
                  }}
                >
                  {subscription.subscriptionStatus}
                </span>
              </div>

              {/* Renews On */}
              <div className="flex items-center justify-between gap-8">
                <span className="text-sm" style={{ color: COLORS.textMuted }}>
                  {t("settingsPage.renewsOn", "Renews On")}
                </span>
                <span
                  className="text-sm font-semibold"
                  style={{ color: COLORS.textDark }}
                >
                  {subscription.renewsOn ? formatDate(subscription.renewsOn) : "-"}
                </span>
              </div>

              {/* Trial Used */}
              {subscription.trialUsed && (
                <div className="flex items-center justify-between gap-8">
                  <span className="text-sm" style={{ color: COLORS.textMuted }}>
                    {t("settingsPage.trialUsed", "Trial")}
                  </span>
                  <span
                    className="text-xs font-medium px-2 py-0.5 rounded-full"
                    style={{
                      color: COLORS.warning,
                      backgroundColor: `${COLORS.warning}15`,
                    }}
                  >
                    {t("settingsPage.trialUsedLabel", "Used")}
                  </span>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Pricing Cards - reuse PricingContent component */}
      <PricingContent showHeader={false} maxWidth="max-w-full" />
    </div>
  );
};

export default PlanManagement;
