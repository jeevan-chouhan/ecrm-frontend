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

