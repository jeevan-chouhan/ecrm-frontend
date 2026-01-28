import { useState, useEffect, useRef, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { Tooltip } from "@mui/material";
import { COLORS } from "../../constants";
import { agencyService } from "../../services";
import type { CurrentSubscriptionData } from "../../services";
import { useAppSelector } from "../../redux/hooks";
import PricingContent from "../Pricing/PricingContent";
import { Spinner } from "../../assets";
import { formatDateShort, getDaysRemaining } from "../../utils/dateUtils";

const PlanManagement = () => {
  const { t } = useTranslation();
  const { user } = useAppSelector((state) => state.auth);
  const hasFetched = useRef(false);

  const [subscription, setSubscription] = useState<CurrentSubscriptionData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Fetch current subscription
  const fetchSubscription = useCallback(async (isRefresh = false) => {
    if (!user?.agencyId) return;
    
    if (isRefresh) {
      setIsRefreshing(true);
    } else {
      setIsLoading(true);
    }
    
    try {
      const response = await agencyService.getCurrentSubscription(user.agencyId!);
      if (response.status === "success" && response.data) {
        setSubscription(response.data);
      }
    } catch (error) {
      console.error("Failed to fetch subscription:", error);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [user?.agencyId]);

  // Fetch on mount
  useEffect(() => {
    if (hasFetched.current) return;
    hasFetched.current = true;
    fetchSubscription();
  }, [fetchSubscription]);

  // Handle refresh
  const handleRefresh = () => {
    fetchSubscription(true);
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

        {/* Right: Current Plan Info */}
        {!isLoading && subscription && (
          <div
            className="rounded-xl p-5 min-w-[320px] shrink-0"
            style={{
              backgroundColor: COLORS.surface,
              border: `1px solid ${COLORS.border}`,
              boxShadow: "0 4px 20px rgba(0, 0, 0, 0.05)",
            }}
          >
            {/* Plan Name with Billing Type Chip */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <span
                  className="text-lg font-bold"
                  style={{ color: COLORS.textDark }}
                >
                  {t("settingsPage.currentPlan", "Current Plan")}
                </span>
                {/* Billing Type Chip - show plan type */}
                {subscription.plan && (
                  <span
                    className="text-xs font-medium px-2.5 py-1 rounded-full"
                    style={{
                      backgroundColor: subscription.plan?.toLowerCase() === "trial" 
                        ? COLORS.accent 
                        : `${COLORS.accent}15`,
                      color: subscription.plan?.toLowerCase() === "trial" 
                        ? COLORS.surface 
                        : COLORS.accent,
                    }}
                  >
                    {subscription.plan?.toLowerCase() === "trial" 
                      ? "Trial" 
                      : subscription.plan?.toLowerCase().includes("pro") 
                        ? subscription.plan?.toLowerCase().includes("yearly") 
                          ? "Pro Yearly" 
                          : "Pro Monthly"
                        : subscription.plan?.toLowerCase().includes("prime")
                          ? subscription.plan?.toLowerCase().includes("yearly")
                            ? "Prime Yearly"
                            : "Prime Monthly"
                          : subscription.plan}
                  </span>
                )}
              </div>
              <Tooltip title={t("common.refresh", "Refresh")} arrow>
                <button
                  onClick={handleRefresh}
                  disabled={isRefreshing}
                  className="p-1.5 rounded-md transition-colors hover:bg-slate-100 disabled:opacity-50"
                  style={{ color: COLORS.accent }}
                  aria-label={t("common.refresh", "Refresh")}
                >
                  <Spinner className={`w-4 h-4 ${isRefreshing ? "animate-spin" : ""}`} />
                </button>
              </Tooltip>
            </div>
            
            <div className="space-y-2">
              {/* Status */}
              <div className="flex items-center justify-between">
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
              {subscription.renewsOn && (
                <div className="flex items-center justify-between">
                  <span className="text-sm" style={{ color: COLORS.textMuted }}>
                    {t("settingsPage.renewsOn", "Renews On")}
                  </span>
                  <span
                    className="text-sm font-semibold"
                    style={{ color: COLORS.textDark }}
                  >
                    {formatDateShort(subscription.renewsOn)}
                  </span>
                </div>
              )}

              {/* Applicants Registered */}
              {subscription.totalApplicants !== undefined && (
                <div className="flex items-center justify-between">
                  <span className="text-sm" style={{ color: COLORS.textMuted }}>
                    {t("settingsPage.applicantsRegistered", "Applicants Registered")}
                  </span>
                  <span
                    className="text-sm font-semibold"
                    style={{ color: COLORS.textDark }}
                  >
                    {subscription.applicantsRegistered ?? 0} / {subscription.totalApplicants}
                  </span>
                </div>
              )}

              {/* Trial Info */}
              {subscription.plan?.toLowerCase() === "trial" && subscription.renewsOn && (
                <div
                  className="mt-3 p-2 rounded-lg text-center"
                  style={{ backgroundColor: `${COLORS.warning}10` }}
                >
                  <span
                    className="text-sm font-medium"
                    style={{ color: COLORS.warning }}
                  >
                    Trial ends in {getDaysRemaining(subscription.renewsOn)} days
                  </span>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Pricing Cards - reuse PricingContent component */}
      <PricingContent 
        showHeader={false} 
        maxWidth="max-w-full" 
        subscription={subscription}
      />
    </div>
  );
};

export default PlanManagement;
