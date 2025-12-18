import { useState } from "react";
import { Link } from "react-router-dom";
import { Input, Button, Checkbox } from "../../../components";
import PublicLayout from "../../../components/wrapper/PublicLayout";
import { COLORS } from "../../../constants";
import { ROUTES } from "../../../constants";
import { isValidEmail, isValidPassword } from "../../../utils";

interface LoginFormData {
  email: string;
  password: string;
  rememberMe: boolean;
}

const Login = () => {
  const [formData, setFormData] = useState<LoginFormData>({
    email: "",
    password: "",
    rememberMe: false,
  });

  const [errors, setErrors] = useState<Partial<Record<keyof LoginFormData, string>>>({});

  // Check if form is valid
  const isFormValid = (): boolean => {
    const { email, password } = formData;

    if (!email.trim() || !isValidEmail(email)) return false;
    if (!password || !isValidPassword(password)) return false;

    return true;
  };

  const handleInputChange = (field: keyof LoginFormData, value: string | boolean) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    // Clear error when user types
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Partial<Record<keyof LoginFormData, string>> = {};

    if (!formData.email.trim()) {
      newErrors.email = "Email is required";
    } else if (!isValidEmail(formData.email)) {
      newErrors.email = "Invalid email format";
    }

    if (!formData.password) {
      newErrors.password = "Password is required";
    } else if (!isValidPassword(formData.password)) {
      newErrors.password = "Password must be at least 8 characters";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validateForm()) {
      console.log("Login submitted:", formData);
      // Handle login logic here
    }
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
            className="text-2xl md:text-3xl font-bold text-center mb-8"
            style={{ color: COLORS.textDark, fontFamily: "'Inter', sans-serif" }}
          >
            Login
          </h1>

          {/* Form Card */}
          <div
            className="rounded-2xl p-6 md:p-8"
            style={{
              backgroundColor: COLORS.surface,
              boxShadow: "0 4px 20px rgba(0, 0, 0, 0.08)",
            }}
          >
            <form onSubmit={handleSubmit}>
              <div className="space-y-5">
                <Input
                  label="Email"
                  type="email"
                  placeholder="example.email@gmail.com"
                  value={formData.email}
                  onChange={(e) => handleInputChange("email", e.target.value)}
                  error={errors.email}
                  fullWidth
                />

                <Input
                  label="Password"
                  type="password"
                  placeholder="Enter at least 8+ characters"
                  value={formData.password}
                  onChange={(e) => handleInputChange("password", e.target.value)}
                  error={errors.password}
                  fullWidth
                />
              </div>

              {/* Remember me & Forgot password */}
              <div className="flex items-center justify-between mt-5 mb-6">
                <div className="flex items-center gap-2">
                  <Checkbox
                    checked={formData.rememberMe}
                    onChange={(checked) => handleInputChange("rememberMe", checked)}
                  />
                  <span
                    className="text-sm"
                    style={{ color: COLORS.textDark, fontFamily: "'Inter', sans-serif" }}
                  >
                    Remember me
                  </span>
                </div>
                <Link
                  to={ROUTES.FORGOT_PASSWORD}
                  className="text-sm font-medium hover:underline"
                  style={{ color: COLORS.primary, fontFamily: "'Inter', sans-serif" }}
                >
                  Forgot password?
                </Link>
              </div>

              {/* Submit Button */}
              <Button
                type="submit"
                variant="accent"
                size="lg"
                fullWidth
                rounded
                disabled={!isFormValid()}
              >
                Log In
              </Button>
            </form>
          </div>

          {/* Register Link */}
          <p
            className="text-center mt-6 text-sm"
            style={{ color: COLORS.textMuted, fontFamily: "'Inter', sans-serif" }}
          >
            Does't have an account?{" "}
            <Link
              to={ROUTES.REGISTER}
              className="font-medium hover:underline"
              style={{ color: COLORS.primary }}
            >
              Register
            </Link>
          </p>
        </div>
      </div>
    </PublicLayout>
  );
};

export default Login;
