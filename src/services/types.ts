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

export interface UniversityParams {
  agencyId: number | null;
  countryId: number | null;
}

export type CountriesResponse = ApiResponse<CountryItem[]>;
export type UniversitiesResponse = ApiResponse<UniversityItem[]>;

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

