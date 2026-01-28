import { createSlice } from "@reduxjs/toolkit";
import type { PayloadAction } from "@reduxjs/toolkit";
import type { UniversityApplication } from "../../../pages/ApplicantTracker/ApplicantDetail/types";
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

interface ApplicantDetailState {
  // Data
  applications: UniversityApplication[];
  
  // Loading states
  isLoading: boolean;
  error: string | null;
  
  // Pagination
  pagination: PaginationState;
  
  // Sorting
  sort: SortState;
  
  // Current applicantId (to reset state when applicant changes)
  currentApplicantId: string | null;
}

// ==========================================
// Initial State
// ==========================================

const initialState: ApplicantDetailState = {
  applications: [],
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
  currentApplicantId: null,
};

// ==========================================
// Slice
// ==========================================

const applicantDetailSlice = createSlice({
  name: "applicantDetail",
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

    // Set applications data (handles both array and paginated response)
    setApplications: (
      state,
      action: PayloadAction<UniversityApplication[] | PaginatedData<UniversityApplication> | { applications: UniversityApplication[]; totalElements: number }>
    ) => {
      const data = action.payload;
      state.isLoading = false;
      state.error = null;

      if (Array.isArray(data)) {
        state.applications = data;
        state.pagination.totalElements = data.length;
        state.pagination.totalPages = 1;
        state.pagination.first = true;
        state.pagination.last = true;
      } else if (data && "content" in data) {
        // PaginatedData format
        state.applications = data.content || [];
        state.pagination.totalElements = data.totalElements || 0;
        state.pagination.totalPages = data.totalPages || 0;
        state.pagination.first = data.first ?? true;
        state.pagination.last = data.last ?? true;
      } else if (data && "applications" in data) {
        // Custom format with applications array and totalElements
        state.applications = data.applications || [];
        state.pagination.totalElements = data.totalElements || 0;
        state.pagination.totalPages = Math.ceil((data.totalElements || 0) / state.pagination.size);
        state.pagination.first = state.pagination.page === 0;
        state.pagination.last = state.pagination.page >= state.pagination.totalPages - 1;
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

    // Set current applicantId and reset state when applicant changes
    setApplicantId: (state, action: PayloadAction<string | null>) => {
      const newApplicantId = action.payload;
      
      // Only reset if applicantId actually changed
      if (state.currentApplicantId !== newApplicantId) {
        state.currentApplicantId = newApplicantId;
        state.applications = [];
        state.pagination.page = 0;
        state.pagination.totalElements = 0;
        state.pagination.totalPages = 0;
        state.pagination.first = true;
        state.pagination.last = true;
        state.error = null;
        // Keep sort state as it's user preference
      }
    },

    // Reset state
    resetApplicantDetailState: () => initialState,
  },
});

// ==========================================
// Exports
// ==========================================

export const {
  setLoading,
  setError,
  setApplications,
  setPage,
  setPageSize,
  setSort,
  clearSort,
  setApplicantId,
  resetApplicantDetailState,
} = applicantDetailSlice.actions;

export default applicantDetailSlice.reducer;

