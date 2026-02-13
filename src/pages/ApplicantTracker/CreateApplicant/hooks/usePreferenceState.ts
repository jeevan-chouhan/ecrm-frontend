import { useState, useRef, useCallback } from "react";
import type { PreferenceItem } from "../types";

/**
 * Hook for managing preference component state
 */
export function usePreferenceState() {
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [isDeletePopupOpen, setIsDeletePopupOpen] = useState(false);
  const [deletingIndex, setDeletingIndex] = useState<number | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isFormValid, setIsFormValid] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [shouldNavigateNext, setShouldNavigateNext] = useState(false);

  const isSubmittingRef = useRef(false);
  const originalPreferencesRef = useRef<PreferenceItem[]>([]);
  const preferencesSentToApiRef = useRef<Set<string>>(new Set());
  const isUpdatingCourseFromProgramRef = useRef<Map<number, string>>(new Map());
  const [selectedCountryId, setSelectedCountryId] = useState<number | string | null>(null);
  const [selectedUniversityId, setSelectedUniversityId] = useState<number | string | null>(null);
  const isFetchingPreferencesRef = useRef(false);
  const hasFetchedPreferencesRef = useRef(false);
  const lastFetchedApplicantIdRef = useRef<number | string | null>(null);

  const handleDeletePreference = useCallback((index: number) => {
    setDeletingIndex(index);
    setIsDeletePopupOpen(true);
  }, []);

  const handleCancelDelete = useCallback(() => {
    setIsDeletePopupOpen(false);
    setDeletingIndex(null);
  }, []);

  return {
    // State
    editingIndex,
    setEditingIndex,
    isDeletePopupOpen,
    setIsDeletePopupOpen,
    deletingIndex,
    setDeletingIndex,
    isDeleting,
    setIsDeleting,
    isFormValid,
    setIsFormValid,
    isSaving,
    setIsSaving,
    shouldNavigateNext,
    setShouldNavigateNext,
    selectedCountryId,
    setSelectedCountryId,
    selectedUniversityId,
    setSelectedUniversityId,

    // Refs
    isSubmittingRef,
    originalPreferencesRef,
    preferencesSentToApiRef,
    isUpdatingCourseFromProgramRef,
    isFetchingPreferencesRef,
    hasFetchedPreferencesRef,
    lastFetchedApplicantIdRef,

    // Handlers
    handleDeletePreference,
    handleCancelDelete,
  };
}

