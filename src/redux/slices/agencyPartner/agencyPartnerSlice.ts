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

interface SortState {
  sortBy: string | null;
  asc: boolean | null;
}

interface FilterState {
  search: string;
}

// Partner row for table display
export interface PartnerRow {
  id: number;
  name: string;
  contactPerson: string;
  email: string;
  countryCode: string;
  contactNumber: string;
  commissionPercentage: number;
  description: string;
  status: "ACTIVE" | "INACTIVE";
}

interface AgencyPartnerState {
  // Data
  partners: PartnerRow[];

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

const initialState: AgencyPartnerState = {
  partners: [],
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
    sortBy: null,
    asc: null,
  },
  filter: {
    search: "",
  },
};

// ==========================================
// Slice
// ==========================================

const agencyPartnerSlice = createSlice({
  name: "agencyPartner",
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

    // Set partners data
    setPartners: (
      state,
      action: PayloadAction<{
        partners: PartnerRow[];
        totalElements: number;
        totalPages: number;
        first: boolean;
        last: boolean;
      }>
    ) => {
      const data = action.payload;
      state.isLoading = false;
      state.error = null;
      state.partners = data.partners;
      state.pagination.totalElements = data.totalElements;
      state.pagination.totalPages = data.totalPages;
      state.pagination.first = data.first;
      state.pagination.last = data.last;
    },

    // Add new partner to list
    addPartner: (state, action: PayloadAction<PartnerRow>) => {
      state.partners.unshift(action.payload);
      state.pagination.totalElements += 1;
    },

    // Update existing partner
    updatePartner: (state, action: PayloadAction<PartnerRow>) => {
      const index = state.partners.findIndex((p) => p.id === action.payload.id);
      if (index !== -1) {
        state.partners[index] = action.payload;
      }
    },

    // Remove partner from list
    removePartner: (state, action: PayloadAction<number>) => {
      state.partners = state.partners.filter((p) => p.id !== action.payload);
      state.pagination.totalElements = Math.max(0, state.pagination.totalElements - 1);
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
    setSort: (state, action: PayloadAction<{ sortBy: string | null; asc?: boolean | null }>) => {
      const { sortBy, asc } = action.payload;

      if (!sortBy) {
        state.sort.sortBy = null;
        state.sort.asc = null;
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

    clearSearch: (state) => {
      state.filter.search = "";
      state.pagination.page = 0;
    },

    // Reset state
    resetAgencyPartnerState: () => initialState,
  },
});

// ==========================================
// Exports
// ==========================================

export const {
  setLoading,
  setError,
  setPartners,
  addPartner,
  updatePartner,
  removePartner,
  setPage,
  setPageSize,
  setSort,
  setSearch,
  clearSearch,
  resetAgencyPartnerState,
} = agencyPartnerSlice.actions;

export default agencyPartnerSlice.reducer;
