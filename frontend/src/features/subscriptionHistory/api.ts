import api from "../../utils/axio";

export type SubscriptionPaymentHistoryItem = {
  id: string;
  provider: string;
  providerOrderId: string | null;
  providerPaymentId: string | null;
  status: string;
  orderStatus: string;
  amount: number;
  currency: string;
  purpose: string;
  planName: string | null;
  paidAt: string | null;
  createdAt: string;
};

export type SubscriptionEventHistoryItem = {
  id: string;
  subscriptionId: string;
  type: string;
  previousStatus: string | null;
  newStatus: string | null;
  reason: string | null;
  metadata: Record<string, unknown>;
  createdAt: string;
};

export type SubscriptionHistoryResponse = {
  success: true;
  payments: SubscriptionPaymentHistoryItem[];
  events: SubscriptionEventHistoryItem[];
  message?: string;
};

export const getSubscriptionHistory = async () =>
  api.get<SubscriptionHistoryResponse>(
    "/subscriptions/history"
  );
