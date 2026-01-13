import { createSlice } from "@reduxjs/toolkit";
import type { PayloadAction } from "@reduxjs/toolkit";

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

interface FilterState {
  search: string;
}

// Applicant row for document vault table
export interface DocumentVaultApplicantRow {
  id: number;
  applicantId: number;
  applicantName: string;
  contactNo: string;
  email: string;
  enrollmentType: string;
  status: "Active" | "Inactive";
}

interface DocumentVaultState {
  // Data
  applicants: DocumentVaultApplicantRow[];
  
  // Loading states
  isLoading: boolean;
  error: string | null;
  
  // Pagination
  pagination: PaginationState;
  
  // Filters
  filter: FilterState;
}

// ==========================================
// Initial State
// ==========================================

const initialState: DocumentVaultState = {
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
  filter: {
    search: "",
  },
};

// ==========================================
// Slice
// ==========================================

const documentVaultSlice = createSlice({
  name: "documentVault",
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

    // Set applicants data
    setApplicants: (
      state,
      action: PayloadAction<{
        applicants: DocumentVaultApplicantRow[];
        totalElements: number;
        totalPages: number;
        first: boolean;
        last: boolean;
      }>
    ) => {
      const data = action.payload;
      state.isLoading = false;
      state.error = null;
      state.applicants = data.applicants;
      state.pagination.totalElements = data.totalElements;
      state.pagination.totalPages = data.totalPages;
      state.pagination.first = data.first;
      state.pagination.last = data.last;
    },

    // Pagination actions
    setPage: (state, action: PayloadAction<number>) => {
      state.pagination.page = action.payload;
    },

    setPageSize: (state, action: PayloadAction<number>) => {
      state.pagination.size = action.payload;
      state.pagination.page = 0; // Reset to first page
    },

    // Filter actions
    setSearch: (state, action: PayloadAction<string>) => {
      state.filter.search = action.payload;
      state.pagination.page = 0;
    },

    clearSearch: (state) => {
      state.filter.search = "";
      state.pagination.page = 0;
    },

    // Reset state
    resetDocumentVaultState: () => initialState,
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
  setSearch,
  clearSearch,
  resetDocumentVaultState,
} = documentVaultSlice.actions;

export default documentVaultSlice.reducer;

