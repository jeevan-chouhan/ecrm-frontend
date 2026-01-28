import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Layout, Button } from "../../components";
import { COLORS, ROUTES, UserRole } from "../../constants";
import { useAppSelector } from "../../redux/hooks";
import ApplicantOverview from "./ApplicantOverview";

// Maximum applicants limit
const MAX_APPLICANTS = 49;

const Dashboard = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { accessToken, user } = useAppSelector((state) => state.auth);
  const { pagination } = useAppSelector((state) => state.dashboard);

  // Check if applicant limit is reached
  const isApplicantLimitReached = pagination.totalElements >= MAX_APPLICANTS;
  
  // Check if user is counselor
  const isCounsellor = user?.role?.toUpperCase() === UserRole.COUNSELLOR;

  // Decode and log access token on dashboard load (for debugging)
  useEffect(() => {
    if (import.meta.env.DEV && accessToken) {
      try {
        // JWT token has 3 parts: header.payload.signature
        const tokenParts = accessToken.split('.');
        if (tokenParts.length === 3) {
          const decodedPayload = JSON.parse(atob(tokenParts[1]));
          console.log('=== Dashboard - Decoded Access Token ===');
          console.log('Token:', accessToken);
          console.log('Decoded Payload:', decodedPayload);
          console.log('User from Redux:', user);
          console.log('=========================================');
        }
      } catch (decodeError) {
        console.error('Failed to decode token:', decodeError);
      }
    }
  }, [accessToken, user]);

  const handleAddApplicant = () => {
    navigate(ROUTES.CREATE_APPLICANT);
  };

  return (
    <Layout>
      <div
        className="bg-white rounded-lg shadow-sm p-4 md:p-6 space-y-6"
        style={{ backgroundColor: COLORS.surface }}
      >
        {/* Title Row - Dashboard on left, Add Applicant on right */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <h1
            className="text-xl md:text-2xl font-bold"
            style={{ color: COLORS.textDark }}
          >
            {t("dashboard.title", "Dashboard")}
          </h1>
          {/* Hide Add Applicant button for counselors */}
          {!isCounsellor && (
            <Button 
              variant="accent" 
              size="md" 
              rounded 
              onClick={handleAddApplicant}
              disabled={isApplicantLimitReached}
              title={isApplicantLimitReached ? t("dashboard.applicantLimitReached", "Applicant limit (50) reached. Upgrade your plan to add more.") : undefined}
            >
              {t("dashboard.addApplicant", "Add Applicant")}
            </Button>
          )}
        </div>

        {/* Applicant Overview Section */}
        <ApplicantOverview />
      </div>
    </Layout>
  );
};

export default Dashboard;
