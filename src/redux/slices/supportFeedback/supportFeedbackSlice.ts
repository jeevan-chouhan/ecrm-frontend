import { createSlice } from "@reduxjs/toolkit";
import type { PayloadAction } from "@reduxjs/toolkit";
import type { SupportQueryItem, MyQueriesData } from "../../../services/types";

interface PaginationState {
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
  first: boolean;
  last: boolean;
}

interface SortState {
  sortBy: string;
  asc: boolean;
}

interface SupportFeedbackState {
  queries: SupportQueryItem[];
  isLoading: boolean;
  error: string | null;
  pagination: PaginationState;
  sort: SortState;
}

const initialState: SupportFeedbackState = {
  queries: [],
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
    asc: false, // default desc on Created Date
  },
};

const supportFeedbackSlice = createSlice({
  name: "supportFeedback",
  initialState,
  reducers: {
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

    setQueries: (state, action: PayloadAction<MyQueriesData>) => {
      const data = action.payload;
      state.isLoading = false;
      state.error = null;
      state.queries = data.content ?? [];
      state.pagination.totalElements = data.totalElements ?? 0;
      state.pagination.totalPages = data.totalPages ?? 0;
      state.pagination.first = data.first ?? true;
      state.pagination.last = data.last ?? true;
      state.pagination.size = data.size ?? state.pagination.size;
      state.pagination.page = data.page ?? 0;
    },

    setPage: (state, action: PayloadAction<number>) => {
      state.pagination.page = action.payload;
    },

    setPageSize: (state, action: PayloadAction<number>) => {
      state.pagination.size = action.payload;
      state.pagination.page = 0;
    },

    setSort: (state, action: PayloadAction<{ sortBy: string; asc?: boolean }>) => {
      const { sortBy, asc } = action.payload;
      state.sort.sortBy = sortBy || "createdAt";
      state.sort.asc = asc !== undefined ? asc : !state.sort.asc;
      state.pagination.page = 0;
    },
  },
});

export const {
  setLoading,
  setError,
  setQueries,
  setPage,
  setPageSize,
  setSort,
} = supportFeedbackSlice.actions;

export default supportFeedbackSlice.reducer;
