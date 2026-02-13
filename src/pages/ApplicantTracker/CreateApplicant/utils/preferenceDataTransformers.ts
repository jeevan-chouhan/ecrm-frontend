import type { PreferenceItem } from "../types";
import { UserRole } from "../../../../constants";

/**
 * Checks if a preference has changed compared to original
 */
export function hasPreferenceChanged(current: PreferenceItem, original: PreferenceItem | undefined): boolean {
  if (!original) return true; // If no original, consider it changed (new preference)
  
  // Compare all fields
  return (
    current.enrollmentType !== original.enrollmentType ||
    current.desiredCountry !== original.desiredCountry ||
    current.program !== original.program ||
    current.desiredUniversity !== original.desiredUniversity ||
    current.desiredCampus !== original.desiredCampus ||
    current.course !== original.course ||
    current.desiredIntake !== original.desiredIntake ||
    current.assignCounselor !== original.assignCounselor ||
    current.agencyPartnerName !== original.agencyPartnerName
  );
}

/**
 * Maps program type string to program type ID
 */
export function mapProgramToProgramTypeId(program: string): number | null {
  if (!program) return null;
  const programUpper = program.toUpperCase();
  const mapping: Record<string, number> = {
    "BACHELOR": 1,
    "MASTER": 5,
    "PHD": 3,
  };
  const programTypeId = mapping[programUpper];
  if (!programTypeId) {
  }
  return programTypeId || null;
}

/**
 * Converts form preference to API payload format
 */
export function convertPreferenceToApiFormat(
  pref: PreferenceItem,
  user: { role?: string; agencyId?: number | null; userId?: number | null; isPrimaryAdmin?: boolean } | null,
  enrollmentTypeIdMap: Map<string, number>,
  programTypeIdMap: Map<string, number>
) {
  const userRole = user?.role?.toUpperCase() || "";
  const isManager = userRole === UserRole.MANAGER || UserRole.MANGER_BILLING;
  const isAdmin = userRole === UserRole.ADMIN || UserRole.ADMIN_BILLING || user?.isPrimaryAdmin === true;

  const enrollmentTypeId = enrollmentTypeIdMap.get(pref.enrollmentType);
  if (!enrollmentTypeId) {
    throw new Error(`Invalid enrollment type: ${pref.enrollmentType}`);
  }

  // Use program type ID from API response (programTypeIdMap) instead of hardcoded mapping
  const programTypeId = programTypeIdMap.get(pref.program.toUpperCase());
  if (!programTypeId) {
    throw new Error(`Invalid program type: ${pref.program}. Cannot convert to program type ID. Please ensure program types are fetched from API.`);
  }

  const payload: {
    preferenceId?: number | string;
    enrollmentTypeId: number;
    desiredCountryId: number;
    desiredUniversityId: number;
    desiredProgramType: number;
    desiredCampusId: number;
    desiredCourseId: number;
    desiredIntake: string;
    assignedAgencyId: number | null;
    agencyPartnerId?: number | null;
    assignedCounselorId?: number | null;
    assignedAdminId?: number | null;
    assignedManagerId?: number | null;
  } = {
    enrollmentTypeId: enrollmentTypeId,
    desiredCountryId: parseInt(pref.desiredCountry) || 0,
    desiredUniversityId: parseInt(pref.desiredUniversity) || 0,
    desiredProgramType: programTypeId,
    desiredCampusId: parseInt(pref.desiredCampus) || 0,
    desiredCourseId: parseInt(pref.course) || 0,
    desiredIntake: pref.desiredIntake,
    assignedAgencyId: user?.agencyId || null,
  };

  if (pref.preferenceId) {
    payload.preferenceId = pref.preferenceId;
  }

  if (pref.enrollmentType !== "WALK_IN" && pref.agencyPartnerName && pref.agencyPartnerName !== "") {
    payload.agencyPartnerId = parseInt(pref.agencyPartnerName) || null;
  }

  if (pref.assignCounselor && pref.assignCounselor !== "") {
    payload.assignedCounselorId = parseInt(pref.assignCounselor) || null;
  } else {
    if (isAdmin) {
      payload.assignedAdminId = user?.userId || null;
    } else if (isManager) {
      payload.assignedManagerId = user?.userId || null;
    }
  }

  return payload;
}
