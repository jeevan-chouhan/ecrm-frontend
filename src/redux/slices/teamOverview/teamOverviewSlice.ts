import { createSlice } from "@reduxjs/toolkit";
import type { PayloadAction } from "@reduxjs/toolkit";
import type { TeamOverviewItem, PaginatedData } from "../../../services/types";

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
  admin: string;
  manager: string;
  counselor: string;
  enrollmentType: string;
  fromDate: string | null; // ISO string format for serialization
  toDate: string | null; // ISO string format for serialization
}

interface TeamOverviewState {
  // Data
  teamOverviewData: TeamOverviewItem[];
  
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

const initialState: TeamOverviewState = {
  teamOverviewData: [],
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
    sortBy: "name", // Default sort by name
    asc: true, // Default ascending
  },
  filter: {
    admin: "",
    manager: "",
    counselor: "",
    enrollmentType: "",
    fromDate: null,
    toDate: null,
  },
};

// ==========================================
// Slice
// ==========================================

const teamOverviewSlice = createSlice({
  name: "teamOverview",
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

    // Set team overview data (handles both array and paginated response)
    setTeamOverviewData: (
      state,
      action: PayloadAction<TeamOverviewItem[] | PaginatedData<TeamOverviewItem>>
    ) => {
      const data = action.payload;
      state.isLoading = false;
      state.error = null;

      if (Array.isArray(data)) {
        state.teamOverviewData = data;
        state.pagination.totalElements = data.length;
        state.pagination.totalPages = 1;
        state.pagination.first = true;
        state.pagination.last = true;
      } else if (data && "content" in data) {
        state.teamOverviewData = data.content || [];
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
        state.sort.sortBy = "name";
        state.sort.asc = true;
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
      state.sort.sortBy = "name";
      state.sort.asc = true;
    },

    // Filter actions
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

    setEnrollmentTypeFilter: (state, action: PayloadAction<string>) => {
      state.filter.enrollmentType = action.payload;
      state.pagination.page = 0;
    },

    setFromDateFilter: (state, action: PayloadAction<string | null>) => {
      state.filter.fromDate = action.payload;
      state.pagination.page = 0;
    },

    setToDateFilter: (state, action: PayloadAction<string | null>) => {
      state.filter.toDate = action.payload;
      state.pagination.page = 0;
    },

    // Apply all filters at once
    applyFilters: (state, action: PayloadAction<FilterState>) => {
      state.filter = action.payload;
      state.pagination.page = 0;
    },

    clearFilters: (state) => {
      state.filter.admin = "";
      state.filter.manager = "";
      state.filter.counselor = "";
      state.filter.enrollmentType = "";
      state.filter.fromDate = null;
      state.filter.toDate = null;
      state.pagination.page = 0;
    },

    // Reset state
    resetTeamOverviewState: () => initialState,
  },
});

// ==========================================
// Exports
// ==========================================

export const {
  setLoading,
  setError,
  setTeamOverviewData,
  setPage,
  setPageSize,
  setSort,
  clearSort,
  setAdminFilter,
  setManagerFilter,
  setCounselorFilter,
  setEnrollmentTypeFilter,
  setFromDateFilter,
  setToDateFilter,
  applyFilters,
  clearFilters,
  resetTeamOverviewState,
} = teamOverviewSlice.actions;

export default teamOverviewSlice.reducer;

