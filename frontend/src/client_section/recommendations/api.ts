import api from "../../utils/axio";
import type {
  RecommendationStatus,
  RecommendationFilters,
  RecommendationsFeedResponse,
} from "./types";

export const fetchRecommendationsFeed = async (
  subscribedPage: number,
  discoverPage: number,
  status: RecommendationStatus,
  filters: RecommendationFilters,
  signal?: AbortSignal
) => {
  const response = await api.get<RecommendationsFeedResponse>(
    "/client/recommendations",
    {
      params: { subscribedPage, discoverPage, limit: 6, status, ...filters },
      signal,
    }
  );
  return response.data;
};
