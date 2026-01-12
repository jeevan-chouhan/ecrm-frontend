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
import manageTeamReducer from "./slices/manageTeam/manageTeamSlice";
import dashboardReducer from "./slices/dashboard/dashboardSlice";

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

// Create persisted manageTeam reducer
const persistedManageTeamReducer = persistReducer(manageTeamPersistConfig, manageTeamReducer);

// Create persisted dashboard reducer
const persistedDashboardReducer = persistReducer(dashboardPersistConfig, dashboardReducer);

// Combine all reducers
const rootReducer = combineReducers({
  loader: loaderReducer,
  toast: toastReducer,
  auth: authReducer,
  manageTeam: persistedManageTeamReducer,
  dashboard: persistedDashboardReducer,
});

// Root persist configuration
const persistConfig = {
  key: "root",
  version: 1,
  storage,
  blacklist: ["loader", "toast", "manageTeam", "dashboard"], // Don't persist these at root level (they have their own config)
  whitelist: ["auth"], // Persist auth state at root level
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

