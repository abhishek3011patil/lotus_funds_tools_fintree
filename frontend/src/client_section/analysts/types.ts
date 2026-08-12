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
