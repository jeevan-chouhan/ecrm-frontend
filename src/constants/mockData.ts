import type { SelectOption } from "../components";
import type { ApplicantDetail } from "../pages/ApplicantTracker/ApplicantDetail/types";

// Terms and Conditions content
export interface TermsSection {
  title: string;
  content: string;
}

export const termsAndConditions: TermsSection[] = [
  {
    title: "1. Acceptance of Terms",
    content:
      'By Accessing Or Using Our Immigration CRM Platform ("Platform"), You Agree To Be Bound By These Terms And Conditions. If You Do Not Agree, You May Not Use The Platform.',
  },
  {
    title: "2. Services Provided",
    content: `The Platform Is Designed To Help Immigration Consultants/Agencies:
Manage Candidate Profiles. Track Visa And University Application Statuses. Upload And Store Supporting Documents. Communicate With Clients And Internal Staff. We Do Not Provide Legal Immigration Advice Through The Platform.`,
  },
  {
    title: "3. Client Data and Privacy",
    content: `The Platform Stores Sensitive Client Information (Passport, Visa Docs, Transcripts, Etc.). All Data Is Protected Using Encryption And Access Control. Agencies Must Obtain Consent From Clients Before Uploading Their Personal Documents.
Refer To Our Privacy Policy For Complete Details.`,
  },
  {
    title: "4. Document Management",
    content: `Uploaded Documents Are Stored In Structured Folders (E.G., By Client Or Application Type). Deleted Files May Be Recoverable From System Backup Logs Or Archives For Up To 30 Days.
Agencies Are Responsible For Uploading Valid, Authentic, And Non-Expired Documents.`,
  },
  {
    title: "5. Compliance and Legal Use",
    content: `Users Must Comply With Local Immigration Laws, GDPR, And Data Protection Regulations. The Platform Shall Not Be Used To Forge, Manipulate, Or Falsify Any Documents Or Application Details.
Any Violation Will Result In Suspension Of Access And May Be Reported To Authorities.`,
  },
  {
    title: "6. Intellectual Property",
    content:
      "All Code, Features, Designs, And Documentation Are The Intellectual Property Of [Your Agency/Company Name]. You May Not Reverse-Engineer, Copy, Or Redistribute The System Without Written Consent.",
  },
  {
    title: "7. Termination of Access",
    content:
      "We Reserve The Right To: Suspend Or Terminate Access For Any User Violating These Terms. Permanently Delete Data After Inactivity Of 12 Months (With Prior Notice).",
  },
  {
    title: "8. Limitation of Liability",
    content: `We Are Not Liable For:
Rejected Applications Or Lost Opportunities Due To Incorrect Data
Actions Taken By Immigration Authorities Or Consulates
Third-Party Delays Or Service Failures (E.G., Payment Gateways, Email Providers)`,
  },
  {
    title: "9. Amendments",
    content:
      "We May Update These Terms From Time To Time. Continued Use Of The Platform After Updates Constitutes Your Acceptance Of The Changes.",
  },
  {
    title: "10. Contact",
    content: "For Questions Or Support, Contact: [support@youragency.com]",
  },
];

// Mock data for application preferences dropdowns
export const countries: SelectOption[] = [
  { value: "australia", label: "Australia" },
  { value: "canada", label: "Canada" },
  { value: "uk", label: "United Kingdom" },
  { value: "usa", label: "United States" },
  { value: "germany", label: "Germany" },
  { value: "france", label: "France" },
  { value: "new-zealand", label: "New Zealand" },
  { value: "ireland", label: "Ireland" },
];

export const programs: SelectOption[] = [
  { value: "ug", label: "Undergraduate (UG)" },
  { value: "pg", label: "Post Graduation (PG)" },
  { value: "phd", label: "PhD" },
];

export const courses: SelectOption[] = [
  { value: "computer-science", label: "Computer Science" },
  { value: "business-administration", label: "Business Administration" },
  { value: "engineering", label: "Engineering" },
  { value: "medicine", label: "Medicine" },
  { value: "law", label: "Law" },
  { value: "arts", label: "Arts" },
  { value: "science", label: "Science" },
  { value: "other", label: "Other" },
];

export const counselors: SelectOption[] = [
  { value: "celina", label: "Celina" },
  { value: "john", label: "John" },
  { value: "sarah", label: "Sarah" },
  { value: "michael", label: "Michael" },
  { value: "emily", label: "Emily" },
];

export const agencyPartners: SelectOption[] = [
  { value: "study-abroad", label: "Study Abroad" },
  { value: "global-education", label: "Global Education" },
  { value: "overseas-studies", label: "Overseas Studies" },
  { value: "international-partners", label: "International Partners" },
];

// Mock universities (can be filtered by country)
export const universities: SelectOption[] = [
  { value: "national-university", label: "National University" },
  { value: "melbourne-university", label: "Melbourne University" },
  { value: "sydney-university", label: "Sydney University" },
  { value: "toronto-university", label: "University of Toronto" },
  { value: "ubc", label: "University of British Columbia" },
  { value: "oxford", label: "University of Oxford" },
  { value: "cambridge", label: "University of Cambridge" },
  { value: "harvard", label: "Harvard University" },
  { value: "mit", label: "MIT" },
  { value: "other", label: "Other" },
];

// Mock campuses (can be filtered by university)
export const campuses: SelectOption[] = [
  { value: "main-campus", label: "Main Campus" },
  { value: "north-campus", label: "North Campus" },
  { value: "south-campus", label: "South Campus" },
  { value: "downtown-campus", label: "Downtown Campus" },
  { value: "other", label: "Other" },
];

// Educational qualifications
export const highestQualifications: SelectOption[] = [
  { value: "high-school", label: "High School" },
  { value: "diploma", label: "Diploma" },
  { value: "ug", label: "UG (Undergraduate)" },
  { value: "pg", label: "PG (Post Graduate)" },
];

// Applicant Tracker - Types & Mock Data
export interface Applicant {
  id: string;
  applicantId: string;
  applicantName: string;
  contactNo: string;
  university?: string;
  course: string;
  applicantStage: string;
  applicantStatus: string;
  passportNo?: string;
  enrollmentType?: string;
  notes?: string;
  status?: "Active" | "Inactive";
  createdAt?: Date | string;
  appliedDate?: Date | string;
  lastUpdatedDate?: Date | string;
  adminId?: string;
  managerId?: string;
  counselorId?: string;
  intake?: string;
  agencyPartner?: string;
}

export const mockApplicants: Applicant[] = [
  {
    id: "1",
    applicantId: "S223",
    applicantName: "Jane Doe",
    contactNo: "+91 9877123462",
    university: "harvard",
    course: "Master - Computers",
    applicantStage: "Lead",
    applicantStatus: "Apply",
    passportNo: "P0122234",
    enrollmentType: "Referred to Agency Partner",
    notes: "talked about university preference",
    status: "Active",
    createdAt: new Date("2024-01-15"),
    appliedDate: new Date("2024-01-20"),
    lastUpdatedDate: new Date("2024-01-25"),
    adminId: "arthur",
    managerId: "carlos",
    counselorId: "celina",
    intake: "jan-2026",
    agencyPartner: "apply-board",
  },
  {
    id: "2",
    applicantId: "S224",
    applicantName: "John Smith",
    contactNo: "+91 9877123463",
    university: "toronto",
    course: "Bachelor - Engineering",
    applicantStage: "Application In Progress",
    applicantStatus: "Application Complete",
    passportNo: "P0122235",
    enrollmentType: "Walk-in",
    notes: "Interested in US universities",
    status: "Active",
    createdAt: new Date("2024-02-20"),
    appliedDate: new Date("2024-02-25"),
    lastUpdatedDate: new Date("2024-03-01"),
    adminId: "arthur",
    managerId: "carlos",
    counselorId: "john",
    intake: "apr-2026",
    agencyPartner: "idp",
  },
  {
    id: "3",
    applicantId: "S225",
    applicantName: "Emily Brown",
    contactNo: "+91 9877123464",
    university: "mit",
    course: "Master - Business",
    applicantStage: "Application Submitted",
    applicantStatus: "Under Review",
    passportNo: "P0122236",
    enrollmentType: "Referred by Agency Partner",
    notes: "Waiting for offer",
    status: "Active",
    createdAt: new Date("2024-03-10"),
    appliedDate: new Date("2024-03-15"),
    lastUpdatedDate: new Date("2024-03-20"),
    adminId: "john",
    managerId: "sarah",
    counselorId: "sarah",
    intake: "jul-2026",
    agencyPartner: "study-abroad",
  },
  // Add more mock data as needed
  ...Array.from({ length: 20 }, (_, i) => ({
    id: `${i + 4}`,
    applicantId: `S${226 + i}`,
    applicantName: `Applicant ${i + 4}`,
    contactNo: `+91 9877123${String(465 + i).padStart(3, "0")}`,
    university: ["harvard", "toronto", "mit", "stanford"][i % 4],
    course: ["Master - Computers", "Bachelor - Engineering", "Master - Business"][i % 3],
    applicantStage: ["Lead", "Application In Progress", "Application Submitted", "Offer Received"][i % 4],
    applicantStatus: ["Apply", "Application Complete", "Under Review", "Offer Pending"][i % 4],
    passportNo: `P0122${String(237 + i).padStart(3, "0")}`,
    enrollmentType: ["Walk-in", "Referred to Agency Partner", "Referred by Agency Partner"][i % 3],
    notes: `Notes for applicant ${i + 4}`,
    status: i % 3 === 0 ? "Inactive" : "Active" as "Active" | "Inactive",
    createdAt: new Date(2024, 0, 15 + i * 5), // Spread dates across months
    appliedDate: new Date(2024, 0, 20 + i * 5),
    lastUpdatedDate: new Date(2024, 0, 25 + i * 5),
    adminId: ["arthur", "john", "emily"][i % 3],
    managerId: ["carlos", "sarah", "david"][i % 3],
    counselorId: ["celina", "john", "sarah"][i % 3],
    intake: ["jan-2026", "apr-2026", "jul-2026", "oct-2026"][i % 4],
    agencyPartner: ["apply-board", "idp", "study-abroad"][i % 3],
  })),
];

// Applicant Overview Item interface
export interface ApplicantOverviewItem {
  id: string;
  applicantId: string;
  applicantName: string;
  contactNo: string;
  email: string;
  notes: string;
  status: "Active" | "Inactive";
  enrollmentType?: string;
  createdAt?: Date | string;
}

// Mock data for Applicant Overview table
export const mockApplicantOverviewData: ApplicantOverviewItem[] = [
  {
    id: "1",
    applicantId: "S223",
    applicantName: "Jane Doe",
    contactNo: "+91 9877123462",
    email: "jane.doe@example.com",
    notes: "Interested in Computer Science programs",
    status: "Active",
    enrollmentType: "referred-to-agency",
    createdAt: new Date("2024-01-15"),
  },
  {
    id: "2",
    applicantId: "S224",
    applicantName: "John Smith",
    contactNo: "+91 9877123463",
    email: "john.smith@example.com",
    notes: "Preferring US universities",
    status: "Active",
    enrollmentType: "walk-in",
    createdAt: new Date("2024-02-20"),
  },
  {
    id: "3",
    applicantId: "S225",
    applicantName: "Emily Brown",
    contactNo: "+91 9877123464",
    email: "emily.brown@example.com",
    notes: "Waiting for offer letter",
    status: "Active",
    enrollmentType: "referred-by-agency",
    createdAt: new Date("2024-03-10"),
  },
  {
    id: "4",
    applicantId: "S226",
    applicantName: "Michael Johnson",
    contactNo: "+91 9877123465",
    email: "michael.j@example.com",
    notes: "Documents submitted",
    status: "Inactive",
    enrollmentType: "walk-in",
    createdAt: new Date("2024-01-25"),
  },
  {
    id: "5",
    applicantId: "S227",
    applicantName: "Sarah Wilson",
    contactNo: "+91 9877123466",
    email: "sarah.w@example.com",
    notes: "Visa application in progress",
    status: "Active",
    enrollmentType: "referred-to-agency",
    createdAt: new Date("2024-02-15"),
  },
  {
    id: "6",
    applicantId: "S228",
    applicantName: "David Lee",
    contactNo: "+91 9877123467",
    email: "david.lee@example.com",
    notes: "Enrollment completed",
    status: "Active",
    enrollmentType: "referred-by-agency",
    createdAt: new Date("2024-03-05"),
  },
  {
    id: "7",
    applicantId: "S229",
    applicantName: "Lisa Anderson",
    contactNo: "+91 9877123468",
    email: "lisa.a@example.com",
    notes: "Application under review",
    status: "Inactive",
    enrollmentType: "walk-in",
    createdAt: new Date("2024-01-30"),
  },
  {
    id: "8",
    applicantId: "S230",
    applicantName: "Robert Taylor",
    contactNo: "+91 9877123469",
    email: "robert.t@example.com",
    notes: "Interview scheduled",
    status: "Active",
    enrollmentType: "referred-to-agency",
    createdAt: new Date("2024-03-20"),
  },
  {
    id: "9",
    applicantId: "S231",
    applicantName: "Jennifer Martinez",
    contactNo: "+91 9877123470",
    email: "jennifer.m@example.com",
    notes: "Scholarship application pending",
    status: "Active",
    enrollmentType: "walk-in",
    createdAt: new Date("2024-03-25"),
  },
  {
    id: "10",
    applicantId: "S232",
    applicantName: "William Davis",
    contactNo: "+91 9877123471",
    email: "william.d@example.com",
    notes: "IELTS score submitted",
    status: "Active",
    enrollmentType: "referred-by-agency",
    createdAt: new Date("2024-04-01"),
  },
  {
    id: "11",
    applicantId: "S233",
    applicantName: "Amanda White",
    contactNo: "+91 9877123472",
    email: "amanda.w@example.com",
    notes: "Financial documents verified",
    status: "Inactive",
    enrollmentType: "referred-to-agency",
    createdAt: new Date("2024-04-05"),
  },
  {
    id: "12",
    applicantId: "S234",
    applicantName: "Christopher Brown",
    contactNo: "+91 9877123473",
    email: "christopher.b@example.com",
    notes: "University selection in progress",
    status: "Active",
    enrollmentType: "walk-in",
    createdAt: new Date("2024-04-10"),
  },
  {
    id: "13",
    applicantId: "S235",
    applicantName: "Jessica Garcia",
    contactNo: "+91 9877123474",
    email: "jessica.g@example.com",
    notes: "Recommendation letters requested",
    status: "Active",
    enrollmentType: "referred-by-agency",
    createdAt: new Date("2024-04-15"),
  },
  {
    id: "14",
    applicantId: "S236",
    applicantName: "Daniel Rodriguez",
    contactNo: "+91 9877123475",
    email: "daniel.r@example.com",
    notes: "Statement of purpose draft ready",
    status: "Active",
    enrollmentType: "referred-to-agency",
    createdAt: new Date("2024-04-20"),
  },
  {
    id: "15",
    applicantId: "S237",
    applicantName: "Michelle Lee",
    contactNo: "+91 9877123476",
    email: "michelle.l@example.com",
    notes: "Application fee paid",
    status: "Inactive",
    enrollmentType: "walk-in",
    createdAt: new Date("2024-04-25"),
  },
  {
    id: "16",
    applicantId: "S238",
    applicantName: "Matthew Wilson",
    contactNo: "+91 9877123477",
    email: "matthew.w@example.com",
    notes: "Transcripts under evaluation",
    status: "Active",
    enrollmentType: "referred-by-agency",
    createdAt: new Date("2024-05-01"),
  },
  {
    id: "17",
    applicantId: "S239",
    applicantName: "Nicole Anderson",
    contactNo: "+91 9877123478",
    email: "nicole.a@example.com",
    notes: "Portfolio submission completed",
    status: "Active",
    enrollmentType: "referred-to-agency",
    createdAt: new Date("2024-05-05"),
  },
  {
    id: "18",
    applicantId: "S240",
    applicantName: "Andrew Thompson",
    contactNo: "+91 9877123479",
    email: "andrew.t@example.com",
    notes: "Interview preparation ongoing",
    status: "Active",
    enrollmentType: "walk-in",
    createdAt: new Date("2024-05-10"),
  },
  {
    id: "19",
    applicantId: "S241",
    applicantName: "Stephanie Moore",
    contactNo: "+91 9877123480",
    email: "stephanie.m@example.com",
    notes: "Reference check in progress",
    status: "Inactive",
    enrollmentType: "referred-by-agency",
    createdAt: new Date("2024-05-15"),
  },
  {
    id: "20",
    applicantId: "S242",
    applicantName: "Kevin Jackson",
    contactNo: "+91 9877123481",
    email: "kevin.j@example.com",
    notes: "Final documentation review",
    status: "Active",
    enrollmentType: "referred-to-agency",
    createdAt: new Date("2024-05-20"),
  },
];

// Score types
export const scoreTypes: SelectOption[] = [
  { value: "percentage", label: "Percentage" },
  { value: "cgpa", label: "CGPA" },
  { value: "gpa", label: "GPA" },
];

// Achievement categories
export const achievementCategories: SelectOption[] = [
  { value: "academic", label: "Academic" },
  { value: "sports", label: "Sports" },
  { value: "volunteer", label: "Volunteer" },
  { value: "certification", label: "Certification" },
  { value: "internship", label: "Internship" },
  { value: "technical-project", label: "Technical Project" },
  { value: "leadership", label: "Leadership" },
  { value: "creative", label: "Creative" },
];

// ==========================================
// Applicant Detail - Mock Data
// ==========================================

// Mock data for applicant detail - will be replaced with API call
// This matches the first record from ApplicantTracker (id: "1", applicantId: "S223")
export const mockApplicantDetail: ApplicantDetail = {
  id: "1",
  applicantId: "S223",
  applicantName: "Jane Doe",
  applicantStage: "Lead",
  enrollmentType: "referred-to-agency",
  status: "Active",
  personalDetails: {
    profilePhoto: null,
    enrollmentType: "referred-to-agency",
    name: "Jane Doe",
    dateOfBirth: "1995-05-15",
    gender: "female",
    countryCode: "+91",
    contactNumber: "9877123462",
    emailId: "jane.doe@example.com",
    permanentAddress: "123 Main Street, New York, NY 10001, USA",
    notes: "talked about university preference",
  },
  educationalDetails: {
    highestQualification: "ug",
    institutionName: "Massachusetts Institute of Technology",
    boardUniversity: "MIT",
    program: "B.Tech",
    major: "Computer Science",
    scoreType: "cgpa",
    score: "8.5",
    passingYear: "2023-05-15",
  },
  workExperience: {
    experiences: [
      {
        id: "1",
        companyName: "Google Inc.",
        jobTitle: "Senior Software Engineer",
        startDate: "2020-01-15",
        endDate: "2023-06-30",
        currentlyWorking: false,
      },
      {
        id: "2",
        companyName: "Microsoft Corporation",
        jobTitle: "Software Engineer",
        startDate: "2018-07-01",
        endDate: "2019-12-31",
        currentlyWorking: false,
      },
      {
        id: "3",
        companyName: "Amazon Web Services",
        jobTitle: "Cloud Solutions Architect",
        startDate: "2023-07-01",
        endDate: null,
        currentlyWorking: true,
      },
      {
        id: "4",
        companyName: "Facebook (Meta)",
        jobTitle: "Frontend Developer",
        startDate: "2016-06-01",
        endDate: "2018-05-31",
        currentlyWorking: false,
      },
      {
        id: "5",
        companyName: "Apple Inc.",
        jobTitle: "iOS Developer Intern",
        startDate: "2015-06-01",
        endDate: "2015-08-31",
        currentlyWorking: false,
      },
    ],
  },
  achievements: {
    achievements: [
      {
        id: "1",
        category: "academic",
        description: "Dean's List for 3 consecutive semesters with GPA above 3.8",
        documents: "dean_list_certificate.pdf",
      },
      {
        id: "2",
        category: "sports",
        description: "Won first place in National Coding Competition 2022",
        documents: "coding_competition_certificate.pdf",
      },
      {
        id: "3",
        category: "certification",
        description: "AWS Certified Solutions Architect - Associate",
        documents: "aws_certificate.pdf",
      },
      {
        id: "4",
        category: "technical-project",
        description: "Developed a machine learning model for predicting student success rates with 85% accuracy",
        documents: null,
      },
      {
        id: "5",
        category: "leadership",
        description: "Led a team of 10 developers in building a university management system",
        documents: "leadership_certificate.pdf",
      },
    ],
  },
  documents: {
    documents: [
      {
        id: "1",
        name: "Passport",
        type: "passport",
        uploaded: true,
        verified: true,
        fileUrl: "/sample.pdf",
        fileName: "passport.pdf",
      },
      {
        id: "2",
        name: "Transcripts (UG)",
        type: "transcript",
        uploaded: false,
        verified: false,
      },
      {
        id: "3",
        name: "Letters of Recommendation",
        type: "letter",
        uploaded: false,
        verified: false,
      },
      {
        id: "4",
        name: "Statement of Purpose",
        type: "statement",
        uploaded: false,
        verified: false,
      },
      {
        id: "5",
        name: "Resume",
        type: "resume",
        uploaded: false,
        verified: false,
      },
      {
        id: "6",
        name: "Financial Statement",
        type: "financial",
        uploaded: false,
        verified: false,
      },
    ],
  },
  applications: [
    {
      id: "1",
      no: 1,
      university: "MIT",
      country: "USA",
      course: "Master - Computers",
      applicationStage: "Application In Progress",
      status: "Application Incomplete",
      intake: "jan-2026",
      counselor: "celina",
      agencyPartner: "apply-board",
      appliedDate: "6 May 2025",
      lastUpdated: "2 Jul 2025",
    },
    {
      id: "2",
      no: 2,
      university: "Stanford University",
      country: "USA",
      course: "Master - Computer Science",
      applicationStage: "Lead",
      status: "Apply",
      intake: "sep-2026",
      counselor: "celina",
      agencyPartner: "idp",
      appliedDate: "",
      lastUpdated: "",
    },
  ],
  notes: "talked about university preference",
};

