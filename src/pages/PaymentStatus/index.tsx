import { useSearchParams, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useEffect, useState, useMemo, useCallback } from "react";
import PublicLayout from "../../components/wrapper/PublicLayout";
import { SuccessCircle, ErrorCircle, WarningCircle } from "../../assets";
import { COLORS, ROUTES, shadows } from "../../constants";

type PaymentStatus = "success" | "failure" | "pending";

const PaymentStatus = () => {
  const { t } = useTranslation();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [isButtonHovered, setIsButtonHovered] = useState(false);
  
  const status = (searchParams.get("status") || "pending") as PaymentStatus;

  // Validate status
  useEffect(() => {
    if (!["success", "failure", "pending"].includes(status)) {
      // If invalid status, default to pending
      navigate(`/payment-status?status=pending`, { replace: true });
    }
  }, [status, navigate]);

  // Memoize button actions to prevent recreation on every render
  const handleSuccessAction = useCallback(() => {
    navigate(ROUTES.LOGIN);
  }, [navigate]);

  const handleFailureAction = useCallback(() => {
    // Check if payment gateway URL is provided in query params
    const paymentUrl = searchParams.get("paymentUrl");
    if (paymentUrl) {
      // Redirect to payment gateway
      window.location.href = paymentUrl;
    } else {
      // Redirect to pricing page to retry payment
      navigate(ROUTES.PRICING);
    }
  }, [searchParams, navigate]);

  const handlePendingAction = useCallback(() => {
    navigate(ROUTES.HOME);
  }, [navigate]);

  // Memoize status configuration to prevent unnecessary recalculations
  const config = useMemo(() => {
    switch (status) {
      case "success":
        return {
          IconComponent: SuccessCircle,
          title: t("paymentStatus.successTitle", "Payment Success!"),
          message: t("paymentStatus.successMessage", "Your Registration Has Been Completed Successfully. Confirmation And Login Credentials Sent To Your Email"),
          messageLine1: t("paymentStatus.successMessageLine1", "Your Registration Has Been Completed Successfully."),
          messageLine2: t("paymentStatus.successMessageLine2", "Confirmation And Login Credentials Sent To Your Email"),
          buttonText: t("auth.login", "Login"),
          buttonAction: handleSuccessAction,
          iconBgColor: COLORS.success,
          iconColor: COLORS.success,
          isMultiLine: true,
        };
      case "failure":
        return {
          IconComponent: ErrorCircle,
          title: t("paymentStatus.failureTitle", "Payment Failed"),
          message: t("paymentStatus.failureMessage", "It seems we have not received money"),
          buttonText: t("paymentStatus.tryAgain", "Try Again"),
          buttonAction: handleFailureAction,
          iconBgColor: COLORS.error,
          iconColor: COLORS.error,
          isMultiLine: false,
        };
      case "pending":
        return {
          IconComponent: WarningCircle,
          title: t("paymentStatus.pendingTitle", "Payment Pending"),
          message: t("paymentStatus.pendingMessage", "Your payment is being processed. Please wait for confirmation"),
          messageLine1: t("paymentStatus.pendingMessageLine1", "Your Payment Is Being Processed. Please Wait For Confirmation"),
          messageLine2: t("paymentStatus.pendingMessageLine2", "Once Payment Confirmed We Will Send You Mail"),
          buttonText: t("common.continue", "Continue"),
          buttonAction: handlePendingAction,
          iconBgColor: COLORS.warning,
          iconColor: COLORS.warning,
          isMultiLine: true,
        };
      default:
        return {
          IconComponent: WarningCircle,
          title: t("paymentStatus.pendingTitle", "Payment Pending"),
          message: t("paymentStatus.pendingMessage", "Your payment is being processed. Please wait for confirmation"),
          messageLine1: t("paymentStatus.pendingMessageLine1", "Your Payment Is Being Processed. Please Wait For Confirmation"),
          messageLine2: t("paymentStatus.pendingMessageLine2", "Once Payment Confirmed We Will Send You Mail"),
          buttonText: t("common.continue", "Continue"),
          buttonAction: handlePendingAction,
          iconBgColor: COLORS.warning,
          iconColor: COLORS.warning,
          isMultiLine: true,
        };
    }
  }, [status, t, handleSuccessAction, handleFailureAction, handlePendingAction]);

  // Memoize icon element to prevent recreation
  const iconElement = useMemo(() => {
    const Icon = config.IconComponent;
    return <Icon className="w-20 h-20" style={{ color: config.iconColor }} />;
  }, [config.IconComponent, config.iconColor]);

  return (
    <PublicLayout>
      <div
        className="min-h-[calc(100vh-4rem)] flex items-center justify-center py-12 px-4"
        style={{
          background: "linear-gradient(135deg, #E8F5E9 0%, #C8E6C9 100%)",
        }}
      >
        <div
          className="w-full max-w-md rounded-2xl p-8 md:p-10"
          style={{
            backgroundColor: COLORS.surface,
            boxShadow: shadows.card,
          }}
        >
          {/* Icon */}
          <div className="flex justify-center mb-6">
            <div
              className="rounded-full p-4 flex items-center justify-center"
              style={{
                backgroundColor: `${config.iconBgColor}15`,
              }}
            >
              {iconElement}
            </div>
          </div>

          {/* Title */}
          <h1
            className="text-2xl md:text-3xl font-bold text-center mb-4"
            style={{ color: COLORS.textDark }}
          >
            {config.title}
          </h1>

          {/* Message */}
          <div
            className="text-center mb-8 text-base"
            style={{ color: COLORS.textMuted }}
          >
            {config.isMultiLine && config.messageLine1 && config.messageLine2 ? (
              <>
                <p className="mb-2">{config.messageLine1}</p>
                <p>{config.messageLine2}</p>
              </>
            ) : (
              <p>{config.message}</p>
            )}
          </div>

          {/* Action Button */}
          <button
            onClick={config.buttonAction}
            onMouseEnter={() => setIsButtonHovered(true)}
            onMouseLeave={() => setIsButtonHovered(false)}
            className="w-full rounded-full font-medium text-sm transition-all duration-200 focus:outline-none"
            style={{
              padding: "16px 28px",
              border: `2px solid ${config.iconBgColor}`,
              backgroundColor: isButtonHovered ? config.iconBgColor : "transparent",
              color: isButtonHovered ? COLORS.textWhite : config.iconBgColor,
            }}
          >
            {config.buttonText}
          </button>
        </div>
      </div>
    </PublicLayout>
  );
};

export default PaymentStatus;

