import { configureStore, combineReducers } from "@reduxjs/toolkit";
import {
  persistStore,
  persistReducer,
  FLUSH,
  REHYDRATE,
  PAUSE,
  PERSIST,
  PURGE,
  REGISTER,
} from "redux-persist";
import storage from "redux-persist/lib/storage";

// Import slices
import loaderReducer from "./slices/loader/loaderSlice";
import toastReducer from "./slices/toast/toastSlice";
import authReducer from "./slices/auth/authSlice";
import menuReducer from "./slices/menu/menuSlice";
import manageTeamReducer from "./slices/manageTeam/manageTeamSlice";
import dashboardReducer from "./slices/dashboard/dashboardSlice";
import documentVaultReducer from "./slices/documentVault/documentVaultSlice";
import agencyPartnerReducer from "./slices/agencyPartner/agencyPartnerSlice";
import teamOverviewReducer from "./slices/teamOverview/teamOverviewSlice";
import applicantTrackerReducer from "./slices/applicantTracker/applicantTrackerSlice";

// Persist configuration for manageTeam - only persist filter/sort/pagination, not members data
const manageTeamPersistConfig = {
  key: "manageTeam",
  storage,
  whitelist: ["pagination", "sort", "filter"], // Only persist these, not members/isLoading/error
};

// Persist configuration for dashboard - only persist filter/sort/pagination, not applicants data
const dashboardPersistConfig = {
  key: "dashboard",
  storage,
  whitelist: ["pagination", "sort", "filter"], // Only persist these, not applicants/isLoading/error
};

// Persist configuration for documentVault - only persist filter/pagination, not applicants data
const documentVaultPersistConfig = {
  key: "documentVault",
  storage,
  whitelist: ["pagination", "filter"], // Only persist these, not applicants/isLoading/error
};

// Persist configuration for agencyPartner - only persist filter/sort/pagination, not partners data
const agencyPartnerPersistConfig = {
  key: "agencyPartner",
  storage,
  whitelist: ["pagination", "sort", "filter"], // Only persist these, not partners/isLoading/error
};

// Persist configuration for teamOverview - only persist filter/pagination/sort, not data
const teamOverviewPersistConfig = {
  key: "teamOverview",
  storage,
  whitelist: ["pagination", "filter", "sort"], // Only persist these, not teamOverviewData/isLoading/error
};

// Persist configuration for applicantTracker - only persist filter/pagination/sort, not applicants data
const applicantTrackerPersistConfig = {
  key: "applicantTracker",
  storage,
  whitelist: ["pagination", "filter", "sort"], // Only persist these, not applicants/isLoading/error
};

// Create persisted manageTeam reducer
const persistedManageTeamReducer = persistReducer(manageTeamPersistConfig, manageTeamReducer);

// Create persisted dashboard reducer
const persistedDashboardReducer = persistReducer(dashboardPersistConfig, dashboardReducer);

// Create persisted documentVault reducer
const persistedDocumentVaultReducer = persistReducer(documentVaultPersistConfig, documentVaultReducer);

// Create persisted agencyPartner reducer
const persistedAgencyPartnerReducer = persistReducer(agencyPartnerPersistConfig, agencyPartnerReducer);

// Create persisted teamOverview reducer
const persistedTeamOverviewReducer = persistReducer(teamOverviewPersistConfig, teamOverviewReducer);

// Create persisted applicantTracker reducer
const persistedApplicantTrackerReducer = persistReducer(applicantTrackerPersistConfig, applicantTrackerReducer);

// Combine all reducers
const rootReducer = combineReducers({
  loader: loaderReducer,
  toast: toastReducer,
  auth: authReducer,
  menu: menuReducer,
  manageTeam: persistedManageTeamReducer,
  dashboard: persistedDashboardReducer,
  documentVault: persistedDocumentVaultReducer,
  agencyPartner: persistedAgencyPartnerReducer,
  teamOverview: persistedTeamOverviewReducer,
  applicantTracker: persistedApplicantTrackerReducer,
});

// Root persist configuration
const persistConfig = {
  key: "root",
  version: 1,
  storage,
  blacklist: ["loader", "toast", "manageTeam", "dashboard", "documentVault", "agencyPartner", "teamOverview", "applicantTracker"], // Don't persist these at root level (they have their own config)
  whitelist: ["auth", "menu"], // Persist auth and menu state at root level
};

// Create persisted reducer
const persistedReducer = persistReducer(persistConfig, rootReducer);

// Configure store
export const store = configureStore({
  reducer: persistedReducer,
  devTools: true,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: [FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER],
      },
    }),
});

// Create persistor
export const persistor = persistStore(store);

// Export types for TypeScript
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

