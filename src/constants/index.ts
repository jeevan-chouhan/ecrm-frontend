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

// ==========================================
// Manage Team - Types & Mock Data
// ==========================================

export type MemberStatus = "active" | "inactive";

export interface TeamMember {
  id: string;
  name: string;
  memberId: string;
  status: MemberStatus;
}

export interface RoleGroup {
  role: string;
  members: TeamMember[];
}

// Status filter options for dropdown
export const statusFilterOptions: SelectOption[] = [
  { value: "all", label: "Status - Active/Inactive" },
  { value: "active", label: "Active" },
  { value: "inactive", label: "Inactive" },
];

// Mock data for team members
export const mockTeamData: RoleGroup[] = [
  {
    role: "Admin",
    members: [
      { id: "1", name: "John Smith", memberId: "A#45", status: "active" },
      { id: "2", name: "Emily Johnson", memberId: "A#52", status: "active" },
      { id: "3", name: "Michael Brown", memberId: "A#61", status: "inactive" },
    ],
  },
  {
    role: "Manager",
    members: [
      { id: "4", name: "Sarah Davis", memberId: "A#23", status: "active" },
      { id: "5", name: "David Wilson", memberId: "A#34", status: "active" },
      { id: "6", name: "Jessica Taylor", memberId: "A#41", status: "inactive" },
    ],
  },
  {
    role: "Counselor",
    members: [
      { id: "7", name: "Bob Williams", memberId: "A#77", status: "active" },
      { id: "8", name: "Sara Williams", memberId: "A#88", status: "active" },
      { id: "9", name: "Jon Doe", memberId: "A#66", status: "active" },
      { id: "10", name: "Alice Martin", memberId: "A#91", status: "active" },
      { id: "11", name: "Robert Garcia", memberId: "A#94", status: "inactive" },
      { id: "12", name: "Linda Martinez", memberId: "A#99", status: "active" },
    ],
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
  { value: "admin-primary", label: "Admin+Primary" },
  { value: "admin", label: "Admin" },
  { value: "manager", label: "Manager" },
  { value: "counselor", label: "Counselor" },
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
