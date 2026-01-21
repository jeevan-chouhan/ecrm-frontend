// Types for University Detail
export interface Course {
  id: number;
  name: string;
  level: string;
  duration: string;
  tuitionFees: string;
  examsAccepted: string[];
}

export interface FeeItem {
  label: string;
  amount: string;
}

export interface AdmissionStep {
  step: number;
  title: string;
  description: string;
}

export interface ScholarshipItem {
  name: string;
  amount: string;
  eligibility: string;
}

export interface UniversityDetail {
  id: number;
  name: string;
  shortName?: string;
  location: string;
  country: string;
  bannerImage?: string;
  logoImage?: string;
  website?: string;
  description?: string;
  highlights?: string[];
  courses: Course[];
  eligibilityItems?: string[];
  campusInfo?: string;
  campusHighlights?: string[];
  fees: FeeItem[];
  admissionSteps: AdmissionStep[];
  documents?: string[];
  scholarships: ScholarshipItem[];
}

// Tab types - Logical sequence following student journey
export type TabType = "collegeInfo" | "courses" | "fees" | "scholarship" | "eligibility" | "admissions" | "documents" | "campus";

export interface Tab {
  id: TabType;
  labelKey: string;
  defaultLabel: string;
}
