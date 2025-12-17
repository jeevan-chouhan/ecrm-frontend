import { useState } from "react";
import { Link } from "react-router-dom";
import { Input, Button } from "../../../components";
import PublicLayout from "../../../components/wrapper/PublicLayout";
import { COLORS, ROUTES } from "../../../constants";
import { isValidEmail } from "../../../utils";

const ForgotPassword = () => {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");

  const isFormValid = (): boolean => {
    return email.trim() !== "" && isValidEmail(email);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!email.trim()) {
      setError("Email is required");
      return;
    }

    if (!isValidEmail(email)) {
      setError("Invalid email format");
      return;
    }

    console.log("Password reset requested for:", email);
    // Handle forgot password logic here
  };

  const handleEmailChange = (value: string) => {
    setEmail(value);
    if (error) setError("");
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
            style={{ color: COLORS.textDark, fontFamily: "'Inter', sans-serif" }}
          >
            Forgot Password
          </h1>

          {/* Subtitle */}
          <p
            className="text-center mb-8"
            style={{ color: COLORS.textMuted, fontFamily: "'Inter', sans-serif" }}
          >
            verification code will be sent on your email
          </p>

          {/* Form Card */}
          <div
            className="rounded-2xl p-6 md:p-8"
            style={{
              backgroundColor: COLORS.surface,
              boxShadow: "0 4px 20px rgba(0, 0, 0, 0.08)",
            }}
          >
            <form onSubmit={handleSubmit}>
              <Input
                label="Email"
                type="email"
                placeholder="example.email@gmail.com"
                value={email}
                onChange={(e) => handleEmailChange(e.target.value)}
                error={error}
                fullWidth
              />

              {/* Submit Button */}
              <div className="mt-8">
                <Button
                  type="submit"
                  variant="accent"
                  size="lg"
                  fullWidth
                  rounded
                  disabled={!isFormValid()}
                >
                  Request Password Reset
                </Button>
              </div>

              {/* Back to Login */}
              <div className="mt-4 text-center">
                <Link
                  to={ROUTES.LOGIN}
                  className="text-sm font-medium hover:underline inline-flex items-center gap-1"
                  style={{ color: COLORS.textMuted, fontFamily: "'Inter', sans-serif" }}
                >
                  ← Back to login
                </Link>
              </div>
            </form>
          </div>
        </div>
      </div>
    </PublicLayout>
  );
};

export default ForgotPassword;
