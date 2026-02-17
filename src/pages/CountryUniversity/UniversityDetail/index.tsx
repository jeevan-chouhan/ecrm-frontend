import { useState, useMemo, useCallback } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Layout, Button } from "../../../components";
import { COLORS, ROUTES, typography } from "../../../constants";
import { ArrowLeft } from "../../../assets";

// Types
import type { UniversityDetail, TabType, Tab } from "./types";

// Tab Components
import {
  CollegeInfoTab,
  FeesTab,
  ScholarshipTab,
  EligibilityTab,
  AdmissionsTab,
  DocumentsTab,
  CampusTab,
} from "./tabs";

// Mock data for demonstration
const getMockUniversityDetail = (universityId: string): UniversityDetail => ({
  id: parseInt(universityId, 10),
  name: universityId === "1" ? "Technical University of Munich" : "Massachusetts Institute of Technology",
  shortName: universityId === "1" ? "TUM" : "MIT",
  location: universityId === "1" ? "Munich" : "Cambridge, Massachusetts",
  country: universityId === "1" ? "Germany" : "USA",
  bannerImage: "https://images.unsplash.com/photo-1564981797816-1043664bf78d?w=800",
  logoImage: "",
  website: "https://www.mit.edu",
  description: universityId === "1" 
    ? "The Technical University of Munich (TUM) is one of Europe's leading universities, combining excellence in research and teaching. TUM is committed to nurturing top talents and creating knowledge for society." 
    : "The Massachusetts Institute of Technology (MIT) is a private research university in Cambridge, Massachusetts. Founded in 1861, MIT has played a significant role in the development of many areas of modern technology and science.",
  highlights: [
    "World-renowned faculty and research facilities",
    "Strong industry partnerships and internship opportunities",
    "Diverse international student community",
    "State-of-the-art laboratories and libraries",
  ],
  courses: [
    {
      id: 1,
      name: "Master of Science in Architecture Studies (SMArchS)",
      level: "Masters",
      duration: "2 years",
      tuitionFees: "$28,000/year",
      examsAccepted: ["IELTS", "TOEFL", "GRE"],
    },
    {
      id: 2,
      name: "Bachelor of Computer Science and Engineering",
      level: "Bachelors",
      duration: "4 years",
      tuitionFees: "$30,000/year",
      examsAccepted: ["IELTS", "TOEFL", "SAT"],
    },
    {
      id: 3,
      name: "Master of Business Administration (MBA)",
      level: "Masters",
      duration: "2 years",
      tuitionFees: "$45,000/year",
      examsAccepted: ["GMAT", "GRE", "TOEFL"],
    },
    {
      id: 4,
      name: "PhD in Electrical Engineering",
      level: "Doctorate",
      duration: "4-5 years",
      tuitionFees: "$35,000/year",
      examsAccepted: ["GRE", "TOEFL"],
    },
  ],
  eligibilityItems: [
    "Bachelor's degree from an accredited institution with minimum 3.0 GPA",
    "Strong academic background in relevant field",
    "English proficiency (IELTS 7.0+ or TOEFL 100+)",
    "Standardized test scores (GRE/GMAT as per program)",
    "Letters of recommendation (2-3)",
    "Statement of purpose",
  ],
  eligibilityCriteria: [
    {
      programType: "Bachelor's",
      description: [
        "university entrance qualification (Abitur, IB, or equivalent)",
        "English: IELTS 6.5 / TOEFL 88 (or equivalent)",
        "German: typically B2-C2",
        "GPA, GRE/GMAT scores, and interviews",
        "minimum 8-week internship",
      ],
    },
    {
      programType: "Master's",
      description: [
        "Bachelor's degree from a recognized institution (relevant field)",
        "Subject-specific requirements: high GPA (varies by program; examples >= 7.5 or >= 8.5)",
        "Tests (if required): GRE/GATE (e.g., GRE 164Q / 4.0W or top percentile), GMAT (e.g., 585+)",
        "interviews or additional assessments",
      ],
    },
  ],
  campusInfo: "MIT's 168-acre campus spans approximately a mile of the Cambridge side of the Charles River basin. The campus features world-class facilities and a vibrant student life.",
  campusHighlights: [
    "Modern research laboratories",
    "Extensive library system with 2.9M+ volumes",
    "Sports facilities and recreation centers",
    "Student housing and dining options",
    "Innovation hubs and maker spaces",
  ],
  fees: [
    { label: "Tuition Fee (per year)", amount: "$53,790" },
    { label: "Student Activity Fee", amount: "$340" },
    { label: "Housing (on-campus)", amount: "$11,000" },
    { label: "Meal Plan", amount: "$6,500" },
    { label: "Books & Supplies", amount: "$1,000" },
  ],
  feeStructures: [
    {
      id: 1,
      programType: "BACHELOR",
      courseProgram: "B.Tech Computer Science",
      tuitionFeePerYear: 45000,
      tuitionFeePerYearMax: 55000,
      admissionFee: 4000,
      admissionFeeMax: 6000,
      hostelFeePerYear: 20000,
      otherFees: 8000,
      otherFeesMax: 12000,
      totalFeePerYear: 85000,
    },
    {
      id: 2,
      programType: "MASTER",
      courseProgram: "M.Tech Computer Science",
      tuitionFeePerYear: 55000,
      tuitionFeePerYearMax: 65000,
      admissionFee: 5000,
      admissionFeeMax: 7000,
      hostelFeePerYear: 22000,
      otherFees: 10000,
      otherFeesMax: 14000,
      totalFeePerYear: 100000,
    },
    {
      id: 3,
      programType: "PHD",
      courseProgram: "Ph.D. Computer Science",
      tuitionFeePerYear: 40000,
      tuitionFeePerYearMax: 50000,
      admissionFee: 4000,
      admissionFeeMax: 6000,
      hostelFeePerYear: 20000,
      otherFees: 7000,
      otherFeesMax: 9000,
      totalFeePerYear: 78000,
    },
  ],
  admissionSteps: [
    { step: 1, title: "Online Application", description: "Submit your application through the official portal with required details" },
    { step: 2, title: "Document Submission", description: "Upload transcripts, test scores, essays, and recommendations" },
    { step: 3, title: "Application Review", description: "Applications are reviewed holistically by the admissions committee" },
    { step: 4, title: "Interview (if required)", description: "Selected candidates may be invited for an interview" },
    { step: 5, title: "Decision", description: "Receive admission decision via email and portal" },
  ],
  admissionDetails: [
    {
      programType: "Bachelor's",
      admissionProcedure: "Applicants will be granted admission to a program with unrestricted admission when the online application was submitted in time and complete with all required documents, and your documents have been reviewed.",
    },
    {
      programType: "Master's",
      admissionProcedure: "In the initial stage of this procedure, the grades you obtained during your Bachelor's program, as well as your written documents, will be evaluated using a point system. Depending on the number of points accumulated, applicants are either immediately admitted, rejected, or invited to a 20 minute admissions interview carried out by the school. In some cases interviews by telephone or video for international students are common. The interview helps determine if the applicant is capable of successfully completing the desired course of study. For some programs offered by the TUM School of Engineering and Design and the TUM School of Management a written test or the assessment of your academic qualification and your essay replace the interview.",
    },
  ],
  documents: [
    "Official Academic Transcripts",
    "Standardized Test Scores (IELTS/TOEFL/GRE/GMAT)",
    "Statement of Purpose (500-1000 words)",
    "Letters of Recommendation (2-3)",
    "Resume/CV",
    "Portfolio (for specific programs)",
    "Passport Copy",
    "Financial Documents",
  ],
  programSpecificDocuments: [
    {
      programType: "Bachelor's",
      documents: [
        "Certified Copies of Certificates",
        "Change of Program or Subject",
        "Mandatory Health Insurance",
        "Online Application",
        "Proof of German-Language Skills",
        "Proof of English-Language Skills",
        "Recognizing Credits",
        "Reserving your Spot",
        "Special Conditions for Certain Countries",
        "StudentCard",
        "Uni-Assist (recognition of international university entrance qualification)",
      ],
    },
    {
      programType: "Master's",
      documents: [
        "Certified Copies of Certificates",
        "Mandatory Health Insurance",
        "Online Application",
        "Proof of German-Language Skills",
        "Proof of English-Language Skills",
        "Recognizing Credits",
        "Uni-Assist (recognition of international university entrance qualification)",
      ],
    },
  ],
  scholarships: [
    { name: "Merit-Based Scholarship", amount: "Up to $25,000/year", eligibility: "Outstanding academic performance" },
    { name: "Graduate Fellowship", amount: "Full tuition + stipend", eligibility: "PhD students with research potential" },
    { name: "Teaching Assistantship", amount: "Tuition waiver + $2,000/month", eligibility: "Graduate students" },
    { name: "Need-Based Financial Aid", amount: "Varies", eligibility: "Demonstrated financial need" },
  ],
});

const UniversityDetailPage = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { universityId } = useParams<{ universityId: string }>();
  
  const [activeTab, setActiveTab] = useState<TabType>("collegeInfo");

  // Get university detail (mock data)
  const universityDetail = useMemo(() => {
    if (!universityId) return null;
    return getMockUniversityDetail(universityId);
  }, [universityId]);

  // Tab configuration - Logical sequence
  const tabs: Tab[] = useMemo(
    () => [
      { id: "collegeInfo", labelKey: "universityDetail.tabs.collegeInfo", defaultLabel: "College Info" },
      { id: "campus", labelKey: "universityDetail.tabs.campus", defaultLabel: "Campus" },
      { id: "fees", labelKey: "universityDetail.tabs.fees", defaultLabel: "Fees" },
      { id: "scholarship", labelKey: "universityDetail.tabs.scholarship", defaultLabel: "Scholarship" },
      { id: "eligibility", labelKey: "universityDetail.tabs.eligibility", defaultLabel: "Eligibility" },
      { id: "admissions", labelKey: "universityDetail.tabs.admissions", defaultLabel: "Admissions" },
      { id: "documents", labelKey: "universityDetail.tabs.documents", defaultLabel: "Documents" },
    ],
    []
  );

  // Handle back navigation
  const handleBack = useCallback(() => {
    navigate(ROUTES.COUNTRY_UNIVERSITY);
  }, [navigate]);

  // Render active tab content
  const renderTabContent = () => {
    if (!universityDetail) return null;

    switch (activeTab) {
      case "collegeInfo":
        return <CollegeInfoTab universityId={universityId ?? undefined} />;
      case "campus":
        return <CampusTab university={universityDetail} universityId={universityId ?? null} />;
      case "fees":
        return <FeesTab university={universityDetail} />;
      case "scholarship":
        return <ScholarshipTab university={universityDetail} />;
      case "eligibility":
        return <EligibilityTab university={universityDetail} />;
      case "admissions":
        return <AdmissionsTab university={universityDetail} />;
      case "documents":
        return <DocumentsTab university={universityDetail} />;
      default:
        return null;
    }
  };

  if (!universityDetail) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-64">
          <p style={{ color: COLORS.textMuted }}>University not found</p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div
        className="bg-white rounded-lg shadow-sm"
        style={{ backgroundColor: COLORS.surface }}
      >
        {/* University name and address (back button + name + location) */}
        <div className="px-4 md:px-6 pt-4 pb-4 border-b" style={{ borderColor: COLORS.border }}>
          <div className="flex items-center gap-3">
            <Button
              variant="accent"
              icon={<ArrowLeft className="h-5 w-5" />}
              onClick={handleBack}
              rounded
              size="sm"
              className="shrink-0"
            />
            <div className="min-w-0">
              <h1
                className="text-xl md:text-2xl font-bold"
                style={{ color: COLORS.textDark }}
              >
                {universityDetail.name}
                {universityDetail.shortName && ` (${universityDetail.shortName})`}
              </h1>
              <div className="flex flex-wrap items-center gap-2 mt-2">
                <span className="text-sm" style={{ color: COLORS.accent }}>
                 {universityDetail.location}, {universityDetail.country}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div
          className="border-b overflow-x-auto px-4 md:px-6"
          style={{ borderColor: COLORS.border }}
        >
          <div className="flex gap-1 min-w-max">
            {tabs.map((tab) => {
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className="px-4 py-3 font-medium whitespace-nowrap transition-colors relative"
                  style={{
                    fontSize: typography.fontSize.body,
                    color: isActive ? COLORS.accent : COLORS.textMuted,
                    backgroundColor: "transparent",
                  }}
                >
                  {t(tab.labelKey, tab.defaultLabel)}
                  {isActive && (
                    <div
                      className="absolute bottom-0 left-0 right-0 h-0.5"
                      style={{ backgroundColor: COLORS.accent }}
                    />
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Tab Content */}
        <div className="p-4 md:p-6 min-h-[300px]">
          {renderTabContent()}
        </div>
      </div>
    </Layout>
  );
};

export default UniversityDetailPage;
