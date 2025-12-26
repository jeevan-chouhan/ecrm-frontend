export interface PreferenceItem {
  id: string;
  desiredCountry: string;
  program: string;
  desiredUniversity: string;
  desiredCampus: string;
  course: string;
  desiredIntake: string;
  assignCounselor: string;
  agencyPartnerName: string;
  saved?: boolean; // Track if preference has been saved
}

export interface ApplicationPreferencesFormData {
  preferences: PreferenceItem[];
}

export interface WorkExperienceItem {
  id: string;
  companyName: string;
  jobTitle: string;
  startDate: Date | null;
  endDate: Date | null;
  currentlyWorking: boolean;
  saved?: boolean;
}

export interface WorkExperienceFormData {
  hasWorkExperience: string;
  workExperiences: WorkExperienceItem[];
}

export interface AchievementItem {
  id: string;
  category: string;
  description: string;
  documents: File | null;
  saved?: boolean;
}

export interface AchievementFormData {
  hasAchievements: string;
  achievements: AchievementItem[];
}

export interface PersonalDetailsFormData {
  profilePhoto: File | null;
  enrollmentType: string;
  name: string;
  dateOfBirth: Date | null;
  gender: string;
  countryCode: string;
  contactNumber: string;
  emailId: string;
  permanentAddress: string;
  notes: string;
}

export interface EducationalDetailFormData {
  highestQualification: string;
  institutionName: string;
  boardUniversity: string;
  program: string;
  major: string;
  scoreType: string;
  score: string;
  passingYear: Date | null;
}

// Combined state for all applicant form data
export interface ApplicantFormState {
  personalDetails: PersonalDetailsFormData;
  applicationPreferences: ApplicationPreferencesFormData;
  educationalDetails: EducationalDetailFormData;
  workExperience: WorkExperienceFormData;
  achievements: AchievementFormData;
}

