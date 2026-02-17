import api from "./api";
import { ENDPOINTS } from "./endpoints";
import type { UniversityInfoResponse } from "./types";

/**
 * University Detail Service - Handles university detail API calls
 */
const universityDetailService = {
  /**
   * Get college/university info by university ID
   * @param universityId - University ID
   * @returns Promise with university info response
   */
  getCollegeInfo: async (
    universityId: number | string
  ): Promise<UniversityInfoResponse> => {
    const response = await api.get<UniversityInfoResponse>(
      ENDPOINTS.UNIVERSITY_DETAILS.INFO(universityId)
    );
    return response.data;
  },
};

export default universityDetailService;
