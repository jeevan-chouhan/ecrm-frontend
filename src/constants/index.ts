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

// Yes/No options
export const yesNoOptions: SelectOption[] = [
  { value: "yes", label: "Yes" },
  { value: "no", label: "No" },
];

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
  { value: "active", label: "Active" },
  { value: "inactive", label: "Inactive" },
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
  { value: "admin-primary", label: "Primary Admin" },
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

// Applicant stage options
export const applicantStageOptions: SelectOption[] = [
  { value: "lead", label: "Lead" },
  { value: "application-in-progress", label: "Application In Progress" },
  { value: "application-submitted", label: "Application Submitted" },
  { value: "offer-awaiting", label: "Offer Awaiting" },
  { value: "offer-received", label: "Offer Received" },
  { value: "offer-status", label: "Offer Status" },
  { value: "deposits", label: "Deposits" },
  { value: "application-rejected", label: "Application Rejected" },
  { value: "application-accepted", label: "Application Accepted" },
  { value: "visa", label: "Visa" },
  { value: "applicant-rejecting", label: "Applicant Rejecting" },
  { value: "applicant-status", label: "Applicant Status" },
];

// Applicant status options
export const applicantStatusOptions: SelectOption[] = [
  { value: "active", label: "Active" },
  { value: "inactive", label: "Inactive" },
];

// Intake options (extended from mockData)
export const intakeOptions: SelectOption[] = [
  { value: "jan-2026", label: "Jan - 2026" },
  { value: "feb-2026", label: "Feb - 2026" },
  { value: "mar-2026", label: "Mar - 2026" },
  { value: "apr-2026", label: "Apr - 2026" },
  { value: "may-2026", label: "May - 2026" },
  { value: "jun-2026", label: "Jun - 2026" },
  { value: "jul-2026", label: "Jul - 2026" },
  { value: "aug-2026", label: "Aug - 2026" },
  { value: "sep-2026", label: "Sep - 2026" },
  { value: "oct-2026", label: "Oct - 2026" },
  { value: "nov-2026", label: "Nov - 2026" },
  { value: "dec-2026", label: "Dec - 2026" },
];

// Agency partner options
export const agencyPartnerOptions: SelectOption[] = [
  { value: "apply-board", label: "Apply Board" },
  { value: "idp", label: "IDP" },
  { value: "study-abroad", label: "Study Abroad" },
];

// Application status options for university applications
export const applicationStatusOptions: SelectOption[] = [
  { value: "application-submitted", label: "Application Submitted" },
  { value: "document-pending", label: "Document Pending" },
  { value: "application-applicant-declined", label: "Application/Applicant Declined" },
  { value: "awaiting-conditional-offer", label: "Awaiting Conditional offer" },
  { value: "awaiting-unconditional-offer", label: "Awaiting Unconditional offer" },
  { value: "received-conditional-offer", label: "Received Conditional offer" },
  { value: "offer-received", label: "Offer Received" },
  { value: "offer-accepted", label: "Offer Accepted" },
  { value: "offer-rejected", label: "Offer Rejected" },
  { value: "awaiting-deposit", label: "Awaiting Deposit" },
  { value: "deposit-paid", label: "Deposit Paid" },
  { value: "application-rejected-not-paid", label: "Application Rejected Not Paid" },
  { value: "application-rejected-paid", label: "Application Rejected Paid" },
  { value: "application-accepted", label: "Application Accepted" },
  { value: "applied-for-visa", label: "Applied for Visa" },
  { value: "visa-approved", label: "Visa Approved" },
  { value: "visa-rejected", label: "Visa Rejected" },
  { value: "student-deferring", label: "Student Deferring" },
  { value: "student-declining", label: "Student Declining" },
  { value: "enrolled", label: "Enrolled" },
  { value: "not-enrolled-rejected", label: "Not Enrolled / Rejected" },
];
