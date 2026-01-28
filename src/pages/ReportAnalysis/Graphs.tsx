import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { useTranslation } from "react-i18next";
import { COLORS, typography } from "../../constants";
import {
  Card,
  DataTable,
  PieChartComponent,
  BarChartComponent,
} from "../../components";
import type { GridColDef } from "../../components/DataTable/DataTable";
import type { PieChartDataItem, BarChartDataItem } from "../../components";
import { agencyService } from "../../services";
import type { TopUniversity } from "../../services/types";
import { useAppDispatch, useAppSelector } from "../../redux/hooks";
import { showLoader, hideLoader } from "../../redux/slices/loader/loaderSlice";
import { addToast } from "../../redux/slices/toast/toastSlice";
import { handleApiError } from "../../utils";
import { getApplicationStageLabel } from "../../utils";

// Chart colors for pie chart (cycling through available colors)
const chartColors = [
  COLORS.chartYellow,
  COLORS.chartRed,
  COLORS.chartTeal,
  COLORS.chartMint,
  COLORS.primary,
  COLORS.secondary,
  COLORS.accent,
  COLORS.success,
  COLORS.info,
  COLORS.warning,
];

const Graphs = () => {
  const { t } = useTranslation();
  const dispatch = useAppDispatch();
  const { user } = useAppSelector((state) => state.auth);

  // State for analytics data
  const [topUniversities, setTopUniversities] = useState<TopUniversity[]>([]);
  const [countriesData, setCountriesData] = useState<PieChartDataItem[]>([]);
  const [applicantProgressData, setApplicantProgressData] = useState<BarChartDataItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Refs to prevent duplicate API calls
  const isLoadingRef = useRef(false);
  const hasFetchedRef = useRef(false);
  const lastAgencyIdRef = useRef<number | null>(null);

  // Fetch analytics data
  const fetchAnalytics = useCallback(async () => {
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
      const response = await agencyService.getAnalytics(user.agencyId, user.userId);

      if (response.status === "success" && response.data) {
        const data = response.data;

        // Map top universities
        setTopUniversities(data.topUniversities || []);

        // Map countries distribution to pie chart data
        const countriesChartData: PieChartDataItem[] = (data.countriesDistribution || []).map(
          (country, index) => ({
            name: country.name,
            value: country.count,
            color: chartColors[index % chartColors.length],
          })
        );
        setCountriesData(countriesChartData);

        // Map application stage counts to bar chart data
        const stageChartData: BarChartDataItem[] = (data.applicationStageCounts || [])
          .map((stageCount) => ({
            name: getApplicationStageLabel(stageCount.stage),
            value: stageCount.count,
          }))
          .sort((a, b) => b.value - a.value); // Sort by count descending
        setApplicantProgressData(stageChartData);

        hasFetchedRef.current = true;
        lastAgencyIdRef.current = user.agencyId;
      } else {
        throw new Error(response.message || "Failed to fetch analytics");
      }
    } catch (error) {
      const { message } = handleApiError(error, "Failed to fetch analytics data");
      dispatch(addToast({ type: "error", message }));
      // Set empty arrays on error
      setTopUniversities([]);
      setCountriesData([]);
      setApplicantProgressData([]);
    } finally {
      isLoadingRef.current = false;
      setIsLoading(false);
      dispatch(hideLoader());
    }
  }, [user?.agencyId, user?.userId, dispatch]);

  // Fetch analytics on mount and when user/agencyId changes
  useEffect(() => {
    if (user?.agencyId) {
      // Reset fetch flag if agencyId changed
      if (lastAgencyIdRef.current !== user.agencyId) {
        hasFetchedRef.current = false;
      }
      fetchAnalytics();
    }
  }, [user?.agencyId, fetchAnalytics]);

  // Columns for Top Universities table
  const universityColumns: GridColDef[] = useMemo(
    () => [
      {
        field: "name",
        headerName: t("reportAnalysis.graphs.universityName", "Top Universities"),
        flex: 1,
        minWidth: 200,
        sortable: false,
      },
      {
        field: "count",
        headerName: t(
          "reportAnalysis.graphs.successfulApplicants",
          "No. of Successful Applicants"
        ),
        flex: 1,
        minWidth: 150,
        align: "right",
        headerAlign: "right",
        sortable: false,
      },
    ],
    [t]
  );

  return (
    <div className="space-y-6">
      {/* Countries Serving & Top Universities Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Countries Serving Pie Chart */}
        <Card className="p-6">
          <h3
            className="font-semibold mb-1"
            style={{
              color: COLORS.primary,
              fontSize: typography.fontSize.h4,
              fontWeight: typography.fontWeight.semibold,
            }}
          >
            {t("reportAnalysis.graphs.countriesServing", "Countries Serving")}
          </h3>
          <p className="text-sm mb-4" style={{ color: COLORS.textMuted }}>
            {t(
              "reportAnalysis.graphs.countriesDescription",
              "Distribution of successful applicants in the country"
            )}
          </p>
          {isLoading ? (
            <div className="flex items-center justify-center h-64">
              <p style={{ color: COLORS.textMuted }}>{t("common.loading", "Loading...")}</p>
            </div>
          ) : countriesData.length > 0 ? (
            <PieChartComponent data={countriesData} />
          ) : (
            <div className="flex items-center justify-center h-64">
              <p style={{ color: COLORS.textMuted }}>
                {t("reportAnalysis.graphs.noData", "No data available")}
              </p>
            </div>
          )}
        </Card>

        {/* Top Universities Table */}
        <Card className="p-6">
          <h3
            className="font-semibold mb-4"
            style={{
              color: COLORS.primary,
              fontSize: typography.fontSize.h4,
              fontWeight: typography.fontWeight.semibold,
            }}
          >
            {t("reportAnalysis.graphs.topUniversities", "Top Universities")}
          </h3>
          {isLoading ? (
            <div className="flex items-center justify-center h-64">
              <p style={{ color: COLORS.textMuted }}>{t("common.loading", "Loading...")}</p>
            </div>
          ) : topUniversities.length > 0 ? (
            <div style={{ maxHeight: "400px", overflowY: "auto" }}>
              <DataTable
                rows={topUniversities}
                columns={universityColumns}
                hideFooter
                disableRowSelectionOnClick
              />
            </div>
          ) : (
            <div className="flex items-center justify-center h-64">
              <p style={{ color: COLORS.textMuted }}>
                {t("reportAnalysis.graphs.noData", "No data available")}
              </p>
            </div>
          )}
        </Card>
      </div>

      {/* Applicant Progress Chart Overview */}
      <Card className="p-6">
        <h3
          className="font-semibold mb-6"
          style={{
            color: COLORS.textDark,
            fontSize: typography.fontSize.h4,
            fontWeight: typography.fontWeight.semibold,
          }}
        >
          {t(
            "reportAnalysis.graphs.applicantProgressChart",
            "Applicant Progress Chart  Overview"
          )}
        </h3>
        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <p style={{ color: COLORS.textMuted }}>{t("common.loading", "Loading...")}</p>
          </div>
        ) : applicantProgressData.length > 0 ? (
          <BarChartComponent data={applicantProgressData} />
        ) : (
          <div className="flex items-center justify-center h-64">
            <p style={{ color: COLORS.textMuted }}>
              {t("reportAnalysis.graphs.noData", "No data available")}
            </p>
          </div>
        )}
      </Card>
    </div>
  );
};

export default Graphs;
