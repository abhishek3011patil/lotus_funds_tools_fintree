export type SubscriptionAudience = "RA" | "BROKER" | "CLIENT";
export type SubscriptionTier = "TIER_1" | "TIER_2" | "TIER_3";

export interface SubscriptionPlanFeature {
  key: string;
  name: string;
  description: string | null;
  valueType: "BOOLEAN" | "NUMBER" | "TEXT";
  enabled: boolean;
  numericValue: number | string | null;
  textValue: string | null;
  displayOrder: number;
}

export interface SubscriptionPlanLimit {
  key: string;
  name: string;
  value: number | string | null;
  isUnlimited: boolean;
}

export interface SubscriptionPlan {
  id: string;
  planCode: string;
  audienceType: SubscriptionAudience;
  tierCode: SubscriptionTier;
  displayName: string;
  shortDescription: string | null;
  fullDescription: string | null;
  price: {
    amountPaise: number;
    amountRupees: number;
    currency: string;
  };
  billingPeriod:
    | "MONTHLY"
    | "QUARTERLY"
    | "HALF_YEARLY"
    | "YEARLY"
    | "CUSTOM";
  durationDays: number;
  trialDays: number;
  isPopular: boolean;
  displayOrder: number;
  version: number;
  effectiveFrom: string;
  effectiveUntil: string | null;
  features: SubscriptionPlanFeature[];
  limits: SubscriptionPlanLimit[];
}

export interface PlansResponse {
  success: true;
  audienceType: SubscriptionAudience;
  count: number;
  plans: SubscriptionPlan[];
}

export interface PlanResponse {
  success: true;
  plan: SubscriptionPlan;
}

export interface RegistrationPlanSelection {
  id: string;
  applicationId: string;
  planId: string;
  planCode: string;
  displayName: string;
  audienceType: SubscriptionAudience;
  tierCode: SubscriptionTier;
  price: {
    amountPaise: number;
    amountRupees: number;
    currency: string;
  };
  durationDays: number;
  planVersion: number;
  selectedAt: string;
}

export interface SelectPlanResponse {
  success: true;
  message: string;
  registrationStatus: "PLAN_SELECTED";
  selection: RegistrationPlanSelection;
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
    status: "CREATED" | "PENDING";
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
  razorpay_payment_id: string;
  razorpay_order_id: string;
  razorpay_signature: string;
}

export interface VerifyRegistrationPaymentResponse {
  success: true;
  message: string;
  registrationStatus: "PAID_PENDING_APPROVAL";
  nextStep: "ADMIN_APPROVAL";
}

export interface ApiErrorBody {
  success?: false;
  message?: string;
  registrationStatus?: string;
}
