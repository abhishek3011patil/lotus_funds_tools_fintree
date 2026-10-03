export type RecommendationStatus = "ALL" | "PUBLISHED" | "CLOSED";

export interface ClientRecommendationCall {
  id: string;
  stockName: string;
  displayName: string | null;
  recommendationType: string;
  status: string;
  createdAt: string;
  callType: string | null;
  tradeType: string | null;
  exchangeType: string | null;
  marketType: string | null;
  holdingPeriod: string | null;
  raId: string;
  raName: string;
  raOrganization: string | null;
  locked: boolean;
  entryPrice: string | null;
  entryPriceLow: string | null;
  entryPriceUpper: string | null;
  targetPrice: string | null;
  targetPrice2: string | null;
  targetPrice3: string | null;
  stopLoss: string | null;
  stopLoss2: string | null;
  stopLoss3: string | null;
  riskRewardRatio: string | number | null;
  summary: string | null;
  analystNotes: string | null;
  underlyingStudy: string | null;
  expiryDate: string | null;
  exitPrice: string | null;
  closedAt: string | null;
  versionType: string | null;
  versionNumber: number | null;
  errataReason: string | null;
  disclaimer: string | null;
  sebiRegistration: string | null;
  attachments: Array<{
    url: string;
    name?: string;
    mimeType?: string;
    size?: number;
  }>;
}

export interface FeedPage {
  items: ClientRecommendationCall[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasMore: boolean;
  };
}

export interface RecommendationsFeedResponse {
  success: boolean;
  subscribed: FeedPage;
  discover: FeedPage;
  filters: {
    analysts: Array<{
      id: string;
      name: string;
      organization: string | null;
    }>;
  };
}

export interface RecommendationFilters {
  search: string;
  raId: string;
  action: string;
  exchange: string;
}
