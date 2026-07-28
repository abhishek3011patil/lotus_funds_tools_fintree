export type SubscriptionDetails = {
  id: string;
  planName: string | null;
  status: string;
  startsAt: string | null;
  expiresAt: string | null;
  amountPaid: number | null;
  currency?: string | null;
  daysRemaining: number | null;
};

export type CurrentSubscriptionResponse = {
  success: boolean;
  subscription: SubscriptionDetails | null;
  message?: string;
};
