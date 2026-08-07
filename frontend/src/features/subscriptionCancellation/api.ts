import api from "../../utils/axio";

export type CancelSubscriptionResponse = {
  success: true;
  message: string;
  emailSent: boolean;
  subscription: {
    id: string;
    status: "CANCELLED";
    cancelledAt: string;
    cancellationReason: string;
  };
};

export const cancelSubscription = async (
  reason: string,
  confirmation: string
) =>
  api.post<CancelSubscriptionResponse>(
    "/subscriptions/cancel",
    { reason, confirmation }
  );
