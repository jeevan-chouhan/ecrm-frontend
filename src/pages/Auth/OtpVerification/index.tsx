import { useState, useRef, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Button } from "../../../components";
import PublicLayout from "../../../components/wrapper/PublicLayout";
import { COLORS, ROUTES } from "../../../constants";

const OTP_LENGTH = 6;
const RESEND_TIMER = 300; // 5 minutes in seconds

const OtpVerification = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [otp, setOtp] = useState<string[]>(Array(OTP_LENGTH).fill(""));
  const [timer, setTimer] = useState(RESEND_TIMER);
  const [canResend, setCanResend] = useState(false);
  const [error, setError] = useState("");
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Timer countdown
  useEffect(() => {
    if (timer > 0) {
      const interval = setInterval(() => {
        setTimer((prev) => prev - 1);
      }, 1000);
      return () => clearInterval(interval);
    } else {
      setCanResend(true);
    }
  }, [timer]);

  // Format timer as MM:SS
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const handleChange = (index: number, value: string) => {
    if (error) setError("");

    // Only allow digits
    if (value && !/^\d$/.test(value)) return;

    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    // Move to next input
    if (value && index < OTP_LENGTH - 1) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    // Move to previous input on backspace
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData("text").slice(0, OTP_LENGTH);
    if (!/^\d+$/.test(pastedData)) return;

    const newOtp = [...otp];
    pastedData.split("").forEach((char, index) => {
      if (index < OTP_LENGTH) newOtp[index] = char;
    });
    setOtp(newOtp);

    // Focus last filled input or last input
    const lastIndex = Math.min(pastedData.length, OTP_LENGTH) - 1;
    inputRefs.current[lastIndex]?.focus();
  };

  const isOtpComplete = otp.every((digit) => digit !== "");

  const handleVerify = () => {
    if (!isOtpComplete) {
      setError(t("validation.otpRequired"));
      return;
    }

    const otpValue = otp.join("");
    console.log("Verifying OTP:", otpValue);
    // Handle OTP verification logic here
    navigate(ROUTES.RESET_PASSWORD);
  };

  const handleResendOtp = () => {
    if (!canResend) return;

    console.log("Resending OTP...");
    // Handle resend OTP logic here
    setTimer(RESEND_TIMER);
    setCanResend(false);
    setOtp(Array(OTP_LENGTH).fill(""));
  };

  return (
    <PublicLayout>
      <div
        className="min-h-[calc(100vh-4rem)] flex items-center justify-center py-12 px-4"
        style={{ backgroundColor: COLORS.background }}
      >
        <div className="w-full max-w-md">
          {/* Title */}
          <h1
            className="text-2xl md:text-3xl font-bold text-center mb-3"
            style={{ color: COLORS.textDark }}
          >
            {t("auth.otpVerification")}
          </h1>

          {/* Subtitle */}
          <p className="text-center mb-6" style={{ color: COLORS.textMuted }}>
            {t("auth.enterVerificationCode")}
          </p>

          {/* Info Box */}
          <div
            className="rounded-xl p-4 mb-8"
            style={{
              backgroundColor: `${COLORS.success}10`,
              border: `1px solid ${COLORS.success}30`,
            }}
          >
            <p
              className="text-sm text-center"
              style={{ color: COLORS.success }}
            >
              {t("auth.otpSentMessage")}
            </p>
          </div>

          {/* Form Card */}
          <div
            className="rounded-2xl p-6 md:p-8"
            style={{
              backgroundColor: COLORS.surface,
              boxShadow: "0 4px 20px rgba(0, 0, 0, 0.08)",
            }}
          >
            {/* Verification Code Label */}
            <p
              className="text-sm font-semibold text-center mb-4"
              style={{ color: COLORS.textDark }}
            >
              {t("auth.verificationCode")}
            </p>

            {/* OTP Input Boxes */}
            <div className="flex justify-center gap-2 md:gap-3 mb-2">
              {otp.map((digit, index) => (
                <input
                  key={index}
                  ref={(el) => { inputRefs.current[index] = el; }}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handleChange(index, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(index, e)}
                  onPaste={handlePaste}
                  className="w-10 h-12 md:w-12 md:h-14 text-center text-xl font-semibold rounded-xl outline-none transition-all"
                  style={{
                    border: `2px solid ${error ? COLORS.error : digit ? COLORS.accent : COLORS.border}`,
                    color: COLORS.textDark,
                  }}
                  onFocus={(e) => {
                    e.target.style.borderColor = COLORS.accent;
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = digit ? COLORS.accent : COLORS.border;
                  }}
                />
              ))}
            </div>

            {/* Error Message */}
            {error && (
              <p className="text-sm text-center mb-4" style={{ color: COLORS.error }}>
                {error}
              </p>
            )}

            {/* Verify Button */}
            <div className="mt-6 flex justify-center">
              <Button
                variant="accent"
                size="lg"
                rounded
                onClick={handleVerify}
                disabled={!isOtpComplete}
              >
                {t("auth.verify")}
              </Button>
            </div>

            {/* Resend OTP */}
            <div className="mt-6 text-center">
              <p className="text-sm mb-3" style={{ color: COLORS.textMuted }}>
                {t("auth.resendOtpIn")}{" "}
                <span style={{ color: COLORS.accent, fontWeight: 600 }}>
                  {formatTime(timer)}
                </span>
              </p>
              <Button
                variant="ghost"
                size="md"
                onClick={handleResendOtp}
                disabled={!canResend}
              >
                {t("auth.resendOtp")}
              </Button>
            </div>
          </div>

          {/* Back to Login */}
          <div className="mt-6 text-center">
            <Link
              to={ROUTES.LOGIN}
              className="text-sm font-medium hover:underline"
              style={{ color: COLORS.accent }}
            >
              {t("auth.backToLogin")}
            </Link>
          </div>
        </div>
      </div>
    </PublicLayout>
  );
};

export default OtpVerification;

