import * as Yup from "yup";
import { REGEX, extractDigits } from "./regex";

// Type for translation function - compatible with i18next TFunction
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type TranslationFunction = (key: string, defaultValue?: any) => string;

// Login form validation schema
export const getLoginSchema = (t: TranslationFunction) =>
  Yup.object().shape({
    email: Yup.string()
      .required(t("validation.emailRequired"))
      .matches(REGEX.EMAIL, t("validation.emailInvalid")),
    password: Yup.string()
      .required(t("validation.passwordRequired"))
      .min(8, t("validation.passwordMin")),
    rememberMe: Yup.boolean(),
  });

// Register form validation schema
export const getRegisterSchema = (t: TranslationFunction) =>
  Yup.object().shape({
    agencyName: Yup.string().required(t("validation.agencyNameRequired")),
    fullName: Yup.string().required(t("validation.fullNameRequired")),
    brandName: Yup.string().required(t("validation.brandNameRequired")),
    email: Yup.string()
      .required(t("validation.emailRequired"))
      .matches(REGEX.EMAIL, t("validation.emailInvalid")),
    password: Yup.string()
      .required(t("validation.passwordRequired"))
      .min(8, t("validation.passwordMin")),
    confirmPassword: Yup.string()
      .required(t("validation.confirmPasswordRequired"))
      .oneOf([Yup.ref("password")], t("validation.passwordMatch")),
    phone: Yup.string()
      .required(t("validation.phoneRequired"))
      .test("phone-valid", t("validation.phoneInvalid"), (value) => {
        if (!value) return false;
        return extractDigits(value).length >= 10;
      }),
    agreeToTerms: Yup.boolean().oneOf([true], t("validation.agreeToTermsRequired")),
  });

// Forgot password form validation schema
export const getForgotPasswordSchema = (t: TranslationFunction) =>
  Yup.object().shape({
    email: Yup.string()
      .required(t("validation.emailRequired"))
      .matches(REGEX.EMAIL, t("validation.emailInvalid")),
  });

// Reset password form validation schema
export const getResetPasswordSchema = (t: TranslationFunction) =>
  Yup.object().shape({
    password: Yup.string()
      .required(t("validation.passwordRequired"))
      .min(8, t("validation.passwordMin")),
    confirmPassword: Yup.string()
      .required(t("validation.confirmPasswordRequired"))
      .oneOf([Yup.ref("password")], t("validation.passwordMatch")),
  });

// Add/Edit Team Member validation schema
interface TeamMemberValidationOptions {
  role: string;
  isEditMode: boolean;
}

export const getTeamMemberSchema = (
  t: TranslationFunction,
  options: TeamMemberValidationOptions
) => {
  const { role, isEditMode } = options;

  // Base schema fields
  const baseSchema: Record<string, Yup.Schema> = {
    name: Yup.string()
      .trim()
      .min(2, t("validation.nameMinLength"))
      .required(t("validation.nameRequired")),
    email: Yup.string()
      .trim()
      .email(t("validation.invalidEmail"))
      .required(t("validation.emailRequired")),
    contactNumber: Yup.string()
      .min(8, t("validation.contactMinLength"))
      .required(t("validation.contactRequired")),
    role: Yup.string().required(t("validation.roleRequired")),
    assignedCountries: Yup.array()
      .min(1, t("validation.countryRequired"))
      .required(t("validation.assignedCountryRequired")),
    assignedUniversities: Yup.array()
      .min(1, t("validation.universityRequired"))
      .required(t("validation.assignedUniversityRequired")),
  };

  // Add password validation for new members only
  if (!isEditMode) {
    baseSchema.password = Yup.string()
      .min(8, t("validation.passwordMinLength"))
      .matches(/[A-Z]/, t("validation.passwordUppercase"))
      .matches(/[a-z]/, t("validation.passwordLowercase"))
      .matches(/[0-9]/, t("validation.passwordNumber"))
      .matches(/[@$!%*?&#]/, t("validation.passwordSpecial"))
      .required(t("validation.passwordRequired"));
  }

  // Role-based validation - add admin/manager requirements
  const roleRequirements: Record<string, Yup.Schema> = {};
  if (role === "counselor" || role === "manager" || role === "billing") {
    roleRequirements.adminId = Yup.string().required(t("validation.adminRequired"));
  }
  if (role === "counselor") {
    roleRequirements.managerId = Yup.string().required(t("validation.managerRequired"));
  }

  return Yup.object().shape({ ...baseSchema, ...roleRequirements });
};
