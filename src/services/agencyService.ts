import api from "./api";
import { ENDPOINTS } from "./endpoints";
import type {
  AddAgencyPartnerPayload,
  AddAgencyPartnerResponse,
  AgencyPartnerNamesResponse,
  PartnersListParams,
  PartnersListResponse,
  GeneralSettingsResponse,
  SaveServingPayload,
  SaveServingResponse,
  OverallCountsResponse,
  StartTrialResponse,
  CurrentSubscriptionResponse,
} from "./types";

/**
 * Agency Service - Handles agency-related API calls
 */
const agencyService = {
  /**
   * Get agency partners list with pagination
   * @param params - Query parameters for filtering and pagination
   * @returns Promise with paginated partners list
   */
  getPartnersList: async (params: PartnersListParams): Promise<PartnersListResponse> => {
    const queryParams = new URLSearchParams();
    queryParams.append("agencyId", params.agencyId.toString());
    queryParams.append("search", params.search || "");
    queryParams.append("page", (params.page ?? 0).toString());
    queryParams.append("size", (params.size ?? 10).toString());
    queryParams.append("sortBy", params.sortBy || "");
    queryParams.append("asc", params.asc !== null && params.asc !== undefined ? params.asc.toString() : "");

    const response = await api.get<PartnersListResponse>(
      `${ENDPOINTS.AGENCIES.PARTNERS_LIST}?${queryParams.toString()}`
    );
    return response.data;
  },

  /**
   * Get agency partner names for dropdown
   * @returns Promise with array of agency partner names
   */
  getAgencyPartnerNames: async (): Promise<AgencyPartnerNamesResponse> => {
    const response = await api.get<AgencyPartnerNamesResponse>(
      ENDPOINTS.AGENCIES.PARTNER_NAMES
    );
    return response.data;
  },

  /**
   * Add a new agency partner
   * @param payload - Agency partner data
   * @returns Promise with agency partner response
   */
  addAgencyPartner: async (
    payload: AddAgencyPartnerPayload
  ): Promise<AddAgencyPartnerResponse> => {
    const response = await api.post<AddAgencyPartnerResponse>(
      ENDPOINTS.AGENCIES.PARTNERS,
      payload
    );
    return response.data;
  },

  /**
   * Update an agency partner
   * @param partnerId - Partner ID to update
   * @param payload - Agency partner data
   * @returns Promise with agency partner response
   */
  updateAgencyPartner: async (
    partnerId: number,
    payload: AddAgencyPartnerPayload
  ): Promise<AddAgencyPartnerResponse> => {
    const response = await api.put<AddAgencyPartnerResponse>(
      `${ENDPOINTS.AGENCIES.PARTNERS}?partnerId=${partnerId}`,
      payload
    );
    return response.data;
  },

  /**
   * Delete an agency partner
   * @param partnerId - Partner ID to delete
   * @param agencyId - Agency ID
   * @returns Promise with delete response
   */
  deleteAgencyPartner: async (
    partnerId: number,
    agencyId: number
  ): Promise<{ status: string; statusCode: number; message: string; data: string }> => {
    const response = await api.delete(
      `${ENDPOINTS.AGENCIES.PARTNERS}?partnerId=${partnerId}&agencyId=${agencyId}`
    );
    return response.data;
  },

  /**
   * Get general settings for an agency
   * @param agencyId - Agency ID
   * @returns Promise with general settings data
   */
  getGeneralSettings: async (agencyId: number): Promise<GeneralSettingsResponse> => {
    const response = await api.get<GeneralSettingsResponse>(
      `${ENDPOINTS.AGENCIES.GENERAL_SETTINGS}?agencyId=${agencyId}`
    );
    return response.data;
  },

  /**
   * Create serving countries and universities (when none were initially selected)
   * @param payload - Serving data with agencyId, countryIds, universityIds
   * @returns Promise with save response
   */
  createServing: async (payload: SaveServingPayload): Promise<SaveServingResponse> => {
    const response = await api.post<SaveServingResponse>(
      ENDPOINTS.AGENCIES.SERVING,
      payload
    );
    return response.data;
  },

  /**
   * Update serving countries and universities (when some were initially selected)
   * @param payload - Serving data with agencyId, countryIds, universityIds
   * @returns Promise with save response
   */
  updateServing: async (payload: SaveServingPayload): Promise<SaveServingResponse> => {
    const response = await api.put<SaveServingResponse>(
      ENDPOINTS.AGENCIES.SERVING,
      payload
    );
    return response.data;
  },

  /**
   * Get overall counts for an agency
   * @param agencyId - Agency ID
   * @returns Promise with overall counts data
   */
  getOverallCounts: async (agencyId: number): Promise<OverallCountsResponse> => {
    const response = await api.get<OverallCountsResponse>(
      `${ENDPOINTS.AGENCIES.OVERALL_COUNTS}?agencyId=${agencyId}`
    );
    return response.data;
  },

  /* Start 14-day free trial for an agency
   * @param agencyId - Agency ID
   * @returns Promise with start trial response
   */
  startTrial: async (agencyId: number): Promise<StartTrialResponse> => {
    const response = await api.post<StartTrialResponse>(
      ENDPOINTS.AGENCIES.START_TRIAL(agencyId)
    );
    return response.data;
  },

  /**
   * Get current subscription for an agency
   * @param agencyId - Agency ID
   * @returns Promise with current subscription data
   */
  getCurrentSubscription: async (agencyId: number): Promise<CurrentSubscriptionResponse> => {
    const response = await api.get<CurrentSubscriptionResponse>(
      ENDPOINTS.AGENCIES.CURRENT_SUBSCRIPTION(agencyId)
    );
    return response.data;
  },
};

export default agencyService;
