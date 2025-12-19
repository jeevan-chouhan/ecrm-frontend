import * as Yup from "yup";
import { REGEX } from "./regex";

// Type for translation function
type TranslationFunction = (key: string) => string;

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
        const digitsOnly = value.replace(/\D/g, "");
        return digitsOnly.length >= 10;
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

