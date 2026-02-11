import { useEffect, useState, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Layout, Button, Popup } from "../../components";
import { COLORS, ROUTES, UserRole } from "../../constants";
import { useAppSelector, useAppDispatch } from "../../redux/hooks";
import { agencyService } from "../../services";
import type { CurrentSubscriptionData, PaymentLinksData } from "../../services";
import { showLoader, hideLoader } from "../../redux/slices/loader/loaderSlice";
import { addToast } from "../../redux/slices/toast/toastSlice";
import ApplicantOverview from "./ApplicantOverview";

const Dashboard = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { accessToken, user } = useAppSelector((state) => state.auth);
  const [subscription, setSubscription] = useState<CurrentSubscriptionData | null>(null);
  const [showUpgradePopup, setShowUpgradePopup] = useState(false);
  const [paymentLinks, setPaymentLinks] = useState<PaymentLinksData | null>(null);
  const hasFetchedSubscription = useRef(false);

  // Fetch current subscription
  const fetchSubscription = useCallback(async () => {
    if (!user?.agencyId || hasFetchedSubscription.current) return;
    hasFetchedSubscription.current = true;

    try {
      const response = await agencyService.getCurrentSubscription(user.agencyId);
      if (response.status === "success" && response.data) {
        setSubscription(response.data);
      }
    } catch (error) {
      console.error("Failed to fetch subscription:", error);
    }
  }, [user?.agencyId]);

  // Fetch payment links
  const fetchPaymentLinks = useCallback(async () => {
    if (!user?.agencyId) return;

    try {
      const response = await agencyService.getPaymentLinks(user.agencyId);
      if (response.status === "success" && response.data) {
        setPaymentLinks(response.data);
      }
    } catch (error) {
      console.error("Failed to fetch payment links:", error);
    }
  }, [user?.agencyId]);

  // Fetch subscription on mount
  useEffect(() => {
    fetchSubscription();
  }, [fetchSubscription]);

  // Check if applicant limit is reached using API data (only if subscription data is available)
  const totalApplicants = subscription?.totalApplicants;
  const applicantsRegistered = subscription?.applicantsRegistered ?? 0;
  const isApplicantLimitReached = totalApplicants !== undefined && 
    applicantsRegistered !== undefined && 
    totalApplicants > 0 && // Only check limit if there's an actual limit set
    applicantsRegistered >= totalApplicants;
  
  // Check if user is counselor
  const isCounsellor = user?.role?.toUpperCase() === UserRole.COUNSELLOR;

  // Decode and log access token on dashboard load (for debugging)
  useEffect(() => {
    if (import.meta.env.DEV && accessToken) {
      try {
        // JWT token has 3 parts: header.payload.signature
        const tokenParts = accessToken.split('.');
        if (tokenParts.length === 3) {
          const decodedPayload = JSON.parse(atob(tokenParts[1]));
          console.log('=== Dashboard - Decoded Access Token ===');
          console.log('Token:', accessToken);
          console.log('Decoded Payload:', decodedPayload);
          console.log('User from Redux:', user);
          console.log('=========================================');
        }
      } catch (decodeError) {
        console.error('Failed to decode token:', decodeError);
      }
    }
  }, [accessToken, user]);

  const handleAddApplicant = () => {
    if (isApplicantLimitReached) {
      // Fetch payment links and show upgrade popup
      fetchPaymentLinks();
      setShowUpgradePopup(true);
    } else {
      navigate(ROUTES.CREATE_APPLICANT);
    }
  };

  // Handle upgrade button click
  const handleUpgradeClick = async (linkType: keyof PaymentLinksData) => {
    const link = paymentLinks?.[linkType];
    if (link) {
      window.open(link, "_blank");
      setShowUpgradePopup(false);
    } else {
      // If links not loaded yet, fetch and then open
      dispatch(showLoader());
      try {
        const response = await agencyService.getPaymentLinks(user!.agencyId!);
        if (response.status === "success" && response.data) {
          const fetchedLink = response.data[linkType];
          if (fetchedLink) {
            window.open(fetchedLink, "_blank");
            setShowUpgradePopup(false);
          } else {
            dispatch(addToast({ type: "error", message: t("pricing.linkNotAvailable", "Payment link not available") }));
          }
        }
      } catch (error) {
        console.error("Failed to get payment links:", error);
        dispatch(addToast({ type: "error", message: t("pricing.paymentLinkFailed", "Failed to get payment link") }));
      } finally {
        dispatch(hideLoader());
      }
    }
  };

  return (
    <Layout>
      <div
        className="bg-white rounded-lg shadow-sm p-4 md:p-6 space-y-6"
        style={{ backgroundColor: COLORS.surface }}
      >
        {/* Title Row - Dashboard on left, Add Applicant on right */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <h1
            className="text-xl md:text-2xl font-bold"
            style={{ color: COLORS.textDark }}
          >
            {t("dashboard.title", "Dashboard")}
          </h1>
          {/* Hide Add Applicant button for counselors */}
          {!isCounsellor && (
            <Button 
              variant="accent" 
              size="md" 
              rounded 
              onClick={handleAddApplicant}
            >
              {t("dashboard.addApplicant", "Add Applicant")}
            </Button>
          )}
        </div>

        {/* Applicant Overview Section */}
        <ApplicantOverview />
      </div>

      {/* Upgrade Plan Popup */}
      <Popup
        isOpen={showUpgradePopup}
        onClose={() => setShowUpgradePopup(false)}
        title={t("dashboard.currentPlanUpgrade", "Current Plan Upgrade")}
        size="sm"
      >
        <div className="text-center py-4">
          <p className="text-base mb-6" style={{ color: COLORS.textMuted }}>
            {t("dashboard.applicantLimitMessage", "Applicant limit reached. Please upgrade your plan.")}
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button
              variant="accent"
              size="md"
              rounded
              onClick={() => handleUpgradeClick("agencyPrimeLink")}
            >
              {t("pricing.primeMonthly", "Prime Monthly")}
            </Button>
            <Button
              variant="accent"
              size="md"
              rounded
              onClick={() => handleUpgradeClick("agencyPrimeYearlyLink")}
            >
              {t("pricing.primeYearly", "Prime Yearly")}
            </Button>
          </div>
        </div>
      </Popup>
    </Layout>
  );
};

export default Dashboard;
