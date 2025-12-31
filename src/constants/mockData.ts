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
      'By accessing or using our Immigration CRM platform ("Platform"), you agree to be bound by these Terms and Conditions. If you do not agree, you may not use the Platform.',
  },
  {
    title: "2. Services Provided",
    content: `The Platform is designed to help immigration consultants/agencies:
Manage candidate profiles. Track visa and university application statuses. Upload and store supporting documents. Communicate with clients and internal staff. We do not provide legal immigration advice through the Platform.`,
  },
  {
    title: "3. Client Data and Privacy",
    content: `The Platform stores sensitive client information (passport, visa docs, transcripts, etc.). All data is protected using encryption and access control. Agencies must obtain consent from clients before uploading their personal documents.
Refer to our Privacy Policy for complete details.`,
  },
  {
    title: "4. Document Management",
    content: `Uploaded documents are stored in structured folders (e.g., by client or application type). Deleted files may be recoverable from system backup logs or archives for up to 30 days.
Agencies are responsible for uploading valid, authentic, and non-expired documents.`,
  },
  {
    title: "5. Compliance and Legal Use",
    content: `Users must comply with local immigration laws, GDPR, and data protection regulations. The Platform shall not be used to forge, manipulate, or falsify any documents or application details.
Any violation will result in suspension of access and may be reported to authorities.`,
  },
  {
    title: "6. Intellectual Property",
    content:
      "All code, features, designs, and documentation are the intellectual property of [Your Agency/Company Name]. You may not reverse-engineer, copy, or redistribute the system without written consent.",
  },
  {
    title: "7. Termination of Access",
    content:
      "We reserve the right to: Suspend or terminate access for any user violating these terms. Permanently delete data after inactivity of 12 months (with prior notice).",
  },
  {
    title: "8. Limitation of Liability",
    content: `We are not liable for:
Rejected applications or lost opportunities due to incorrect data
Actions taken by immigration authorities or consulates
Third-party delays or service failures (e.g., payment gateways, email providers)`,
  },
  {
    title: "9. Amendments",
    content:
      "We may update these Terms from time to time. Continued use of the Platform after updates constitutes your acceptance of the changes.",
  },
  {
    title: "10. Contact",
    content: "For questions or support, contact: [support@youragency.com]",
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

export const intakes: SelectOption[] = [
  { value: "jan-2025", label: "Jan - 2025" },
  { value: "apr-2025", label: "Apr - 2025" },
  { value: "jul-2025", label: "Jul - 2025" },
  { value: "oct-2025", label: "Oct - 2025" },
  { value: "jan-2026", label: "Jan - 2026" },
  { value: "apr-2026", label: "Apr - 2026" },
  { value: "jul-2026", label: "Jul - 2026" },
  { value: "oct-2026", label: "Oct - 2026" },
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
      intake: "jan-2026",
      counselor: "celina",
      agencyPartner: "apply-board",
      status: "Application Incomplete",
      appliedDate: "6 May 2025",
      lastUpdated: "2 Jul 2025",
    },
    {
      id: "2",
      no: 2,
      university: "Stanford University",
      country: "USA",
      course: "Master - Computer Science",
      intake: "sep-2026",
      counselor: "celina",
      agencyPartner: "idp",
      status: "Apply",
      appliedDate: "",
      lastUpdated: "",
    },
  ],
  notes: "talked about university preference",
};

