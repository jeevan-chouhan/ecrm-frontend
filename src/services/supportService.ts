import api from "./api";
import { ENDPOINTS } from "./endpoints";
import type {
  RaiseSupportPayload,
  RaiseSupportResponse,
  MyQueriesParams,
  MyQueriesResponse,
  SupportRepliesResponse,
} from "./types";

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

/**
 * Get my support queries (paginated).
 * Backend defaults to sort by createdAt desc. No sort param sent.
 * GET /support/my-queries?userId=&page=&size=
 */
export const getMyQueries = async (
  userId: number | string,
  params: MyQueriesParams
): Promise<MyQueriesResponse> => {
  const url = ENDPOINTS.SUPPORT.MY_QUERIES(userId, params.page, params.size);
  const response = await api.get<MyQueriesResponse>(url);
  return response.data;
};

/**
 * Get replies for a support query (paginated).
 * GET /support/:queryId/replies?page=&size=
 */
export const getReplies = async (
  queryId: number | string,
  page: number,
  size: number
): Promise<SupportRepliesResponse> => {
  const url = ENDPOINTS.SUPPORT.REPLIES(queryId, page, size);
  const response = await api.get<SupportRepliesResponse>(url);
  return response.data;
};

export default {
  raiseSupport,
  getMyQueries,
  getReplies,
};
