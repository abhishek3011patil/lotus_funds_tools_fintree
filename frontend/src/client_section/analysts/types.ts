export interface ClientAnalyst {
  id: string;
  name: string;
  organization: string | null;
  shortBio: string | null;
  profileImage: string | null;
  sebiRegistrationNumber: string | null;
  marketExperience: string | null;
  expertise: string | null;
  markets: string | null;
  recommendationCount: number;
  liveCallCount: number;
  isSubscribed: boolean;
  subscriptionExpiresAt: string | null;
  pricePaise: number;
  currency: string;
  durationDays: number;
}

export interface AnalystListResponse {
  success: boolean;
  analysts: ClientAnalyst[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface ClientBroker {
  id: string;
  name: string;
  legalName: string;
  entityType: string | null;
  sebiRegistrationNumber: string | null;
  category: string | null;
  exchanges: string | null;
  segments: string | null;
  analystCount: number;
  recommendationCount: number;
  liveCallCount: number;
  isSubscribed: boolean;
  subscriptionExpiresAt: string | null;
  pricePaise: number;
  currency: string;
  durationDays: number;
}

export interface BrokerListResponse {
  success: boolean;
  brokers: ClientBroker[];
  pagination: AnalystListResponse["pagination"];
}

export interface MarketplacePerformance {
  total: number;
  accuracy: number;
  strike: number;
  rr: number | null;
  active: number;
  exited: number;
  profit: number;
  adverse: number;
  sl: number;
  early: number;
  last: Array<"g" | "r" | "n">;
}

export interface MarketplaceProfile {
  type: "analyst" | "broker";
  id: string;
  name: string;
  organization?: string | null;
  legalName?: string | null;
  shortBio?: string | null;
  entityType?: string | null;
  website?: string | null;
  sebiRegistrationNumber?: string | null;
  nismCertificateNumber?: string | null;
  category?: string | null;
  registrationDate?: string | null;
  registrationValidity?: string | null;
  marketExperience?: string | null;
  expertise?: string | null;
  markets?: string | null;
  exchanges?: string | null;
  segments?: string | null;
  analysts?: Array<{ id: string; name: string }>;
}

export interface MarketplaceProfileResponse {
  success: boolean;
  profile: MarketplaceProfile;
  performancePeriod: "monthly" | "yearly";
  performance: MarketplacePerformance;
}

export interface AnalystOrderResponse {
  success: boolean;
  order: {
    localOrderId: string;
    razorpayOrderId: string;
    amountPaise: number;
    currency: string;
  };
  checkout: {
    keyId: string;
    businessName: string;
    description: string;
    prefill: {
      name: string;
      email: string;
    };
  };
}

export interface RazorpayPaymentResult {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
}
