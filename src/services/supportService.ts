import api from "./api";
import { ENDPOINTS } from "./endpoints";
import type { RaiseSupportPayload, RaiseSupportResponse } from "./types";

/**
 * Raise a support query
 * POST /support/raise?agencyId=&userId=
 */
export const raiseSupport = async (
  agencyId: number | string,
  userId: number | string,
  payload: RaiseSupportPayload
): Promise<RaiseSupportResponse> => {
  const response = await api.post<RaiseSupportResponse>(
    ENDPOINTS.SUPPORT.RAISE(agencyId, userId),
    payload
  );
  return response.data;
};

export default {
  raiseSupport,
};
