import { createSlice } from "@reduxjs/toolkit";
import type { PayloadAction } from "@reduxjs/toolkit";
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
  status: string;
  enrollmentType: string;
}

// Transformed applicant row for table display
export interface ApplicantOverviewRow {
  id: number;
  applicantId: number;
  applicantName: string;
  contactNo: string;
  email: string;
  notes: string;
  status: "Active" | "Inactive";
  enrollmentType: string;
  createdAt: string;
}

interface DashboardState {
  // Data
  applicants: ApplicantOverviewRow[];
  
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

const initialState: DashboardState = {
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
    sortBy: "createdAt",
    asc: false, // Descending order (newest first)
  },
  filter: {
    search: "",
    status: "",
    enrollmentType: "",
  },
};

// ==========================================
// Slice
// ==========================================

const dashboardSlice = createSlice({
  name: "dashboard",
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
      action: PayloadAction<ApplicantOverviewRow[] | PaginatedData<ApplicantOverviewRow>>
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
      
      if (!sortBy) {
        state.sort.sortBy = null;
        state.sort.asc = true;
        return;
      }
      
      if (state.sort.sortBy === sortBy) {
        state.sort.asc = asc !== undefined ? asc : !state.sort.asc;
      } else {
        state.sort.sortBy = sortBy;
        state.sort.asc = asc !== undefined ? asc : true;
      }
      state.pagination.page = 0;
    },

    // Filter actions
    setSearch: (state, action: PayloadAction<string>) => {
      state.filter.search = action.payload;
      state.pagination.page = 0;
    },

    setStatusFilter: (state, action: PayloadAction<string>) => {
      state.filter.status = action.payload;
      state.pagination.page = 0;
    },

    setEnrollmentTypeFilter: (state, action: PayloadAction<string>) => {
      state.filter.enrollmentType = action.payload;
      state.pagination.page = 0;
    },

    // Apply all filters at once
    applyFilters: (state, action: PayloadAction<FilterState>) => {
      state.filter = action.payload;
      state.pagination.page = 0;
    },

    clearFilters: (state) => {
      state.filter.search = "";
      state.filter.status = "";
      state.filter.enrollmentType = "";
      state.pagination.page = 0;
    },

    // Update applicant status locally
    updateApplicantStatus: (
      state,
      action: PayloadAction<{ id: number; status: "Active" | "Inactive" }>
    ) => {
      const { id, status } = action.payload;
      const applicant = state.applicants.find((a) => a.id === id);
      if (applicant) {
        applicant.status = status;
      }
    },

    // Reset state
    resetDashboardState: () => initialState,
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
  setSearch,
  setStatusFilter,
  setEnrollmentTypeFilter,
  applyFilters,
  clearFilters,
  updateApplicantStatus,
  resetDashboardState,
} = dashboardSlice.actions;

export default dashboardSlice.reducer;

