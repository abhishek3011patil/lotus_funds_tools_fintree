import type {
  ApiErrorBody,
  PlanResponse,
  PlansResponse,
  RazorpaySuccessResponse,
  RegistrationPaymentOrderResponse,
  SelectPlanResponse,
  SubscriptionAudience,
  VerifyRegistrationPaymentResponse,
} from "./types";

const API_URL = String(
  import.meta.env.VITE_API_URL || ""
).replace(/\/$/, "");

export class SubscriptionApiError extends Error {
  status: number;
  registrationStatus?: string;

  constructor(
    message: string,
    status: number,
    registrationStatus?: string
  ) {
    super(message);
    this.name = "SubscriptionApiError";
    this.status = status;
    this.registrationStatus = registrationStatus;
  }
}

const parseResponse = async <T>(
  response: Response
): Promise<T> => {
  let body: T | ApiErrorBody | null = null;

  try {
    body = (await response.json()) as T | ApiErrorBody;
  } catch {
    body = null;
  }

  if (!response.ok) {
    const errorBody = body as ApiErrorBody | null;

    throw new SubscriptionApiError(
      errorBody?.message ||
        `Request failed with status ${response.status}.`,
      response.status,
      errorBody?.registrationStatus
    );
  }

  return body as T;
};

const registrationHeaders = (
  registrationToken: string
): HeadersInit => ({
  "Content-Type": "application/json",
  "x-registration-token": registrationToken,
});

export const getSubscriptionPlans = async (
  audienceType: SubscriptionAudience,
  signal?: AbortSignal
): Promise<PlansResponse> => {
  const response = await fetch(
    `${API_URL}/api/subscription-plans?audienceType=${encodeURIComponent(
      audienceType
    )}`,
    { signal }
  );

  return parseResponse<PlansResponse>(response);
};

export const getSubscriptionPlanById = async (
  planId: string,
  signal?: AbortSignal
): Promise<PlanResponse> => {
  const response = await fetch(
    `${API_URL}/api/subscription-plans/${encodeURIComponent(
      planId
    )}`,
    { signal }
  );

  return parseResponse<PlanResponse>(response);
};

export const selectRegistrationPlan = async (
  applicationId: string,
  registrationToken: string,
  planId: string
): Promise<SelectPlanResponse> => {
  const response = await fetch(
    `${API_URL}/api/registration/${encodeURIComponent(
      applicationId
    )}/select-plan`,
    {
      method: "POST",
      headers: registrationHeaders(registrationToken),
      body: JSON.stringify({ planId }),
    }
  );

  return parseResponse<SelectPlanResponse>(response);
};

export const createRegistrationPaymentOrder = async (
  applicationId: string,
  registrationToken: string
): Promise<RegistrationPaymentOrderResponse> => {
  const response = await fetch(
    `${API_URL}/api/payments/registration-order`,
    {
      method: "POST",
      headers: registrationHeaders(registrationToken),
      body: JSON.stringify({ applicationId }),
    }
  );

  return parseResponse<RegistrationPaymentOrderResponse>(
    response
  );
};

/**
 * Backend dependency:
 * Add POST /api/payments/registration-verify in the next backend step.
 * Never mark a registration as paid using only the Razorpay browser callback.
 */
export const verifyRegistrationPayment = async (
  applicationId: string,
  registrationToken: string,
  payment: RazorpaySuccessResponse
): Promise<VerifyRegistrationPaymentResponse> => {
  const response = await fetch(
    `${API_URL}/api/payments/registration-verify`,
    {
      method: "POST",
      headers: registrationHeaders(registrationToken),
      body: JSON.stringify({
        applicationId,
        razorpayOrderId: payment.razorpay_order_id,
        razorpayPaymentId: payment.razorpay_payment_id,
        razorpaySignature: payment.razorpay_signature,
      }),
    }
  );

  return parseResponse<VerifyRegistrationPaymentResponse>(
    response
  );
};
