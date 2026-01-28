import { createSlice } from "@reduxjs/toolkit";
import type { PayloadAction } from "@reduxjs/toolkit";
import type { Applicant } from "../../../constants";
import type { PaginatedData } from "../../../services";

// ==========================================
// Types
// ==========================================

interface PaginationState {
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
  first: boolean;
  last: boolean;
}

interface SortState {
  sortBy: string | null;
  asc: boolean;
}

interface FilterState {
  search: string;
  admin: string;
  manager: string;
  counselor: string;
  applicationStatus: string;
  applicationStage: string;
  university: string;
  intake: string;
  agencyPartner: string;
  appliedFromDate: string | null; // ISO string format for serialization
  appliedToDate: string | null; // ISO string format for serialization
  lastUpdatedFromDate: string | null; // ISO string format for serialization
  lastUpdatedToDate: string | null; // ISO string format for serialization
}

interface ApplicantTrackerState {
  // Data
  applicants: Applicant[];
  
  // Loading states
  isLoading: boolean;
  error: string | null;
  
  // Pagination
  pagination: PaginationState;
  
  // Sorting
  sort: SortState;
  
  // Filters
  filter: FilterState;
}

// ==========================================
// Initial State
// ==========================================

const initialState: ApplicantTrackerState = {
  applicants: [],
  isLoading: false,
  error: null,
  pagination: {
    page: 0,
    size: 10,
    totalElements: 0,
    totalPages: 0,
    first: true,
    last: true,
  },
  sort: {
    sortBy: "updatedAt", // Default sort by updatedAt
    asc: false, // Descending order (newest first)
  },
  filter: {
    search: "",
    admin: "",
    manager: "",
    counselor: "",
    applicationStatus: "",
    applicationStage: "",
    university: "",
    intake: "",
    agencyPartner: "",
    appliedFromDate: null,
    appliedToDate: null,
    lastUpdatedFromDate: null,
    lastUpdatedToDate: null,
  },
};

// ==========================================
// Slice
// ==========================================

const applicantTrackerSlice = createSlice({
  name: "applicantTracker",
  initialState,
  reducers: {
    // Loading state actions
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload;
      if (action.payload) {
        state.error = null;
      }
    },

    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
      state.isLoading = false;
    },

    // Set applicants data (handles both array and paginated response)
    setApplicants: (
      state,
      action: PayloadAction<Applicant[] | PaginatedData<Applicant>>
    ) => {
      const data = action.payload;
      state.isLoading = false;
      state.error = null;

      if (Array.isArray(data)) {
        state.applicants = data;
        state.pagination.totalElements = data.length;
        state.pagination.totalPages = 1;
        state.pagination.first = true;
        state.pagination.last = true;
      } else if (data && "content" in data) {
        state.applicants = data.content || [];
        state.pagination.totalElements = data.totalElements || 0;
        state.pagination.totalPages = data.totalPages || 0;
        state.pagination.first = data.first ?? true;
        state.pagination.last = data.last ?? true;
      }
    },

    // Pagination actions
    setPage: (state, action: PayloadAction<number>) => {
      state.pagination.page = action.payload;
    },

    setPageSize: (state, action: PayloadAction<number>) => {
      state.pagination.size = action.payload;
      state.pagination.page = 0; // Reset to first page
    },

    // Sorting actions
    setSort: (state, action: PayloadAction<{ sortBy: string; asc?: boolean }>) => {
      const { sortBy, asc } = action.payload;
      
      // If sortBy is empty, use default
      if (!sortBy) {
        state.sort.sortBy = "updatedAt";
        state.sort.asc = false;
        return;
      }
      
      // Toggle if same field, otherwise default to ascending
      if (state.sort.sortBy === sortBy) {
        state.sort.asc = asc !== undefined ? asc : !state.sort.asc;
      } else {
        state.sort.sortBy = sortBy;
        state.sort.asc = asc !== undefined ? asc : true;
      }
      state.pagination.page = 0; // Reset to first page
    },

    clearSort: (state) => {
      state.sort.sortBy = "updatedAt";
      state.sort.asc = false;
    },

    // Filter actions
    setSearch: (state, action: PayloadAction<string>) => {
      state.filter.search = action.payload;
      state.pagination.page = 0; // Reset to first page
    },

    setAdminFilter: (state, action: PayloadAction<string>) => {
      state.filter.admin = action.payload;
      state.pagination.page = 0;
    },

    setManagerFilter: (state, action: PayloadAction<string>) => {
      state.filter.manager = action.payload;
      state.pagination.page = 0;
    },

    setCounselorFilter: (state, action: PayloadAction<string>) => {
      state.filter.counselor = action.payload;
      state.pagination.page = 0;
    },

    setApplicationStatusFilter: (state, action: PayloadAction<string>) => {
      state.filter.applicationStatus = action.payload;
      state.pagination.page = 0;
    },

    setApplicationStageFilter: (state, action: PayloadAction<string>) => {
      state.filter.applicationStage = action.payload;
      state.pagination.page = 0;
    },

    setUniversityFilter: (state, action: PayloadAction<string>) => {
      state.filter.university = action.payload;
      state.pagination.page = 0;
    },

    setIntakeFilter: (state, action: PayloadAction<string>) => {
      state.filter.intake = action.payload;
      state.pagination.page = 0;
    },

    setAgencyPartnerFilter: (state, action: PayloadAction<string>) => {
      state.filter.agencyPartner = action.payload;
      state.pagination.page = 0;
    },

    setAppliedFromDateFilter: (state, action: PayloadAction<string | null>) => {
      state.filter.appliedFromDate = action.payload;
      state.pagination.page = 0;
    },

    setAppliedToDateFilter: (state, action: PayloadAction<string | null>) => {
      state.filter.appliedToDate = action.payload;
      state.pagination.page = 0;
    },

    setLastUpdatedFromDateFilter: (state, action: PayloadAction<string | null>) => {
      state.filter.lastUpdatedFromDate = action.payload;
      state.pagination.page = 0;
    },

    setLastUpdatedToDateFilter: (state, action: PayloadAction<string | null>) => {
      state.filter.lastUpdatedToDate = action.payload;
      state.pagination.page = 0;
    },

    // Apply all filters at once
    applyFilters: (state, action: PayloadAction<FilterState>) => {
      state.filter = action.payload;
      state.pagination.page = 0;
    },

    clearFilters: (state) => {
      state.filter.search = "";
      state.filter.admin = "";
      state.filter.manager = "";
      state.filter.counselor = "";
      state.filter.applicationStatus = "";
      state.filter.applicationStage = "";
      state.filter.university = "";
      state.filter.intake = "";
      state.filter.agencyPartner = "";
      state.filter.appliedFromDate = null;
      state.filter.appliedToDate = null;
      state.filter.lastUpdatedFromDate = null;
      state.filter.lastUpdatedToDate = null;
      state.pagination.page = 0;
    },

    // Reset state
    resetApplicantTrackerState: () => initialState,
  },
});

// ==========================================
// Exports
// ==========================================

export const {
  setLoading,
  setError,
  setApplicants,
  setPage,
  setPageSize,
  setSort,
  clearSort,
  setSearch,
  setAdminFilter,
  setManagerFilter,
  setCounselorFilter,
  setApplicationStatusFilter,
  setApplicationStageFilter,
  setUniversityFilter,
  setIntakeFilter,
  setAgencyPartnerFilter,
  setAppliedFromDateFilter,
  setAppliedToDateFilter,
  setLastUpdatedFromDateFilter,
  setLastUpdatedToDateFilter,
  applyFilters,
  clearFilters,
  resetApplicantTrackerState,
} = applicantTrackerSlice.actions;

export default applicantTrackerSlice.reducer;

