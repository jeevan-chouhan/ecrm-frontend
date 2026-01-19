import { createSlice } from "@reduxjs/toolkit";
import type { PayloadAction } from "@reduxjs/toolkit";
import type { UserListItem, PaginatedData } from "../../../services";

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
}

interface ManageTeamState {
  // Data
  members: UserListItem[];
  
  // Loading states
  isLoading: boolean;
  error: string | null;
  
  // Pagination
  pagination: PaginationState;
  
  // Sorting
  sort: SortState;
  
  // Filters
  filter: FilterState;
  
  // API params (from token)
  agencyId: number | null;
  assignedManagerId: number | null;
}

// ==========================================
// Initial State
// ==========================================

const initialState: ManageTeamState = {
  members: [],
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
    sortBy: "name",
    asc: true,
  },
  filter: {
    search: "",
    status: "all", // Default to "all" - API will receive empty string
  },
  agencyId: null,
  assignedManagerId: null,
};

// ==========================================
// Slice
// ==========================================

const manageTeamSlice = createSlice({
  name: "manageTeam",
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

    // Set members data (handles both array and paginated response)
    setMembers: (
      state,
      action: PayloadAction<UserListItem[] | PaginatedData<UserListItem>>
    ) => {
      const data = action.payload;
      state.isLoading = false;
      state.error = null;

      if (Array.isArray(data)) {
        state.members = data;
        state.pagination.totalElements = data.length;
        state.pagination.totalPages = 1;
        state.pagination.first = true;
        state.pagination.last = true;
      } else if (data && "content" in data) {
        state.members = data.content || [];
        state.pagination.totalElements = data.totalElements || 0;
        state.pagination.totalPages = data.totalPages || 0;
        state.pagination.first = data.first ?? true;
        state.pagination.last = data.last ?? true;
      }
    },

    // Set agency and manager IDs (from token)
    setApiParams: (
      state,
      action: PayloadAction<{ agencyId: number | null; assignedManagerId: number | null }>
    ) => {
      state.agencyId = action.payload.agencyId;
      state.assignedManagerId = action.payload.assignedManagerId;
    },

    // Pagination actions
    setPage: (state, action: PayloadAction<number>) => {
      state.pagination.page = action.payload;
    },

    setPageSize: (state, action: PayloadAction<number>) => {
      state.pagination.size = action.payload;
      state.pagination.page = 0; // Reset to first page
    },

    nextPage: (state) => {
      if (!state.pagination.last) {
        state.pagination.page += 1;
      }
    },

    prevPage: (state) => {
      if (!state.pagination.first) {
        state.pagination.page -= 1;
      }
    },

    // Sorting actions
    setSort: (state, action: PayloadAction<{ sortBy: string; asc?: boolean }>) => {
      const { sortBy, asc } = action.payload;
      
      // If sortBy is empty, clear the sort
      if (!sortBy) {
        state.sort.sortBy = null;
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
      state.sort.sortBy = null;
      state.sort.asc = true;
    },

    // Filter actions
    setSearch: (state, action: PayloadAction<string>) => {
      state.filter.search = action.payload;
      state.pagination.page = 0; // Reset to first page
    },

    setStatusFilter: (state, action: PayloadAction<string>) => {
      state.filter.status = action.payload;
      state.pagination.page = 0; // Reset to first page
    },

    clearFilters: (state) => {
      state.filter.search = "";
      state.filter.status = "";
      state.pagination.page = 0;
    },

    // Update member status locally
    updateMemberStatus: (
      state,
      action: PayloadAction<{ id: number; status: string }>
    ) => {
      const { id, status } = action.payload;
      const member = state.members.find((m) => m.id === id);
      if (member) {
        member.status = status as "active" | "inactive";
      }
    },

    // Reset state
    resetManageTeamState: () => initialState,
  },
});

// ==========================================
// Exports
// ==========================================

export const {
  setLoading,
  setError,
  setMembers,
  setApiParams,
  setPage,
  setPageSize,
  nextPage,
  prevPage,
  setSort,
  clearSort,
  setSearch,
  setStatusFilter,
  clearFilters,
  updateMemberStatus,
  resetManageTeamState,
} = manageTeamSlice.actions;

export default manageTeamSlice.reducer;
