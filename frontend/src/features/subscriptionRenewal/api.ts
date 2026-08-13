import api from "../../utils/axio";
import type { RazorpaySuccessResponse } from "../raRegistrationSubscription/types";
import type { RazorpayCheckoutOrderResponse } from "../raRegistrationSubscription/razorpay";

export type RenewalOrderResponse =
  RazorpayCheckoutOrderResponse & {
    success: true;
    message: string;
    order: RazorpayCheckoutOrderResponse["order"] & {
      localOrderId: string;
      amountRupees: number;
      receipt: string;
      status: string;
    };
    nextStep: "OPEN_RAZORPAY_CHECKOUT";
  };

export type RenewalVerificationResponse = {
  success: true;
  message: string;
  subscriptionId: string;
  startsAt: string;
  expiresAt: string;
};

export const createRenewalOrder = async (planId: string) =>
  api.post<RenewalOrderResponse>(
    "/subscriptions/renewal/order",
    { planId }
  );

export const verifyRenewalPayment = async (
  localOrderId: string,
  payment: RazorpaySuccessResponse
) =>
  api.post<RenewalVerificationResponse>(
    "/subscriptions/renewal/verify",
    {
      localOrderId,
      razorpayOrderId: payment.razorpay_order_id,
      razorpayPaymentId: payment.razorpay_payment_id,
      razorpaySignature: payment.razorpay_signature,
    }
  );

export const closeRenewalOrder = async (
  localOrderId: string,
  razorpayOrderId: string
) =>
  api.post<{ success: boolean; message: string }>(
    "/subscriptions/renewal/failure",
    { localOrderId, razorpayOrderId }
  );
