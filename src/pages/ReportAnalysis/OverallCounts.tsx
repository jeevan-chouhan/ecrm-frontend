import { useState, useEffect, useCallback, useRef } from "react";
import { useTranslation } from "react-i18next";
import { COLORS, typography } from "../../constants";
import { useAppDispatch, useAppSelector } from "../../redux/hooks";
import { showLoader, hideLoader } from "../../redux/slices/loader/loaderSlice";
import { addToast } from "../../redux/slices/toast/toastSlice";
import { agencyService } from "../../services";
import { handleApiError } from "../../utils";

interface StatCard {
  label: string;
  value: number;
}

const OverallCounts = () => {
  const { t } = useTranslation();
  const dispatch = useAppDispatch();
  const { user } = useAppSelector((state) => state.auth);
  const [stats, setStats] = useState<StatCard[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  
  // Refs to prevent duplicate API calls and track loading state
  const isLoadingRef = useRef(false);
  const hasFetchedRef = useRef(false);
  const lastAgencyIdRef = useRef<number | null>(null);

  /**
   * Fetch overall counts from API
   */
  const fetchOverallCounts = useCallback(async () => {
    if (!user?.agencyId) {
      return;
    }

    // Prevent duplicate calls
    if (isLoadingRef.current) {
      return;
    }

    // Skip if already fetched for this agencyId
    if (hasFetchedRef.current && lastAgencyIdRef.current === user.agencyId) {
      return;
    }

    isLoadingRef.current = true;
    setIsLoading(true);
    dispatch(showLoader());

    try {
      const response = await agencyService.getOverallCounts(user.agencyId);

      if (response.status === "success" && response.data) {
        const data = response.data;
        const statsData: StatCard[] = [
          // Applicants group
          {
            label: t("reportAnalysis.overallCounts.totalApplicants", "Total Applicants"),
            value: data.totalApplicants,
          },
          {
            label: t("reportAnalysis.overallCounts.totalActiveApplicants", "Total Active Applicants"),
            value: data.totalActiveApplicants,
          },
          {
            label: t("reportAnalysis.overallCounts.totalInactiveApplicants", "Total Inactive Applicants"),
            value: data.totalInactiveApplicants,
          },
          // Applications group
          {
            label: t("reportAnalysis.overallCounts.totalApplications", "Total Applications"),
            value: data.totalApplications,
          },
          {
            label: t("reportAnalysis.overallCounts.totalActiveApplications", "Total Active Applications"),
            value: data.totalActiveApplications,
          },
          {
            label: t("reportAnalysis.overallCounts.totalInactiveApplications", "Total Inactive Applications"),
            value: data.totalInactiveApplications,
          },
          {
            label: t("reportAnalysis.overallCounts.totalEnrolledApplications", "Total Enrolled Applications"),
            value: data.totalEnrolledApplications,
          },
          {
            label: t("reportAnalysis.overallCounts.totalInProgressApplications", "Total In-progress Applications"),
            value: data.totalInProgressApplications,
          },
          {
            label: t("reportAnalysis.overallCounts.totalRejectedApplications", "Total Rejected Applications"),
            value: data.totalRejectedApplications,
          },
          // Other metrics
          {
            label: t("reportAnalysis.overallCounts.totalAgencyPartners", "Total Agency Partners"),
            value: data.totalAgencyPartners,
          },
          {
            label: t("reportAnalysis.overallCounts.totalUsers", "Total Users"),
            value: data.totalUsers,
          },
        ];
        setStats(statsData);
        hasFetchedRef.current = true;
        lastAgencyIdRef.current = user.agencyId;
      } else {
        throw new Error(response.message || "Failed to fetch overall counts");
      }
    } catch (error: any) {
      const { message } = handleApiError(error, "Failed to fetch overall counts");
      dispatch(addToast({ type: "error", message }));
      setStats([]);
      // Reset fetch flag on error to allow retry
      hasFetchedRef.current = false;
    } finally {
      isLoadingRef.current = false;
      setIsLoading(false);
      dispatch(hideLoader());
    }
  }, [user?.agencyId, dispatch, t]);

  // Fetch data on mount or when agencyId changes
  useEffect(() => {
    if (user?.agencyId) {
      // Reset fetch flag if agencyId changed
      if (lastAgencyIdRef.current !== user.agencyId) {
        hasFetchedRef.current = false;
      }
      fetchOverallCounts();
    }
    
    // Cleanup: reset flags if component unmounts or user changes
    return () => {
      if (!user?.agencyId) {
        hasFetchedRef.current = false;
        lastAgencyIdRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.agencyId]);

  return (
    <div className="space-y-6">
      {/* Stats Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {isLoading ? (
          // Loading state
          Array.from({ length: 11 }).map((_, index) => (
            <div
              key={index}
              className="bg-white rounded-xl p-5 shadow-sm"
              style={{
                border: `1px solid ${COLORS.border}`,
              }}
            >
              <div className="animate-pulse">
                <div className="h-4 bg-gray-200 rounded mb-2 w-3/4"></div>
                <div className="h-8 bg-gray-200 rounded w-1/2"></div>
              </div>
            </div>
          ))
        ) : stats.length > 0 ? (
          // Stats cards
          stats.map((stat, index) => (
            <div
              key={index}
              className="bg-white rounded-xl p-5 shadow-sm hover:shadow-md transition-shadow"
              style={{
                border: `1px solid ${COLORS.border}`,
              }}
            >
              <p
                className="text-sm mb-2"
                style={{
                  color: COLORS.textMuted,
                  fontSize: typography.fontSize.small,
                }}
              >
                {stat.label}
              </p>
              <p
                className="text-3xl font-bold"
                style={{
                  color: COLORS.textDark,
                  fontSize: typography.fontSize.h1,
                  fontWeight: typography.fontWeight.bold,
                }}
              >
                {stat.value}
              </p>
            </div>
          ))
        ) : (
          // Empty state
          <div className="col-span-full text-center py-8">
            <p style={{ color: COLORS.textMuted }}>
              {t("reportAnalysis.overallCounts.noData", "No data available")}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default OverallCounts;
