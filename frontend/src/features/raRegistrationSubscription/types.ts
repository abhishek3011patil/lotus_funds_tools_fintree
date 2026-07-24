export type RAAudienceType = "RA";

export type RARegistrationPaymentStatus =
  | "PAID_PENDING_APPROVAL";

export interface RARegistrationResponse {
  success: true;
  message: string;
  ra_id: string;
  application_id: string;
  registration_token: string;
  registration_token_expires_at: string;
  next_step: "SELECT_SUBSCRIPTION_PLAN";
}

export interface RARegistrationSession {
  applicationId: string;
  registrationToken: string;
  tokenExpiresAt: string;
  audienceType: RAAudienceType;
  paymentStatus?: RARegistrationPaymentStatus;
  selectedPlanId?: string;
}

export interface RAPlanFeature {
  key: string;
  displayName: string;
  description: string | null;
  enabled: boolean;
  value: boolean | number | string | null;
}

export interface RAPlanLimit {
  key: string;
  displayName: string;
  value: number | null;
  unlimited: boolean;
}

export interface RAPlan {
  id: string;
  planCode: string;
  displayName: string;
  description: string | null;
  audienceType: RAAudienceType;
  tierCode: string;
  pricePaise: number;
  currency: string;
  durationDays: number;
  planVersion: number;
  features: RAPlanFeature[];
  limits: RAPlanLimit[];
}

export interface SelectRAPlanResponse {
  success: true;
  message: string;
  registrationStatus: "PLAN_SELECTED";
  selection: {
    id: string;
    applicationId: string;
    planId: string;
    planCode: string;
    displayName: string;
    audienceType: RAAudienceType;
    tierCode: string;
    price: {
      amountPaise: number;
      amountRupees: number;
      currency: string;
    };
    durationDays: number;
    planVersion: number;
    selectedAt: string;
  };
  nextStep: "CREATE_PAYMENT_ORDER";
}

export interface RegistrationPaymentOrderResponse {
  success: true;
  message: string;
  registrationStatus: "PAYMENT_PENDING";
  order: {
    localOrderId: string;
    razorpayOrderId: string;
    amountPaise: number;
    amountRupees: number;
    currency: string;
    receipt: string;
    status: string;
  };
  checkout: {
    keyId: string;
    businessName: string;
    description: string;
    prefill: {
      email: string;
      contact: string;
    };
  };
  nextStep: "OPEN_RAZORPAY_CHECKOUT";
}

export interface RazorpaySuccessResponse {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
}

export interface VerifyRegistrationPaymentResponse {
  success: true;
  message?: string;

  registrationStatus:
    "PAID_PENDING_APPROVAL";

  subscriptionId?: string | null;

  nextStep:
    | "ADMIN_APPROVAL"
    | "WAIT_FOR_ADMIN_APPROVAL";
}

export interface PasswordSetupAccount {
  name: string;
  email: string;
  role: string;
}

export type PasswordSetupValidationResponse =
  | {
      success: true;
      valid: true;
      account: PasswordSetupAccount;
      expiresAt: string;
      nextStep: "SET_PASSWORD";
    }
  | {
      success: false;
      valid: false;
      message?: string;
      code?: string;
    };

export interface CompletePasswordSetupResponse {
  success: true;
  message: string;
  accountStatus: "active";
  nextStep: "LOGIN";
  loginPath: "/login";
}

export interface RegistrationApiErrorPayload {
  success?: boolean;
  message?: string;
  error?: string;
  code?: string;
  registrationStatus?: string;
  subscriptionStatus?: string;
  nextStep?: string;
  [key: string]: unknown;
}
