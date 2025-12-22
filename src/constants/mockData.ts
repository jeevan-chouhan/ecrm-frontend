import type { SelectOption } from "../components";

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

