import type { SubscriptionAudience } from "./types";

const KEYS = {
  applicationId: "registration_application_id",
  token: "registration_token",
  audienceType: "registration_audience_type",
  selectedPlanId: "registration_selected_plan_id",
  planSelectionId: "registration_plan_selection_id",
  localOrderId: "registration_local_order_id",
  razorpayOrderId: "registration_razorpay_order_id",
} as const;

export interface RegistrationSession {
  applicationId: string;
  registrationToken: string;
  audienceType: SubscriptionAudience;
}

const isAudienceType = (
  value: string | null
): value is SubscriptionAudience =>
  value === "RA" ||
  value === "BROKER" ||
  value === "CLIENT";

export const saveRegistrationSession = (
  session: RegistrationSession
): void => {
  sessionStorage.setItem(
    KEYS.applicationId,
    session.applicationId
  );
  sessionStorage.setItem(
    KEYS.token,
    session.registrationToken
  );
  sessionStorage.setItem(
    KEYS.audienceType,
    session.audienceType
  );
};

export const getRegistrationSession =
  (): RegistrationSession | null => {
    const applicationId = sessionStorage.getItem(
      KEYS.applicationId
    );
    const registrationToken = sessionStorage.getItem(
      KEYS.token
    );
    const audienceType = sessionStorage.getItem(
      KEYS.audienceType
    );

    if (
      !applicationId ||
      !registrationToken ||
      !isAudienceType(audienceType)
    ) {
      return null;
    }

    return {
      applicationId,
      registrationToken,
      audienceType,
    };
  };

export const saveSelectedPlan = (
  planId: string,
  selectionId: string
): void => {
  sessionStorage.setItem(KEYS.selectedPlanId, planId);
  sessionStorage.setItem(
    KEYS.planSelectionId,
    selectionId
  );
};

export const getSelectedPlanId = (): string | null =>
  sessionStorage.getItem(KEYS.selectedPlanId);

export const savePaymentOrder = (
  localOrderId: string,
  razorpayOrderId: string
): void => {
  sessionStorage.setItem(
    KEYS.localOrderId,
    localOrderId
  );
  sessionStorage.setItem(
    KEYS.razorpayOrderId,
    razorpayOrderId
  );
};

export const clearPaymentOrder = (): void => {
  sessionStorage.removeItem(KEYS.localOrderId);
  sessionStorage.removeItem(KEYS.razorpayOrderId);
};

export const clearRegistrationSession = (): void => {
  Object.values(KEYS).forEach((key) =>
    sessionStorage.removeItem(key)
  );
};

export const getRegistrationStartRoute = (
  audienceType?: SubscriptionAudience
): string => {
  switch (audienceType) {
    case "BROKER":
      return "/register/broker";
    case "CLIENT":
      return "/register/client";
    case "RA":
    default:
      return "/register/ra";
  }
};
