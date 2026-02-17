// Types for University Detail
export interface Course {
  id: number;
  name: string;
  level: string;
  duration: string;
  tuitionFees: string;
  examsAccepted: string[];
  degreeType?: string;
  department?: string;
  credits?: number;
  description?: string;
}

export interface FeeItem {
  label: string;
  amount: string;
}

// Program type for fee structure
export type ProgramType = "BACHELOR" | "MASTER" | "PHD";

// Fee Structure for courses (by program type) - fees can be single amount or range (min/max)
export interface FeeStructure {
  id: number;
  programType: ProgramType;
  courseProgram: string;
  tuitionFeePerYear: number;
  tuitionFeePerYearMax?: number;
  admissionFee: number;
  admissionFeeMax?: number;
  hostelFeePerYear: number;
  otherFees: number;
  otherFeesMax?: number;
  totalFeePerYear: number;
}

// College/Campus Information
export interface CollegeInfo {
  campusName: string;
  dliNumber?: string;
  officialWebsite?: string;
  location?: string;
  city: string;
  state: string;
  email?: string;
  phone?: string;
  description?: string;
}

export interface AdmissionStep {
  step: number;
  title: string;
  description: string;
}

// Admission details by program type (Program Type | Admission Procedure table)
export interface AdmissionDetailsItem {
  programType: string;
  admissionProcedure: string;
}

// Eligibility criteria by program type (Program Type | Description table)
export interface EligibilityCriteriaItem {
  programType: string;
  description: string[]; // bullet points or lines
}

export interface ScholarshipItem {
  name: string;
  amount: string;
  eligibility: string;
}

// Program-specific documents by program type (Program Type | Program Specific Documents table)
export interface ProgramDocumentsItem {
  programType: string;
  documents: string[];
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
  eligibilityCriteria?: EligibilityCriteriaItem[];
  campusInfo?: string;
  campusHighlights?: string[];
  fees: FeeItem[];
  admissionSteps: AdmissionStep[];
  admissionDetails?: AdmissionDetailsItem[];
  documents?: string[];
  programSpecificDocuments?: ProgramDocumentsItem[];
  scholarships: ScholarshipItem[];
  // New fields for College Info tab
  collegeInfo?: CollegeInfo;
  feeStructures?: FeeStructure[];
}

// Tab types - Logical sequence following student journey
export type TabType = "collegeInfo" | "fees" | "scholarship" | "eligibility" | "admissions" | "documents" | "campus";

export interface Tab {
  id: TabType;
  labelKey: string;
  defaultLabel: string;
}
