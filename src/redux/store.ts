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
import brandingReducer from "./slices/branding/brandingSlice";
import manageTeamReducer from "./slices/manageTeam/manageTeamSlice";
import dashboardReducer from "./slices/dashboard/dashboardSlice";
import documentVaultReducer from "./slices/documentVault/documentVaultSlice";
import agencyPartnerReducer from "./slices/agencyPartner/agencyPartnerSlice";
import teamOverviewReducer from "./slices/teamOverview/teamOverviewSlice";
import applicantTrackerReducer from "./slices/applicantTracker/applicantTrackerSlice";
import applicantDetailReducer from "./slices/applicantDetail/applicantDetailSlice";
import settingsReducer from "./slices/settings/settingsSlice";
import supportFeedbackReducer from "./slices/supportFeedback/supportFeedbackSlice";

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

// Persist configuration for applicantDetail - only persist pagination/sort, not applications data
const applicantDetailPersistConfig = {
  key: "applicantDetail",
  storage,
  whitelist: ["pagination", "sort"], // Only persist these, not applications/isLoading/error
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

// Create persisted applicantDetail reducer
const persistedApplicantDetailReducer = persistReducer(applicantDetailPersistConfig, applicantDetailReducer);

// Combine all reducers
const rootReducer = combineReducers({
  loader: loaderReducer,
  toast: toastReducer,
  auth: authReducer,
  menu: menuReducer,
  branding: brandingReducer,
  settings: settingsReducer,
  manageTeam: persistedManageTeamReducer,
  dashboard: persistedDashboardReducer,
  documentVault: persistedDocumentVaultReducer,
  agencyPartner: persistedAgencyPartnerReducer,
  teamOverview: persistedTeamOverviewReducer,
  applicantTracker: persistedApplicantTrackerReducer,
  applicantDetail: persistedApplicantDetailReducer,
  supportFeedback: supportFeedbackReducer,
});

// Root persist configuration
const persistConfig = {
  key: "root",
  version: 1,
  storage,
  blacklist: ["loader", "toast", "manageTeam", "dashboard", "documentVault", "agencyPartner", "teamOverview", "applicantTracker", "applicantDetail"], // Don't persist these at root level (they have their own config)
  whitelist: ["auth", "menu", "branding", "settings"], // Persist auth, menu, branding and settings state at root level
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
// Use rootReducer for RootState to avoid PersistPartial type issues
export type RootState = ReturnType<typeof rootReducer>;
export type AppDispatch = typeof store.dispatch;

