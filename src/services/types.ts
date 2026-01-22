// ==========================================
// API Types
// ==========================================

// Common API Response
export interface ApiResponse<T = null> {
  status: string;
  statusCode: number;
  message: string;
  data: T;
}

// ==========================================
// Auth Types
// ==========================================

// Login
export interface LoginPayload {
  email: string;
  password: string;
}

export interface LoginData {
  accessToken: string;
  refreshToken: string;
}

export type LoginResponse = ApiResponse<LoginData>;

// Forgot Password
export interface ForgotPasswordPayload {
  email: string;
}

export interface ForgotPasswordData {
  userId: number;
  emailId: string;
}

export type ForgotPasswordResponse = ApiResponse<ForgotPasswordData>;

// Verify OTP
export interface VerifyOtpPayload {
  email: string;
  otp: number;
}

export type VerifyOtpResponse = ApiResponse<null>;

// Update Password
export interface UpdatePasswordPayload {
  email: string;
  newPassword: string;
  confirmPassword: string;
}

export type UpdatePasswordResponse = ApiResponse<null>;

// Refresh Token
export interface RefreshTokenPayload {
  refreshToken: string;
}

export interface RefreshTokenData {
  accessToken: string;
  refreshToken: string;
}

export type RefreshTokenResponse = ApiResponse<RefreshTokenData>;

// User Data (decoded from JWT token)
export interface UserData {
  userId: number;
  name: string;
  email: string;
  role: string;
  contactNumber: string;
  countryCode: string;
  isPrimaryAdmin: boolean;
  isPasswordChanged: boolean;
  agencyId: number | null;
}

// ==========================================
// Navigation State Types
// ==========================================

export interface OtpVerificationState {
  userId?: number;
  email?: string;
}

export interface ResetPasswordState {
  email?: string;
}

// ==========================================
// User List Types
// ==========================================

export interface UserListParams {
  agencyId: number | null;
  assignedManagerId: number | null;
  search: string | null;
  status: string | null;
  page: number | null;
  size: number | null;
  sortBy: string | null;
  asc: boolean | null;
}

export interface UserListItem {
  id: number;
  name: string;
  email: string;
  role: string;
  contactNumber: string;
  countryCode: string;
  status: string;
  adminName?: string | null;
  managerName?: string | null;
  // API returns as array
  assignedAdmins?: Array<{ id: number; name: string }>;
  assignedManagers?: Array<{ id: number; name: string }>;
  assignedCountries?: Array<{ id: number; name: string }>;
  assignedUniversities?: Array<{ id: number; name: string }>;
  createdAt?: string;
  updatedAt?: string;
}

// Paginated response wrapper
export interface PaginatedData<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  size: number;
  number?: number;
  page?: number;
  first: boolean;
  last: boolean;
  empty?: boolean;
  numberOfElements?: number;
  nextPage?: number | null;
  prevPage?: number | null;
}

// Team stats counts
export interface TeamStatsCounts {
  totalAdmins: number;
  totalManagers: number;
  totalCounselor: number;
}

// User list response with nested page and counts
export interface UserListDataWithCounts {
  page: PaginatedData<UserListItem>;
  counts: TeamStatsCounts;
}

export type UserListResponse = ApiResponse<UserListDataWithCounts | PaginatedData<UserListItem> | UserListItem[]>;

// ==========================================
// Profile Details Types
// ==========================================

export interface ProfileDetailsParams {
  userId: number | string;
}

export interface ProfilePhotoInfo {
  size: number;
  fileName: string;
  filePath: string;
  fileType: string;
  accessUrl: string;
}

export interface ProfileDetailsData {
  email: string;
  name: string;
  contactNumber: string;
  countryCode: string;
  profilePhoto: string | null; // JSON string containing ProfilePhotoInfo
  status: string;
  role: string;
  isPrimaryAdmin ?: boolean;
}

export type ProfileDetailsResponse = ApiResponse<ProfileDetailsData>;

// Update Profile
export interface UpdateProfileParams {
  userId: number | string;
}

export interface UpdateProfilePayload {
  name: string;
  countryCode: string;
  contactNumber: string;
  profilePhoto?: ProfilePhotoInfo | null;
}

export interface UpdateProfileData {
  message: string;
}

export type UpdateProfileResponse = ApiResponse<UpdateProfileData>;

// ==========================================
// Agency Types (Countries & Universities)
// ==========================================

export interface CountryItem {
  id: number;
  name: string;
  code?: string;
}

export interface UniversityItem {
  id: number;
  name: string;
  countryId?: number;
  countryName?: string;
}

export interface CampusItem {
  id: number;
  name: string;
  universityId?: number;
  universityName?: string;
}

export interface CourseItem {
  id: number;
  name: string;
  courseType?: string;
  campusId?: number;
}

export interface UniversityParams {
  agencyId: number | null;
  countryId: number | number[] | string | null;
}

export type CountriesResponse = ApiResponse<CountryItem[]>;
export type UniversitiesResponse = ApiResponse<UniversityItem[]>;
export type CampusesResponse = ApiResponse<CampusItem[]>;
export type CoursesResponse = ApiResponse<CourseItem[]>;

// ==========================================
// User Details Types
// ==========================================

export interface UserDetailsParams {
  userId: number;
  agencyId: number | null;
  assignedManagerId: number | null;
  assignedAdminId: number | null;
  assignedCounsellorId: number | null;
}

export interface UserPersonalData {
  email: string;
  role: string;
  contactNumber: string;
  assignedAdminName: string | null;
  assignedManagerName: string | null;
  assignedCountries?: Array<{ id: number; name: string }>;
  assignedUniversities?: Array<{ id: number; name: string }>;
}

export interface UserSubordinate {
  id: number;
  name: string;
  role: string;
  email?: string;
}

export interface UserApplicantCount {
  totalApplicants: number;
  inProgressApplicants: number;
  successFullApplicants: number;
  rejectedApplicants: number;
}

export interface EnrolledApplicantsByUniversity {
  universityId?: number;
  universityName?: string;
  count?: number;
  // Alternative format from some API responses
  id?: number;
  name?: string;
  applicantCount?: number;
}

export interface UserDetailsData {
  personalData: UserPersonalData;
  subordinates: UserSubordinate[];
  applicantCount: UserApplicantCount;
  enrolledApplicantsByUniversity: EnrolledApplicantsByUniversity[];
  // These may be at top level or inside personalData depending on API
  assignedCountries?: Array<{ id: number; name: string }>;
  assignedUniversities?: Array<{ id: number; name: string }>;
  assignedAdmins?: Array<{ id: number; name: string }>;
  assignedManagers?: Array<{ id: number; name: string }>;
}

export type UserDetailsResponse = ApiResponse<UserDetailsData>;

// ==========================================
// Add Team Member Types
// ==========================================

export interface AddMemberPayload {
  name: string;
  email: string;
  countryCode: string;
  contactNumber: string;
  role: string;
  assigned_admin?: { id: number } | null;
  assigned_manager?: { id: number } | null;
  agencyId: { id: number };
  assignedCountries: Array<{ id: number; name: string }>;
  assignedUniversities: Array<{ id: number; name: string }>;
}

export type AddMemberResponse = ApiResponse<null>;

// ==========================================
// Update Member Types
// ==========================================

export interface UpdateMemberParams {
  userId: number;
  agencyId: number;
}

export interface UpdateMemberPayload {
  name: string;
  email: string;
  countryCode: string;
  contactNumber: string;
  role: string;
  assignedCountries: Array<{ id: number; name: string }>;
  assignedUniversities: Array<{ id: number; name: string }>;
}

export type UpdateMemberResponse = ApiResponse<null>;

// ==========================================
// Admin/Manager List Types
// ==========================================

export interface AdminItem {
  id: number;
  name: string;
  email: string;
}

export type AdminListResponse = AdminItem[];

export interface ManagerItem {
  id: number;
  name: string;
  email: string;
}

export type ManagerListResponse = ManagerItem[];

export interface CounselorItem {
  id: number;
  name: string;
  email?: string; // Optional as new API doesn't return email
}

export type CounselorListResponse = CounselorItem[];

// ==========================================
// Update User Status Types
// ==========================================

export interface UpdateStatusParams {
  userId: number;
}

export interface UpdateStatusData {
  userId: number;
  status: string;
  message: string;
}

export type UpdateStatusResponse = ApiResponse<UpdateStatusData>;

// ==========================================
// Applications List Types
// ==========================================

export interface ApplicationsListParams {
  agencyId: number | null;
  applicantId: number | null; // Optional: for filtering by specific applicant
  assignedAdminId: number | null; // Optional: for filtering by specific admin
  assignedManagerId: number | null; // Optional: for filtering by specific manager
  assignedCounselorId: number | null; // Optional: for filtering by specific counselor
  applicationStatus: string | null; // Optional: ApplicationStatus enum value
  applicationStage: string | null; // Optional: ApplicationStage enum value (single value, not array)
  universityId: number | null; // Optional: University ID filter
  desiredIntake: string | null; // Optional: Intake filter (e.g., "jan-2026")
  agencyPartnerId: number | null; // Optional: Agency Partner ID filter
  appliedFrom: string | null; // Optional: ISO DATE_TIME format (YYYY-MM-DDTHH:mm:ss)
  appliedTo: string | null; // Optional: ISO DATE_TIME format (YYYY-MM-DDTHH:mm:ss)
  updatedFrom: string | null; // Optional: ISO DATE_TIME format (YYYY-MM-DDTHH:mm:ss)
  updatedTo: string | null; // Optional: ISO DATE_TIME format (YYYY-MM-DDTHH:mm:ss)
  search: string | null;
  page: number | null;
  size: number | null;
  sortBy: string | null;
  asc: boolean | null;
}

export interface ApplicationListItem {
  preferenceId: number;
  applicantId: number;
  applicantName: string;
  contactNumber: string;
  course: string;
  applicantStage: string;
  applicantStatus: string;
  appliedDate: string | null;
  universityName: string;
  desiredIntake: string;
  updatedAt: string | null;
  countryName?: string | null;
  counselorName?: string | null;
  agencyName?: string | null; // Keep for backward compatibility
  agencyPartnerName?: string | null; // Actual field name from API
}

export type ApplicationsListResponse = ApiResponse<PaginatedData<ApplicationListItem>>;

// Apply Application Types
export interface ApplyApplicationParams {
  applicantId: number | string;
  applicationPrefId: number | string;
}

export interface ApplyApplicationData {
  applicantId: number;
  applicationPreferenceId: number;
  applicationStatus: string;
  applicationStage: string;
}

export type ApplyApplicationResponse = ApiResponse<ApplyApplicationData>;

// Update Application Status Types
export interface UpdateApplicationStatusPayload {
  applicantId: number;
  applicationPrefId: number;
  applicationStatus: string;
  notes: string;
  isMailSendToStudent: boolean;
}

export interface UpdateApplicationStatusData {
  applicantId: number;
  applicationPreferenceId: number;
  applicationStatus: string;
  notes?: string;
  isMailSendToStudent: boolean;
}

export type UpdateApplicationStatusResponse = ApiResponse<UpdateApplicationStatusData>;

// Application Status History Types
export interface StatusHistoryParams {
  applicantId: number | string;
  applicationPrefId: number | string;
}

export interface StatusHistoryItem {
  historyId: number;
  applicantId: number;
  applicationPreferenceId: number;
  applicationStatus: string;
  applicationStage: string;
  notes: string;
  createdAt: string;
  createdBy: string;
}

export interface StatusHistoryData {
  historyStatusListList: StatusHistoryItem[];
  universityName: string;
  applicantName: string;
}

export type StatusHistoryResponse = ApiResponse<StatusHistoryData[]>;

// ==========================================
// Applicant Overview Types
// ==========================================

export interface ApplicantOverviewParams {
  agencyId: number | null;
  assignedAdminId?: number | null;
  assignedManagerId?: number | null;
  search?: string | null;
  status?: string | null;
  enrollmentType?: string | null;
  page?: number | null;
  size?: number | null;
  sortBy?: string | null;
  asc?: boolean | null;
}

export interface ApplicantOverviewItem {
  applicantId: number;
  applicantName: string;
  email: string;
  enrollmentType: string;
  notes: string;
  status: string;
  createdAt: string;
}

export interface ApplicantOverviewData {
  content: ApplicantOverviewItem[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
  first: boolean;
  last: boolean;
  numberOfElements: number;
  nextPage: number | null;
  prevPage: number | null;
}

export type ApplicantOverviewResponse = ApiResponse<ApplicantOverviewData>;
// Personal Details Types
// ==========================================

// Create Personal Details Payload
export interface CreatePersonalDetailsPayload {
  name: string;
  profilePhoto?: string | null; // JSON string with accessUrl and fileName, or null
  enrollmentType: string;
  dob: string; // Format: "YYYY-MM-DD"
  gender: string;
  email: string;
  countryCode: string;
  contactNumber: string;
  permanentAddress?: string | null;
  notes?: string | null;
  assignedAgencyId?: number | null; // Agency ID from Redux store
}

// Update Personal Details Payload (same as create)
export type UpdatePersonalDetailsPayload = CreatePersonalDetailsPayload;

// Personal Details Data (from API response)
export interface PersonalDetailsData {
  applicantId: number;
  name: string;
  enrollmentType: string;
  dob: string; // Format: "YYYY-MM-DD"
  gender: string;
  email: string;
  contactNumber: string;
  countryCode: string;
  permanentAddress?: string | null;
  notes?: string | null;
  profilePhoto?: string | null;
  message?: string;
}

// Create Personal Details Response
export type CreatePersonalDetailsResponse = ApiResponse<PersonalDetailsData>;

// Get Personal Details Response
export type GetPersonalDetailsResponse = ApiResponse<PersonalDetailsData>;

// Update Personal Details Response
export type UpdatePersonalDetailsResponse = ApiResponse<PersonalDetailsData>;

// ==========================================
// Application Preferences Types
// ==========================================

// Application Preference Item (for API payload)
export interface ApplicationPreferenceItem {
  desiredCountryId: number;
  desiredUniversityId: number;
  desiredCourseType: string; // e.g., "BACHELOR", "MASTER"
  desiredCampusId: number;
  desiredCourseId: number;
  desiredIntake: string; // Format: "YYYY-MM"
  assignedAgencyId?: number | null; // Agency ID from Redux store
  agencyPartnerId?: number | null; // Agency Partner ID
  assignedCounselorId?: number | null; // Counselor ID if counselor is selected
  assignedAdminId?: number | null; // Admin ID if user is ADMIN and no counselor selected
  assignedManagerId?: number | null; // Manager ID if user is MANAGER and no counselor selected
}

// Create Application Preferences Payload (array of preferences)
export type CreateApplicationPreferencesPayload = ApplicationPreferenceItem[];

// Application Preference Data (from API response - POST/PUT)
export interface ApplicationPreferenceData {
  id?: number; // Preference ID (for updates)
  applicantId: number;
  desiredCountryId: number;
  desiredUniversityId: number;
  desiredCourseType: string;
  desiredCampusId: number;
  desiredCourseId: number;
  desiredIntake: string;
  assignedManager: number | null;
  assignedCounselor: number | null;
  assignedAgency: number | null;
  assignedAdmin: number | null;
  message?: string;
}

// Application Preference Data (from GET API response - with nested objects)
export interface ApplicationPreferenceGetData {
  preferenceId: number; // Preference ID
  applicantId: number;
  desiredCountryId: {
    id: number;
    name: string;
  };
  desiredUniversityId: {
    id: number;
    name: string;
  };
  desiredCourseType: string;
  desiredCampusId: {
    id: number;
    name: string;
  };
  desiredCourseId: {
    id: number;
    name: string;
  };
  desiredIntake: string;
  assignedManager: {
    id: number;
    name: string;
  } | number | null;
  assignedCounselor: {
    id: number;
    name: string;
  } | number | null;
  assignedAgency: {
    id: number;
    name: string;
  } | number | null;
  agencyPartner: {
    id: number;
    name: string;
  } | number | null;
  assignedAdmin: {
    id: number;
    name: string;
  } | number | null;
  message?: string;
}

// Create Application Preferences Response
export type CreateApplicationPreferencesResponse = ApiResponse<ApplicationPreferenceData[]>;

// Get Application Preferences Response
export type GetApplicationPreferencesResponse = ApiResponse<ApplicationPreferenceGetData[]>;

// Update Application Preference Payload (single preference)
// Note: preferenceId is sent both as a query parameter and in the payload
export interface UpdateApplicationPreferencePayload extends ApplicationPreferenceItem {
  preferenceId?: number | string; // Preference ID for PUT operations
}

// Update Application Preference Response (has nested objects like GET response)
export type UpdateApplicationPreferenceResponse = ApiResponse<ApplicationPreferenceGetData>;

// Delete Application Preference Response
export type DeleteApplicationPreferenceResponse = ApiResponse<null>;

// ==========================================
// Update Applicant Status Types
// ==========================================

export interface UpdateApplicantStatusParams {
  applicantId: number;
}

export interface UpdateApplicantStatusPayload {
  applicantId: number;
  applicationPrefId: number;
  applicationStatus: string;
  notes: string;
  isMailSendToStudent: boolean;
}

export interface UpdateApplicantStatusData {
  applicantId: number;
  status: string;
  message: string;
}

export type UpdateApplicantStatusResponse = ApiResponse<UpdateApplicantStatusData>;

// ==========================================
// Applicant Complete Details Types
// ==========================================

export interface CompleteDetailsParams {
  agencyId: number | string;
  applicantId: number | string;
}

export interface CompleteDetailsPersonal {
  applicantId: number;
  assignedAgencyId: number;
  name: string;
  profilePhoto: string | null;
  enrollmentType: string | null;
  countryCode: string;
  contactNumber: string;
  email: string;
  permanentAddress: string;
  notes: string;
  dob: string | null;
  gender: string;
  status?: "ACTIVE" | "INACTIVE";
  message: string;
}

export interface CompleteDetailsEducational {
  applicantId: number;
  highestQualification: string;
  instituteName: string;
  universityName: string;
  courseType: string;
  fieldType: string;
  scoreType: string;
  score: string;
  passingYear: string | null;
  message: string;
}

export interface CompleteDetailsWorkExperience {
  id: number;
  applicantId: number;
  isExperienced: boolean;
  companyName: string;
  jobTitle: string;
  isCurrentlyWorking: boolean;
  startDate: string | null;
  endDate: string | null;
  message: string;
}

export interface CompleteDetailsAchievement {
  id: number;
  applicantId: number;
  isAchievements: boolean;
  category: string;
  description: string;
  document: string | null;
  message: string;
}

export interface CompleteDetailsData {
  personalDetails: CompleteDetailsPersonal;
  educationalDetails: CompleteDetailsEducational;
  workExperiences: CompleteDetailsWorkExperience[];
  achievements: CompleteDetailsAchievement[];
  commonDocuments?: ApplicationPreferenceDocument[];
  applicationSpecificDocuments?: ApplicationPreferenceDocument[];
}

export type CompleteDetailsResponse = ApiResponse<CompleteDetailsData>;

// ==========================================
// Educational Details Types
// ==========================================

// Educational Details Payload (for POST and PUT)
export interface EducationalDetailsPayload {
  applicantId: number;
  highestQualification: string;
  instituteName: string;
  universityName: string;
  courseType: string | null;
  fieldType: string | null;
  scoreType: string;
  score: string;
  passingYear: string; // Format: "YYYY-MM-DD"
}

// Educational Details Data (from API response)
export interface EducationalDetailsData {
  applicantId: number;
  highestQualification: string;
  instituteName: string;
  universityName: string;
  courseType: string;
  fieldType: string;
  scoreType: string;
  score: string;
  passingYear: string;
  message?: string;
}

// Educational Details Response (for POST, PUT, GET)
export type EducationalDetailsResponse = ApiResponse<EducationalDetailsData>;
export type GetEducationalDetailsResponse = ApiResponse<EducationalDetailsData>;
export type UpdateEducationalDetailsResponse = ApiResponse<EducationalDetailsData>;



// ==========================================
// Work Experience Types
// ==========================================

// Work Experience Item (for API payload)
export interface WorkExperienceItemPayload {
  isExperienced: boolean;
  companyName: string;
  jobTitle: string;
  isCurrentlyWorking: boolean;
  startDate: string; // Format: "YYYY-MM-DD"
  endDate: string | null; // Format: "YYYY-MM-DD" or null
}

// Work Experience Data (from API response)
export interface WorkExperienceData {
  id: number;
  applicantId: number;
  isExperienced: boolean;
  companyName: string;
  jobTitle: string;
  isCurrentlyWorking: boolean;
  startDate: string; // Format: "YYYY-MM-DD"
  endDate: string | null; // Format: "YYYY-MM-DD" or null
  message?: string;
}

// Work Experience Response Types
export type CreateWorkExperiencesResponse = ApiResponse<WorkExperienceData[]>;
export type GetWorkExperiencesResponse = ApiResponse<WorkExperienceData[]>;
export type UpdateWorkExperienceResponse = ApiResponse<WorkExperienceData>;
export type DeleteWorkExperienceResponse = ApiResponse<null>;


// ==========================================
// Achievement Types
// ==========================================

// Achievement Item (for API payload)
export interface AchievementItemPayload {
  isAchievements: boolean;
  category: string;
  description: string;
  document: string | null; // JSON stringified document object or null
}

// Achievement Data (from API response)
export interface AchievementData {
  id: number;
  applicantId: number;
  isAchievements: boolean;
  category: string;
  description: string;
  document: string | null; // JSON stringified document object or null
  message?: string;
}

// Achievement Response Types
export type CreateAchievementsResponse = ApiResponse<AchievementData[]>;
export type GetAchievementsResponse = ApiResponse<AchievementData[]>;
export type UpdateAchievementResponse = ApiResponse<AchievementData>;
export type DeleteAchievementResponse = ApiResponse<null>;

// ==========================================
// Agency Partner Types
// ==========================================

// Add Agency Partner Payload
export interface AddAgencyPartnerPayload {
  agencyId: number;
  name: string;
  contactPerson: string;
  countryCode: string;
  contactNumber: string;
  email: string;
  commissionPercentage: number;
  description?: string;
}

// Agency Partner Data (from API response)
export interface AgencyPartnerData {
  id: number;
  uniqueId: string;
  agencyId: number;
  name: string;
  contactPerson: string;
  countryCode: string;
  contactNumber: string;
  email: string;
  commissionPercentage: number;
  description: string;
  status: "ACTIVE" | "INACTIVE";
  message?: string;
}

// Agency Partner Response Types
export type AddAgencyPartnerResponse = ApiResponse<AgencyPartnerData>;

// Agency Partner Name Item (for dropdown)
export interface AgencyPartnerNameItem {
  id: number;
  name: string;
}

// Agency Partner Names Response (array, not wrapped in ApiResponse)
export type AgencyPartnerNamesResponse = AgencyPartnerNameItem[];

// ==========================================
// Agency Partners List Types
// ==========================================

// Partners List Request Params
export interface PartnersListParams {
  agencyId: number;
  search?: string | null;
  page?: number;
  size?: number;
  sortBy?: string | null;
  asc?: boolean | null;
}

// Partner List Item (from API response)
export interface PartnerListItem {
  id: number;
  name: string;
  contactPerson: string;
  email: string;
  countryCode: string;
  contactNumber: string;
  commissionPercentage: number;
  description: string;
  status: "ACTIVE" | "INACTIVE";
}

// Partners List Data (paginated response)
export interface PartnersListData {
  content: PartnerListItem[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
  first: boolean;
  last: boolean;
  numberOfElements: number;
  nextPage: number | null;
  prevPage: number | null;
}

// Partners List Response
export type PartnersListResponse = ApiResponse<PartnersListData>;

// ==========================================
// Documents Types
// ==========================================

export interface DocumentFile {
  size: number;
  fileName: string;
  filePath: string;
  fileType: string;
  accessUrl: string;
}

export interface ApplicantDocument {
  id: number;
  applicantId: number;
  documentName: string;
  document: DocumentFile;
  isVerified: boolean;
  message?: string;
}

export type GetDocumentsResponse = ApiResponse<ApplicantDocument[]>;

// Application Preference Documents Response Types
export interface ApplicationPreferenceDocument extends ApplicantDocument {
  universityName?: string | null;
  courseName?: string | null;
}

export interface UniversityCourseName {
  count: number;
  name: string;
}

export interface ApplicantPersonalDetail {
  applicantId: number;
  applicantName: string;
  enrollmentType: string;
}

export interface DocumentCount {
  totalDocuments: number;
  approved: number;
  pending: number;
}

export interface ApplicationPreferenceDocumentsData {
  commonDocuments: ApplicationPreferenceDocument[];
  applicationSpecificDocuments: ApplicationPreferenceDocument[];
  uploadUniversityAndCoursesName: UniversityCourseName[];
  verifiedUniversityAndCoursesName: UniversityCourseName[];
  applicantPersonalDetail: ApplicantPersonalDetail;
  documentCount: DocumentCount;
}

export type ApplicationPreferenceDocumentsResponse = ApiResponse<ApplicationPreferenceDocumentsData>;

// Upload Document Request Payload
export interface UploadDocumentPayload {
  documentName: string;
  document: File;
}

// Upload Document Response
export type UploadDocumentResponse = ApiResponse<ApplicantDocument>;
