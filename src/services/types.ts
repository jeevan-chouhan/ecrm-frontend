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
  number: number;
  first: boolean;
  last: boolean;
  empty: boolean;
}

export type UserListResponse = ApiResponse<PaginatedData<UserListItem> | UserListItem[]>;

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
  countryId: number | null;
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
  universityId: number;
  universityName: string;
  count: number;
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
  password: string;
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
  assignedAdminId: number | null; // Optional: for filtering by specific admin
  assignedManagerId: number | null; // Optional: for filtering by specific manager
  assignedCounselorId: number | null; // Optional: for filtering by specific counselor
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
export type UpdateApplicationPreferencePayload = ApplicationPreferenceItem;

// Update Application Preference Response (has nested objects like GET response)
export type UpdateApplicationPreferenceResponse = ApiResponse<ApplicationPreferenceGetData>;

// Delete Application Preference Response
export type DeleteApplicationPreferenceResponse = ApiResponse<null>;

