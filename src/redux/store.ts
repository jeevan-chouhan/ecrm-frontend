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

// Combine all reducers
const rootReducer = combineReducers({
  loader: loaderReducer,
  toast: toastReducer,
});

// Persist configuration
const persistConfig = {
  key: "root",
  version: 1,
  storage,
  blacklist: ["loader", "toast"], // Don't persist transient UI states
};

// Create persisted reducer
const persistedReducer = persistReducer(persistConfig, rootReducer);

// Configure store
export const store = configureStore({
  reducer: persistedReducer,
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

