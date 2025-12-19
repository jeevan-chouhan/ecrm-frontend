import type { SelectOption } from "../components";

export * from "./colors";
export * from "./routes";
export * from "./mockData";

export const enrollmentTypes: SelectOption[] = [
    { value: "walk-in", label: "Walk-in" },
    { value: "referred-to-agency", label: "Referred to Agency Partner" },
    { value: "referred-by-agency", label: "Referred by Agency Partner" },
  ];

export const genderTypes: SelectOption[] = [
    { value: "male", label: "Male" },
    { value: "female", label: "Female" },
    { value: "other", label: "Other" },
  ];
