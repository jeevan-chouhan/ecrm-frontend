import { useMemo } from "react";
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

// Mock data for Countries Serving pie chart
const countriesData: PieChartDataItem[] = [
  { name: "USA", value: 30, color: "#F7C948" },
  { name: "Canada", value: 30, color: "#EF7B7B" },
  { name: "Australia", value: 30, color: "#4ECDC4" },
  { name: "Other", value: 10, color: "#95E1D3" },
];

// Mock data for Top Universities table
const topUniversities = [
  { id: 1, name: "Harvard University", count: 45 },
  { id: 2, name: "University of Toronto", count: 38 },
  { id: 3, name: "Oxford University", count: 32 },
  { id: 4, name: "MIT", count: 28 },
  { id: 5, name: "Other", count: 25 },
];

// Mock data for Applicant Progress bar chart
const applicantProgressData: BarChartDataItem[] = [
  { name: "Lead", value: 26 },
  { name: "Application In Progress", value: 15 },
  { name: "Application Submitted", value: 14 },
  { name: "Offer Awaiting", value: 8 },
  { name: "Offer Received", value: 11 },
  { name: "Offer Status - Accepted", value: 7 },
  { name: "Deposits", value: 9 },
  { name: "Application Rejected", value: 6 },
  { name: "Application Accepted", value: 4 },
  { name: "Visa", value: 13 },
  { name: "Applicant Rejected", value: 2 },
  { name: "Applicant Enrolled", value: 13 },
];

const Graphs = () => {
  const { t } = useTranslation();

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
      <div>
        <h2
          className="text-lg font-semibold"
          style={{
            color: COLORS.textDark,
            fontSize: typography.fontSize.h3,
            fontWeight: typography.fontWeight.semibold,
          }}
        >
          {t("reportAnalysis.graphs.title", "Graphs")}
        </h2>
        <p style={{ color: COLORS.textMuted }}>
          {t(
            "reportAnalysis.graphs.description",
            "View Analytics And Visual Reports"
          )}
        </p>
      </div>

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
          <PieChartComponent data={countriesData} />
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
          <DataTable
            rows={topUniversities}
            columns={universityColumns}
            hideFooter
            disableRowSelectionOnClick
          />
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
        <BarChartComponent data={applicantProgressData} />
      </Card>
    </div>
  );
};

export default Graphs;
