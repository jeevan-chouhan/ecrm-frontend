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

// Persist configuration for manageTeam - only persist filter/sort/pagination, not members data
const manageTeamPersistConfig = {
  key: "manageTeam",
  storage,
  whitelist: ["pagination", "sort", "filter"], // Only persist these, not members/isLoading/error
};

// Create persisted manageTeam reducer
const persistedManageTeamReducer = persistReducer(manageTeamPersistConfig, manageTeamReducer);

// Combine all reducers
const rootReducer = combineReducers({
  loader: loaderReducer,
  toast: toastReducer,
  auth: authReducer,
  manageTeam: persistedManageTeamReducer,
});

// Root persist configuration
const persistConfig = {
  key: "root",
  version: 1,
  storage,
  blacklist: ["loader", "toast", "manageTeam"], // Don't persist these at root level (manageTeam has its own config)
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

