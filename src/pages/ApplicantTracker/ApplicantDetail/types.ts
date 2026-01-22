// Shared types for Applicant Detail View

export interface UniversityApplication {
  id: string;
  no: number;
  university: string;
  country: string;
  course: string;
  applicationStage: string;
  status: string;
  intake: string;
  counselor: string;
  agencyPartner: string;
  appliedDate: string;
  lastUpdated: string;
}

export interface PersonalDetails {
  profilePhoto?: string | null; // URL or base64 string
  enrollmentType?: string;
  name?: string;
  dateOfBirth?: string | Date | null;
  gender?: string;
  countryCode?: string;
  contactNumber?: string;
  emailId?: string;
  permanentAddress?: string;
  notes?: string;
}

export interface EducationalDetails {
  highestQualification?: string;
  institutionName?: string;
  boardUniversity?: string;
  program?: string;
  major?: string;
  scoreType?: string;
  score?: string;
  passingYear?: string | Date | null;
}

export interface WorkExperienceItem {
  id: string;
  companyName: string;
  jobTitle: string;
  startDate: string | Date | null;
  endDate: string | Date | null;
  currentlyWorking: boolean;
}

export interface WorkExperience {
  experiences: WorkExperienceItem[];
}

export interface AchievementItem {
  id: string;
  category: string;
  description: string;
  documents?: string | null; // URL or file name
}

export interface Achievements {
  achievements: AchievementItem[];
}

export interface DocumentItem {
  id: string;
  name: string;
  type: string;
  uploaded: boolean;
  verified: boolean;
  fileUrl?: string;
  fileName?: string;
  fileType?: string;
}

export interface ApplicationSpecificDocumentItem extends DocumentItem {
  universityName?: string | null;
  courseName?: string | null;
}

export interface Documents {
  documents: DocumentItem[];
  applicationSpecificDocuments?: ApplicationSpecificDocumentItem[];
}

export interface ApplicationStatusHistory {
  id: string;
  statusName: string;
  notes: string;
  time: string; // ISO date string
  createdBy?: string; // Name of the user who created the status change
}

export interface ApplicantDetail {
  id: string;
  applicantId: string;
  applicantName: string;
  applicantStage: string;
  enrollmentType: string;
  applications: UniversityApplication[];
  notes: string;
  status: "Active" | "Inactive";
  personalDetails?: PersonalDetails;
  educationalDetails?: EducationalDetails;
  workExperience?: WorkExperience;
  achievements?: Achievements;
  documents?: Documents;
}

