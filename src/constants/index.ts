import type { SelectOption } from "../components";

export * from "./colors";
export * from "./routes";
export * from "./mockData";

// ==========================================
// App Configuration
// ==========================================
export const APP_CONFIG = {
  name: "AgencyOS",
  fullName: "Agency Operating System",
  tagline: "Your Immigration Partner",
  copyright: (year: number = new Date().getFullYear()) => `© ${year} AgencyOS. All Rights Reserved.`,
} as const;

// ==========================================
// Date and Time Constants
// ==========================================
export const MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
] as const;

export const MONTH_SHORT_NAMES = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
] as const;

export const enrollmentTypes: SelectOption[] = [
  { value: "WALK_IN", label: "Walk-in" },
  { value: "REFFERED_TO_AGENCY", label: "Referred to Agency Partner" },
  { value: "REFFERED_BY_AGENCY", label: "Referred by Agency Partner" },
];

export const genderTypes: SelectOption[] = [
  { value: "MALE", label: "Male" },
  { value: "FEMALE", label: "Female" },
  { value: "TRANSGENDER", label: "Transgender" },
  { value: "OTHER", label: "Other" },
];

// Achievement Categories
export const achievementCategories: SelectOption[] = [
  { value: "ACADEMIC", label: "Academic" },
  { value: "SPORTS", label: "Sports" },
  { value: "VOLUNTEER", label: "Volunteer" },
  { value: "CERTIFICATION", label: "Certification" },
  { value: "INTERNSHIP", label: "Internship" },
  { value: "TECHNICAL_PROJECT", label: "Technical Project" },
  { value: "LEADERSHIP", label: "Leadership" },
  { value: "CREATIVE", label: "Creative" },
];

// Yes/No options
export const yesNoOptions: SelectOption[] = [
  { value: "yes", label: "Yes" },
  { value: "no", label: "No" },
];

// ==========================================
// User Roles
// ==========================================

export const UserRole = {
  PRIMARY_ADMIN: "PRIMARY_ADMIN",
  ADMIN: "ADMIN",
  MANAGER: "MANAGER",
  COUNSELLOR: "COUNSELLOR",
  ADMIN_BILLING: "ADMIN_BILLING",
  MANGER_BILLING: "MANAGER_BILLING",
  BILLING: "BILLING",
} as const;

// Type for UserRole values
export type UserRoleType = typeof UserRole[keyof typeof UserRole];

// Role display names mapping
export const ROLE_DISPLAY_NAMES: Record<string, string> = {
  [UserRole.PRIMARY_ADMIN]: "Primary Admin",
  [UserRole.ADMIN]: "Admin",
  [UserRole.MANAGER]: "Manager",
  [UserRole.COUNSELLOR]: "Counsellor",
  [UserRole.ADMIN_BILLING]: "Admin Billing",
  [UserRole.MANGER_BILLING]: "Manager Billing",
  [UserRole.BILLING]: "Billing",
};

// Helper to get role display name
export const getRoleDisplayName = (role: string): string => {
  const upperRole = role?.toUpperCase();
  return ROLE_DISPLAY_NAMES[upperRole] || role?.charAt(0).toUpperCase() + role?.slice(1).toLowerCase() || "-";
};

// ==========================================
// Manage Team - Types & Mock Data
// ==========================================

export type MemberStatus = "active" | "inactive";

export interface TeamMember {
  id: string;
  name: string;
  memberId: string;
  role: string;
  email: string;
  mobileNo: string;
  country: string;
  university: string;
  status: MemberStatus;
}

export interface RoleGroup {
  role: string;
  members: TeamMember[];
}

// Status filter options for dropdown
export const statusFilterOptions: SelectOption[] = [
  { value: "all", label: "All" },
  { value: "ACTIVE", label: "Active" },
  { value: "INACTIVE", label: "Inactive" },
];

// Mock data for team members (flat list for table)
export const mockTeamMembers: TeamMember[] = [
  { id: "1", name: "John Smith", memberId: "A#45", role: "Admin", email: "john.smith@example.com", mobileNo: "+91 9876543210", country: "USA", university: "Harvard University", status: "active" },
  { id: "2", name: "Emily Johnson", memberId: "A#52", role: "Admin", email: "emily.johnson@example.com", mobileNo: "+91 9876543211", country: "UK", university: "Oxford University", status: "active" },
  { id: "3", name: "Michael Brown", memberId: "A#61", role: "Admin", email: "michael.brown@example.com", mobileNo: "+91 9876543212", country: "Canada", university: "University of Toronto", status: "inactive" },
  { id: "4", name: "Sarah Davis", memberId: "A#23", role: "Manager", email: "sarah.davis@example.com", mobileNo: "+91 9876543213", country: "Australia", university: "University of Melbourne", status: "active" },
  { id: "5", name: "David Wilson", memberId: "A#34", role: "Manager", email: "david.wilson@example.com", mobileNo: "+91 9876543214", country: "USA", university: "MIT", status: "active" },
  { id: "6", name: "Jessica Taylor", memberId: "A#41", role: "Manager", email: "jessica.taylor@example.com", mobileNo: "+91 9876543215", country: "UK", university: "Cambridge University", status: "inactive" },
  { id: "7", name: "Bob Williams", memberId: "A#77", role: "Counselor", email: "bob.williams@example.com", mobileNo: "+91 9876543216", country: "Canada", university: "McGill University", status: "active" },
  { id: "8", name: "Sara Williams", memberId: "A#88", role: "Counselor", email: "sara.williams@example.com", mobileNo: "+91 9876543217", country: "Australia", university: "University of Sydney", status: "active" },
  { id: "9", name: "Jon Doe", memberId: "A#66", role: "Counselor", email: "jon.doe@example.com", mobileNo: "+91 9876543218", country: "USA", university: "Stanford University", status: "active" },
  { id: "10", name: "Alice Martin", memberId: "A#91", role: "Counselor", email: "alice.martin@example.com", mobileNo: "+91 9876543219", country: "UK", university: "Imperial College", status: "active" },
  { id: "11", name: "Robert Garcia", memberId: "A#94", role: "Counselor", email: "robert.garcia@example.com", mobileNo: "+91 9876543220", country: "Canada", university: "University of British Columbia", status: "inactive" },
  { id: "12", name: "Linda Martinez", memberId: "A#99", role: "Counselor", email: "linda.martinez@example.com", mobileNo: "+91 9876543221", country: "Australia", university: "Australian National University", status: "active" },
];

// Mock data for team members (grouped by role - kept for backward compatibility)
export const mockTeamData: RoleGroup[] = [
  {
    role: "Admin",
    members: mockTeamMembers.filter(m => m.role === "Admin"),
  },
  {
    role: "Manager",
    members: mockTeamMembers.filter(m => m.role === "Manager"),
  },
  {
    role: "Counselor",
    members: mockTeamMembers.filter(m => m.role === "Counselor"),
  },
];

// ==========================================
// Team Member Detail - Types & Mock Data
// ==========================================

export interface UniversityStats {
  name: string;
  count: number;
}

export interface TeamMemberDetail {
  id: string;
  name: string;
  memberId: string;
  role: string;
  email: string;
  contactNumber: string;
  totalApplicants: number;
  inProgressApplicants: number;
  successfulApplicants: number;
  rejectedApplicants: number;
  universities: UniversityStats[];
  adminId: string;
  managerId: string;
  assignedCountry: string;
  assignedUniversities: string[];
}

// Role options for dropdown
export const roleOptions: SelectOption[] = [
  { value: "primaryAdmin", label: "Primary Admin" },
  { value: "admin", label: "Admin" },
  { value: "manager", label: "Manager" },
  { value: "counselor", label: "Counselor" },
  { value: "billing", label: "Billing" },
];

// Admin options for dropdown
export const adminOptions: SelectOption[] = [
  { value: "arthur", label: "Arthur" },
  { value: "john", label: "John" },
  { value: "emily", label: "Emily" },
];

// Manager options for dropdown
export const managerOptions: SelectOption[] = [
  { value: "carlos", label: "Carlos" },
  { value: "sarah", label: "Sarah" },
  { value: "david", label: "David" },
];

export const counselorOptions: SelectOption[] = [
  { value: "bob", label: "Bob Williams" },
  { value: "sara", label: "Sara Williams" },
  { value: "jon", label: "Jon Doe" },
  { value: "alice", label: "Alice Martin" },
];

// Country options for dropdown
export const countryOptions: SelectOption[] = [
  { value: "usa", label: "USA" },
  { value: "uk", label: "UK" },
  { value: "canada", label: "Canada" },
  { value: "australia", label: "Australia" },
  { value: "germany", label: "Germany" },
];

// University options for multi-select
export const universityOptions: SelectOption[] = [
  { value: "harvard", label: "Harvard University" },
  { value: "toronto", label: "University of Toronto" },
  { value: "mit", label: "MIT" },
  { value: "stanford", label: "Stanford University" },
  { value: "oxford", label: "Oxford University" },
  { value: "cambridge", label: "Cambridge University" },
];

// Mock data for team member detail
export const mockTeamMemberDetail: TeamMemberDetail = {
  id: "8",
  name: "Harry",
  memberId: "C#88",
  role: "counselor",
  email: "john.doe@example.com",
  contactNumber: "+91 2345678900",
  totalApplicants: 40,
  inProgressApplicants: 20,
  successfulApplicants: 19,
  rejectedApplicants: 1,
  universities: [
    { name: "Harvard University", count: 12 },
    { name: "University of Toronto", count: 8 },
    { name: "MIT", count: 2 },
    { name: "Other", count: 5 },
  ],
  adminId: "arthur",
  managerId: "carlos",
  assignedCountry: "usa",
  assignedUniversities: ["harvard", "toronto", "mit"],
};

// ==========================================
// Applicant Tracker - Constants
// ==========================================

// Applicant stage options - exact values from the application stage table
export const applicantStageOptions: SelectOption[] = [
  { value: "LEAD", label: "Lead" },
  { value: "APPLICATION_SUBMITTED", label: "Application Submitted" },
  { value: "OFFER_AWAITING", label: "Offer Awaiting" },
  { value: "OFFER_RECEIVED", label: "Offer Received" },
  { value: "OFFER_STATUS", label: "Offer Status" },
  { value: "DEPOSIT", label: "Deposit" },
  { value: "APPLICATION_REJECTED", label: "Application Rejected" },
  { value: "APPLICATION_ACCEPTED", label: "Application Accepted" },
  { value: "VISA", label: "Visa" },
  { value: "APPLICANT_REJECTING", label: "Applicant Rejecting" },
  { value: "FINAL_STATUS", label: "Final Status" },
];

// Agency partner options
export const agencyPartnerOptions: SelectOption[] = [
  { value: "apply-board", label: "Apply Board" },
  { value: "idp", label: "IDP" },
  { value: "study-abroad", label: "Study Abroad" },
];

// Applicant status options - for active/inactive status (used in applicant overview and status changes)
export const applicantStatusOptions: SelectOption[] = [
  { value: "active", label: "Active" },
  { value: "inactive", label: "Inactive" },
];

// Application status options - all statuses from all application stages
export const applicationStatusOptions: SelectOption[] = [
  // Lead / Walk-in
  { value: "LEAD", label: "Lead" },
  { value: "APPLICATION_INCOMPLETE", label: "Application Incomplete" },
  { value: "DOCUMENT_PENDING", label: "Document Pending" },
  { value: "APPLICATION_DECLINED", label: "Application Declined" },
  { value: "APPLICANT_DECLINED", label: "Applicant Declined" },
  // Application Submitted
  { value: "UNDER_UNIVERSITY_REVIEW", label: "Under University Review" },
  // Offer Awaiting
  { value: "AWAITING_CONDITIONAL_OFFER", label: "Awaiting Conditional offer" },
  { value: "AWAITING_UNCONDITIONAL_OFFER", label: "Awaiting Unconditional offer" },
  { value: "AWAITING_UNCONDITIONAL_OFFER_DOCUMENT", label: "Awaiting Unconditional offer Document" },
  // Offer Received
  { value: "RECEIVED_CONDITIONAL_OFFER", label: "Received Conditional offer" },
  { value: "RECEIVED_UNCONDITIONAL_OFFER", label: "Received Unconditional offer" },
  { value: "OFFER_RECEIVED", label: "Offer Received" },
  // Offer Status
  { value: "OFFER_ACCEPTED", label: "Offer Accepted" },
  { value: "OFFER_REJECTED", label: "Offer Rejected" },
  // Deposit
  { value: "AWAITING_DEPOSIT", label: "Awaiting Deposit" },
  { value: "DEPOSIT_PAID", label: "Deposit Paid" },
  // Application Rejected
  { value: "REJECTED_NOT_PAID", label: "Rejected Not Paid" },
  { value: "REJECTED_PAID", label: "Rejected Paid" },
  // Application Accepted
  { value: "APPLICATION_ACCEPTED_PAID", label: "Application Accepted (paid)" },
  // Visa
  { value: "APPLIED_FOR_VISA", label: "Applied for Visa" },
  { value: "VISA_APPROVED", label: "Visa Approved" },
  { value: "VISA_REJECTED", label: "Visa Rejected" },
  // Applicant Rejecting
  { value: "STUDENT_DEFERRING", label: "Student Deferring" },
  { value: "STUDENT_DECLINING", label: "Student Declining" },
  // Final Status
  { value: "ENROLLED", label: "Enrolled" },
  { value: "NOT_ENROLLED", label: "Not Enrolled" },
];
