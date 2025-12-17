import { useState } from "react";
import { Link } from "react-router-dom";
import { Input, Button, PhoneInput, Checkbox } from "../../../components";
import PublicLayout from "../../../components/wrapper/PublicLayout";
import { COLORS } from "../../../constants/COLORS";
import { ROUTES } from "../../../constants/ROUTES";
import { isValidEmail, isValidPassword, isValidPhone } from "../../../utils";

interface RegisterFormData {
  agencyName: string;
  fullName: string;
  email: string;
  password: string;
  confirmPassword: string;
  phone: string;
  agreeToTerms: boolean;
}

const Register = () => {
  const [formData, setFormData] = useState<RegisterFormData>({
    agencyName: "",
    fullName: "",
    email: "",
    password: "",
    confirmPassword: "",
    phone: "",
    agreeToTerms: false,
  });

  const [errors, setErrors] = useState<Partial<Record<keyof RegisterFormData, string>>>({});

  // Check if form is valid (all required fields filled and valid)
  const isFormValid = (): boolean => {
    const { agencyName, fullName, email, password, confirmPassword, phone, agreeToTerms } = formData;
    
    // Check all required fields are filled
    if (!agencyName.trim()) return false;
    if (!fullName.trim()) return false;
    if (!email.trim() || !isValidEmail(email)) return false;
    if (!password || !isValidPassword(password)) return false;
    if (password !== confirmPassword) return false;
    if (!isValidPhone(phone)) return false;
    if (!agreeToTerms) return false;
    
    return true;
  };

  const handleInputChange = (field: keyof RegisterFormData, value: string | boolean) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    // Clear error when user types
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  };

  const handlePhoneChange = (phone: string) => {
    setFormData((prev) => ({ ...prev, phone }));
    if (errors.phone) {
      setErrors((prev) => ({ ...prev, phone: undefined }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Partial<Record<keyof RegisterFormData, string>> = {};

    if (!formData.agencyName.trim()) {
      newErrors.agencyName = "Agency name is required";
    }
    if (!formData.fullName.trim()) {
      newErrors.fullName = "Full name is required";
    }
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
    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = "Passwords do not match";
    }
    if (!isValidPhone(formData.phone)) {
      newErrors.phone = "Valid phone number is required";
    }
    if (!formData.agreeToTerms) {
      newErrors.agreeToTerms = "You must agree to terms";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validateForm()) {
      console.log("Form submitted:", formData);
      // Handle registration logic here
    }
  };

  return (
    <PublicLayout>
      <div
        className="min-h-[calc(100vh-4rem)] flex items-center justify-center py-12 px-4"
        style={{ backgroundColor: COLORS.background }}
      >
        <div className="w-full max-w-4xl">
        {/* Title */}
        <h1
          className="text-2xl md:text-3xl font-bold text-center mb-8"
          style={{ color: COLORS.textDark, fontFamily: "'Inter', sans-serif" }}
        >
          Register Agency
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
            {/* Form Grid */}
            <div className="grid md:grid-cols-2 gap-6">
              {/* Left Column */}
              <div className="space-y-5">
                <Input
                  label="Agency Name"
                  placeholder="Abc"
                  value={formData.agencyName}
                  onChange={(e) => handleInputChange("agencyName", e.target.value)}
                  error={errors.agencyName}
                  fullWidth
                />

                <Input
                  label="Email"
                  type="email"
                  placeholder="abc@example.com"
                  value={formData.email}
                  onChange={(e) => handleInputChange("email", e.target.value)}
                  error={errors.email}
                  fullWidth
                />

                <PhoneInput
                  label="Contact Number"
                  value={formData.phone}
                  onChange={handlePhoneChange}
                  error={errors.phone}
                  placeholder="Enter phone number"
                  country="in"
                  fullWidth
                />
              </div>

              {/* Right Column */}
              <div className="space-y-5">
                <Input
                  label="Full Name"
                  placeholder="Efg"
                  value={formData.fullName}
                  onChange={(e) => handleInputChange("fullName", e.target.value)}
                  error={errors.fullName}
                  fullWidth
                />

                <Input
                  label="Password"
                  type="password"
                  placeholder="8 char (capital,number,special char)"
                  value={formData.password}
                  onChange={(e) => handleInputChange("password", e.target.value)}
                  error={errors.password}
                  fullWidth
                />

                <Input
                  label="Confirm Password"
                  type="password"
                  placeholder="8 char (capital,number,special char)"
                  value={formData.confirmPassword}
                  onChange={(e) => handleInputChange("confirmPassword", e.target.value)}
                  error={errors.confirmPassword}
                  fullWidth
                />
              </div>
            </div>

            {/* Footer Section */}
            <div className="mt-8 flex flex-col items-center">
              {/* Already have account */}
              <p
                className="text-sm mb-3"
                style={{ color: COLORS.textMuted, fontFamily: "'Inter', sans-serif" }}
              >
                Already have an account?{" "}
                <Link
                  to={ROUTES.LOGIN}
                  className="font-medium hover:underline"
                  style={{ color: COLORS.primary }}
                >
                  Login
                </Link>
              </p>

              {/* Terms and Conditions */}
              <div className="flex items-start gap-2 mb-2">
                <Checkbox
                  checked={formData.agreeToTerms}
                  onChange={(checked) => handleInputChange("agreeToTerms", checked)}
                />
                <span
                  className="text-sm"
                  style={{ color: COLORS.textDark, fontFamily: "'Inter', sans-serif" }}
                >
                  <span style={{ color: COLORS.error }}>*</span>Agree to Terms and Conditions
                </span>
              </div>

              {/* Terms Link */}
              <p
                className="text-sm mb-6"
                style={{ color: COLORS.textMuted, fontFamily: "'Inter', sans-serif" }}
              >
                To read terms and conditions{" "}
                <Link
                  to={ROUTES.TERMS_AND_CONDITIONS}
                  className="font-medium hover:underline"
                  style={{ color: COLORS.primary }}
                  // target="_blank"
                >
                  Click Here
                </Link>
              </p>

              {/* Submit Button */}
              <Button type="submit" variant="accent" size="lg" rounded disabled={!isFormValid()}>
                REGISTER
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
    </PublicLayout>
  );
};

export default Register;
