import { useState, useEffect, useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  Layout,
  DataTable,
  Button,
} from "../../components";
import type { GridColDef } from "../../components";
import { COLORS, ROUTES } from "../../constants";
import { Eye } from "../../assets";
import { userService } from "../../services";
import type { CountryItem, UniversityItem } from "../../services";
import { useAppSelector, useAppDispatch } from "../../redux/hooks";
import { showLoader, hideLoader } from "../../redux/slices/loader/loaderSlice";
import FilterComponent from "./FilterComponent";

// Extended university interface with additional fields for display
interface UniversityDisplayItem extends UniversityItem {
  location?: string;
  type?: string;
  coursesOffered?: number;
  tuitionFees?: string;
  scholarships?: number;
}

// Mock data for universities
const mockUniversities: UniversityDisplayItem[] = [
  {
    id: 1,
    name: "Technical University of Munich",
    countryId: 1,
    countryName: "Germany",
    location: "Munich, Germany",
    type: "Public",
    coursesOffered: 4,
    tuitionFees: "$40,000",
    scholarships: 2,
  },
  {
    id: 2,
    name: "Massachusetts Institute of Technology",
    countryId: 2,
    countryName: "USA",
    location: "Cambridge, USA",
    type: "Private",
    coursesOffered: 2,
    tuitionFees: "$82,000",
    scholarships: 1,
  },
];

// Mock data for countries
const mockCountries: CountryItem[] = [
  { id: 1, name: "Germany", code: "DE" },
  { id: 2, name: "USA", code: "US" },
  { id: 3, name: "Singapore", code: "SG" },
];

const CountryUniversity = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { user } = useAppSelector((state) => state.auth);

  // Stats
  const [countriesCount, setCountriesCount] = useState(mockCountries.length);
  const [universitiesCount, setUniversitiesCount] = useState(mockUniversities.length);

  // Data
  const [countries, setCountries] = useState<CountryItem[]>(mockCountries);
  const [universities, setUniversities] = useState<UniversityDisplayItem[]>(mockUniversities);
  const [filteredUniversities, setFilteredUniversities] = useState<UniversityDisplayItem[]>(mockUniversities);

  // Search (works independently)
  const [searchValue, setSearchValue] = useState("");

  // Filter states (pending filters - not applied yet)
  const [pendingCountry, setPendingCountry] = useState("");

  // Applied filters
  const [appliedCountry, setAppliedCountry] = useState("");

  // Loading states
  const [isLoadingCountries, setIsLoadingCountries] = useState(false);

  // Pagination
  const [paginationModel, setPaginationModel] = useState({
    page: 0,
    pageSize: 10,
  });

  // Fetch countries
  const fetchCountries = useCallback(async () => {
    if (!user?.agencyId) return;
    setIsLoadingCountries(true);
    try {
      const response = await userService.getCountries(user.agencyId);
      let countriesList: CountryItem[] = [];
      if (Array.isArray(response)) {
        countriesList = response;
      } else if (response.data) {
        countriesList = response.data;
      }
      // Only update if we got data, otherwise keep existing/mock data
      if (countriesList.length > 0) {
        setCountries(countriesList);
        setCountriesCount(countriesList.length);
      }
    } catch (error) {
      // Keep mock data on error - don't show toast for better UX with mock data
    } finally {
      setIsLoadingCountries(false);
    }
  }, [user?.agencyId]);

  // Fetch universities
  const fetchUniversities = useCallback(
    async (countryId?: number | null) => {
      if (!user?.agencyId) return;
      dispatch(showLoader());
      try {
        const response = await userService.getUniversities({
          agencyId: user.agencyId,
          countryId: countryId || null,
        });

        let universitiesList: UniversityDisplayItem[] = [];
        if (Array.isArray(response)) {
          universitiesList = response.map((uni) => ({
            ...uni,
            location: uni.countryName || "N/A",
            type: "Public",
            coursesOffered: Math.floor(Math.random() * 10) + 1,
            tuitionFees: `$${(Math.floor(Math.random() * 50) + 10) * 1000}`,
            scholarships: Math.floor(Math.random() * 5) + 1,
          }));
        } else if (response.data) {
          universitiesList = response.data.map((uni) => ({
            ...uni,
            location: uni.countryName || "N/A",
            type: "Public",
            coursesOffered: Math.floor(Math.random() * 10) + 1,
            tuitionFees: `$${(Math.floor(Math.random() * 50) + 10) * 1000}`,
            scholarships: Math.floor(Math.random() * 5) + 1,
          }));
        }

        // Only update if we got data, otherwise keep existing/mock data
        if (universitiesList.length > 0) {
          setUniversities(universitiesList);
          setFilteredUniversities(universitiesList);
          setUniversitiesCount(universitiesList.length);
        }
      } catch (error) {
        // Keep mock data on error - don't clear the list
      } finally {
        dispatch(hideLoader());
      }
    },
    [user?.agencyId, dispatch, t]
  );

  // Initial data fetch
  useEffect(() => {
    fetchCountries();
    fetchUniversities();
  }, [fetchCountries, fetchUniversities]);

  // Apply search filter independently (real-time)
  useEffect(() => {
    let filtered = [...universities];

    // Apply search filter
    if (searchValue.trim()) {
      const searchLower = searchValue.toLowerCase();
      filtered = filtered.filter(
        (uni) =>
          uni.name.toLowerCase().includes(searchLower) ||
          uni.location?.toLowerCase().includes(searchLower)
      );
    }

    // Apply applied filters (not pending)
    if (appliedCountry) {
      filtered = filtered.filter(
        (uni) => uni.countryId?.toString() === appliedCountry
      );
    }

    setFilteredUniversities(filtered);
  }, [searchValue, universities, appliedCountry]);

  // Handle Apply filters
  const handleApplyFilters = useCallback(() => {
    setAppliedCountry(pendingCountry);

    // Fetch universities with selected country
    if (pendingCountry) {
      fetchUniversities(parseInt(pendingCountry, 10));
    } else {
      fetchUniversities(null);
    }
  }, [pendingCountry, fetchUniversities]);

  // Handle Clear filters
  const handleClearFilters = useCallback(() => {
    setPendingCountry("");
    setAppliedCountry("");
    fetchUniversities(null);
  }, [fetchUniversities]);

  // Handle view university - Navigate to detail page
  const handleViewUniversity = useCallback((university: UniversityDisplayItem) => {
    navigate(ROUTES.UNIVERSITY_DETAIL.replace(":universityId", university.id.toString()));
  }, [navigate]);

  // DataTable columns
  const columns: GridColDef[] = useMemo(
    () => [
      {
        field: "name",
        headerName: t("countryUniversity.universityName", "University Name"),
        flex: 2,
        minWidth: 250,
        renderCell: (params) => (
          <div>
            <div
              className="font-medium"
              style={{ color: COLORS.textDark }}
            >
              {params.row.name}
            </div>
            <div
              className="text-xs"
              style={{ color: COLORS.textMuted }}
            >
              {params.row.location}
            </div>
          </div>
        ),
      },
      {
        field: "type",
        headerName: t("countryUniversity.type", "Type"),
        flex: 0.8,
        minWidth: 100,
        renderCell: (params) => (
          <span
            className="px-2 py-1 rounded-full text-xs font-medium"
            style={{
              backgroundColor: params.row.type === "Public" ? "#E3F2FD" : "#FFF3E0",
              color: params.row.type === "Public" ? "#1565C0" : "#E65100",
            }}
          >
            {params.row.type || "Public"}
          </span>
        ),
      },
      {
        field: "actions",
        headerName: t("common.action", "Action"),
        flex: 0.6,
        minWidth: 80,
        sortable: false,
        renderCell: (params) => (
          <Button
            variant="ghost"
            onClick={() => handleViewUniversity(params.row)}
            className="p-2"
          >
            <Eye className="w-5 h-5" style={{ color: COLORS.accent }} />
          </Button>
        ),
      },
    ],
    [t, handleViewUniversity]
  );

  return (
    <Layout>
      <div
        className="bg-white rounded-lg shadow-sm p-4 md:p-6 space-y-6"
        style={{ backgroundColor: COLORS.surface }}
      >
        {/* Header Row */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <h1
            className="text-xl md:text-2xl font-bold"
            style={{ color: COLORS.textDark }}
          >
            {t("countryUniversity.title", "University Directory")}
          </h1>

          {/* Stats */}
          <div className="flex items-center gap-6">
            <div className="flex flex-col">
              <span className="text-sm" style={{ color: COLORS.textMuted }}>
                {t("countryUniversity.countriesServing", "Agency Countries Serving")}
              </span>
              <span className="text-xl font-bold" style={{ color: COLORS.textDark }}>
                {countriesCount}
              </span>
            </div>
            <div className="h-10 w-px" style={{ backgroundColor: COLORS.border }} />
            <div className="flex flex-col">
              <span className="text-sm" style={{ color: COLORS.textMuted }}>
                {t("countryUniversity.universitiesServing", "Agency Universities Serving")}
              </span>
              <span className="text-xl font-bold" style={{ color: COLORS.textDark }}>
                {universitiesCount}
              </span>
            </div>
          </div>
        </div>

        {/* Search, Filters and Universities Table */}
        <div>
          {/* Filter Component */}
          <FilterComponent
            searchValue={searchValue}
            onSearchChange={setSearchValue}
            pendingCountry={pendingCountry}
            onCountryChange={setPendingCountry}
            appliedCountry={appliedCountry}
            onApply={handleApplyFilters}
            onClear={handleClearFilters}
            countries={countries}
            isLoadingCountries={isLoadingCountries}
          />

          {/* Universities Table */}
          <DataTable
            rows={filteredUniversities}
            columns={columns}
            paginationModel={paginationModel}
            onPaginationModelChange={setPaginationModel}
            rowCount={filteredUniversities.length}
            paginationMode="client"
            disableRowSelectionOnClick
          />
        </div>
      </div>
    </Layout>
  );
};

export default CountryUniversity;
