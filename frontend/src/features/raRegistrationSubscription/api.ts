import type {
  CompletePasswordSetupResponse,
  PasswordSetupValidationResponse,
  RAPlan,
  RAPlanFeature,
  RAPlanLimit,
  RazorpaySuccessResponse,
  RegistrationApiErrorPayload,
  RegistrationPaymentOrderResponse,
  SelectRAPlanResponse,
  VerifyRegistrationPaymentResponse,
} from "./types";

const API_URL = import.meta.env.VITE_API_URL;

type JsonRecord = Record<string, unknown>;

interface RawPlanFeature {
  key?: unknown;
  featureKey?: unknown;
  displayName?: unknown;
  name?: unknown;
  description?: unknown;
  enabled?: unknown;
  isEnabled?: unknown;
  value?: unknown;
  numericValue?: unknown;
  textValue?: unknown;
}

interface RawPlanLimit {
  key?: unknown;
  limitKey?: unknown;
  displayName?: unknown;
  name?: unknown;
  value?: unknown;
  limitValue?: unknown;
  unlimited?: unknown;
  isUnlimited?: unknown;
}

interface RawPlan {
  id?: unknown;
  planCode?: unknown;
  code?: unknown;
  displayName?: unknown;
  name?: unknown;
  shortDescription?: unknown;
  fullDescription?: unknown;
  audienceType?: unknown;
  tierCode?: unknown;
  pricePaise?: unknown;
  amountPaise?: unknown;
  price?: {
    amountPaise?: unknown;
    currency?: unknown;
  };
  currency?: unknown;
  durationDays?: unknown;
  planVersion?: unknown;
  version?: unknown;
  features?: unknown;
  limits?: unknown;
}

export class RegistrationApiError extends Error {
  readonly status: number;
  readonly code?: string;
  readonly payload?: unknown;

  constructor(
    message: string,
    status: number,
    code?: string,
    payload?: unknown
  ) {
    super(message);
    this.name = "RegistrationApiError";
    this.status = status;
    this.code = code;
    this.payload = payload;
  }
}

const isJsonRecord = (value: unknown): value is JsonRecord =>
  typeof value === "object" &&
  value !== null &&
  !Array.isArray(value);

const getErrorPayload = (
  value: unknown
): RegistrationApiErrorPayload | null =>
  isJsonRecord(value)
    ? (value as RegistrationApiErrorPayload)
    : null;

const isHtmlResponse = (value: string): boolean =>
  /^\s*(?:<!doctype\s+html|<html|<body)/i.test(value);

const getErrorMessage = (
  status: number,
  parsedBody: unknown,
  rawBody: string
): string => {
  const payload = getErrorPayload(parsedBody);

  if (typeof payload?.message === "string") {
    const message = payload.message.trim();
    if (message) {
      return message;
    }
  }

  if (typeof payload?.error === "string") {
    const message = payload.error.trim();
    if (message) {
      return message;
    }
  }

  const textMessage = rawBody.trim();
  if (textMessage && !isHtmlResponse(textMessage)) {
    return textMessage;
  }

  return `Request failed with status ${status}.`;
};

const requestJSON = async <T>(
  path: string,
  init: RequestInit = {}
): Promise<T> => {
  const response = await fetch(`${API_URL}${path}`, init);
  const rawBody = await response.text();
  let parsedBody: unknown = null;

  if (rawBody.trim()) {
    try {
      parsedBody = JSON.parse(rawBody) as unknown;
    } catch {
      parsedBody = rawBody;
    }
  }

  if (!response.ok) {
    const payload = getErrorPayload(parsedBody);
    const code =
      typeof payload?.code === "string"
        ? payload.code
        : undefined;

    throw new RegistrationApiError(
      getErrorMessage(response.status, parsedBody, rawBody),
      response.status,
      code,
      parsedBody
    );
  }

  if (!rawBody.trim()) {
    throw new RegistrationApiError(
      "The server returned an empty response.",
      response.status,
      "EMPTY_RESPONSE"
    );
  }

  if (typeof parsedBody === "string") {
    throw new RegistrationApiError(
      "The server returned an unexpected response.",
      response.status,
      "INVALID_RESPONSE",
      parsedBody
    );
  }

  return parsedBody as T;
};

const registrationHeaders = (
  registrationToken: string
): HeadersInit => ({
  "Content-Type": "application/json",
  "x-registration-token": registrationToken,
});

const toTrimmedString = (
  ...values: unknown[]
): string => {
  for (const value of values) {
    if (typeof value === "string" && value.trim()) {
      return value.trim();
    }
  }

  return "";
};

const toFiniteNumber = (
  ...values: unknown[]
): number | null => {
  for (const value of values) {
    if (
      typeof value === "number" &&
      Number.isFinite(value)
    ) {
      return value;
    }

    if (
      typeof value === "string" &&
      value.trim() &&
      Number.isFinite(Number(value))
    ) {
      return Number(value);
    }
  }

  return null;
};

const toFeatureValue = (
  ...values: unknown[]
): boolean | number | string | null => {
  for (const value of values) {
    if (
      typeof value === "boolean" ||
      typeof value === "number" ||
      typeof value === "string"
    ) {
      return value;
    }
  }

  return null;
};

const normalizeFeature = (
  value: unknown,
  index: number
): RAPlanFeature | null => {
  if (!isJsonRecord(value)) {
    return null;
  }

  const raw = value as RawPlanFeature;
  const key =
    toTrimmedString(raw.key, raw.featureKey) ||
    `feature-${index + 1}`;
  const displayName =
    toTrimmedString(
      raw.displayName,
      raw.name,
      raw.key,
      raw.featureKey
    ) || "Plan feature";
  const featureValue = toFeatureValue(
    raw.value,
    raw.numericValue,
    raw.textValue
  );
  const enabledValue =
    typeof raw.enabled === "boolean"
      ? raw.enabled
      : typeof raw.isEnabled === "boolean"
        ? raw.isEnabled
        : featureValue !== false;

  return {
    key,
    displayName,
    description:
      typeof raw.description === "string" &&
      raw.description.trim()
        ? raw.description.trim()
        : null,
    enabled: enabledValue,
    value: featureValue,
  };
};

const normalizeLimit = (
  value: unknown,
  index: number
): RAPlanLimit | null => {
  if (!isJsonRecord(value)) {
    return null;
  }

  const raw = value as RawPlanLimit;
  const key =
    toTrimmedString(raw.key, raw.limitKey) ||
    `limit-${index + 1}`;
  const displayName =
    toTrimmedString(
      raw.displayName,
      raw.name,
      raw.key,
      raw.limitKey
    ) || "Plan limit";
  const unlimited =
    raw.unlimited === true || raw.isUnlimited === true;
  const numericValue = toFiniteNumber(
    raw.value,
    raw.limitValue
  );

  return {
    key,
    displayName,
    value: unlimited ? null : numericValue,
    unlimited,
  };
};

const normalizePlan = (
  value: unknown
): RAPlan | null => {
  if (!isJsonRecord(value)) {
    return null;
  }

  const raw = value as RawPlan;
  const id = toTrimmedString(raw.id);

  if (
    !id ||
    (raw.audienceType !== undefined &&
      raw.audienceType !== "RA")
  ) {
    return null;
  }

  const planCode =
    toTrimmedString(raw.planCode, raw.code) || id;
  const displayName =
    toTrimmedString(
      raw.displayName,
      raw.name,
      raw.planCode,
      raw.code
    ) || "Research Analyst plan";
  const features = Array.isArray(raw.features)
    ? raw.features
        .map(normalizeFeature)
        .filter(
          (feature): feature is RAPlanFeature =>
            feature !== null
        )
    : [];
  const limits = Array.isArray(raw.limits)
    ? raw.limits
        .map(normalizeLimit)
        .filter(
          (limit): limit is RAPlanLimit =>
            limit !== null
        )
    : [];
  const rawPrice =
    toFiniteNumber(
      raw.pricePaise,
      raw.amountPaise,
      raw.price?.amountPaise
    ) ?? 0;
  const pricePaise = Math.max(0, Math.round(rawPrice));
  const rawCurrency = toTrimmedString(
    raw.currency,
    raw.price?.currency
  );
  const currency = /^[A-Za-z]{3}$/.test(rawCurrency)
    ? rawCurrency.toUpperCase()
    : "INR";

  return {
    id,
    planCode,
    displayName,
    description:
      toTrimmedString(
        raw.shortDescription,
        raw.fullDescription
      ) || null,
    audienceType: "RA",
    tierCode: toTrimmedString(raw.tierCode),
    pricePaise,
    currency,
    durationDays: Math.max(
      0,
      Math.round(toFiniteNumber(raw.durationDays) ?? 0)
    ),
    planVersion: Math.max(
      0,
      Math.round(
        toFiniteNumber(raw.planVersion, raw.version) ?? 0
      )
    ),
    features,
    limits,
  };
};

export const getRAPlans = async (
  signal?: AbortSignal
): Promise<RAPlan[]> => {
  const result = await requestJSON<unknown>(
    "/api/subscription-plans?audienceType=RA",
    { signal }
  );
  const rawPlans = Array.isArray(result)
    ? result
    : isJsonRecord(result) && Array.isArray(result.plans)
      ? result.plans
      : null;

  if (!rawPlans) {
    throw new RegistrationApiError(
      "The plan service returned an unexpected response.",
      200,
      "INVALID_PLAN_RESPONSE",
      result
    );
  }

  return rawPlans
    .map(normalizePlan)
    .filter((plan): plan is RAPlan => plan !== null);
};

export const selectRAPlan = async (
  applicationId: string,
  registrationToken: string,
  planId: string,
  signal?: AbortSignal
): Promise<SelectRAPlanResponse> =>
  requestJSON<SelectRAPlanResponse>(
    `/api/registration/${encodeURIComponent(
      applicationId
    )}/select-plan`,
    {
      method: "POST",
      headers: registrationHeaders(registrationToken),
      body: JSON.stringify({ planId }),
      signal,
    }
  );

export const createRARegistrationPaymentOrder = async (
  applicationId: string,
  registrationToken: string,
  signal?: AbortSignal
): Promise<RegistrationPaymentOrderResponse> =>
  requestJSON<RegistrationPaymentOrderResponse>(
    "/api/payments/registration-order",
    {
      method: "POST",
      headers: registrationHeaders(registrationToken),
      body: JSON.stringify({ applicationId }),
      signal,
    }
  );

export const verifyRARegistrationPayment = async (
  applicationId: string,
  registrationToken: string,
  razorpayResult: RazorpaySuccessResponse,
  signal?: AbortSignal
): Promise<VerifyRegistrationPaymentResponse> =>
  requestJSON<VerifyRegistrationPaymentResponse>(
    "/api/payments/registration-verify",
    {
      method: "POST",
      headers: registrationHeaders(registrationToken),
      body: JSON.stringify({
        applicationId,
        razorpayOrderId:
          razorpayResult.razorpay_order_id,
        razorpayPaymentId:
          razorpayResult.razorpay_payment_id,
        razorpaySignature:
          razorpayResult.razorpay_signature,
      }),
      signal,
    }
  );

export const validateRAPasswordSetupToken = async (
  token: string,
  signal?: AbortSignal
): Promise<PasswordSetupValidationResponse> =>
  requestJSON<PasswordSetupValidationResponse>(
    `/api/auth/password-setup/validate?token=${encodeURIComponent(
      token
    )}`,
    { signal }
  );

export const completeRAPasswordSetup = async (
  token: string,
  password: string,
  confirmPassword: string,
  signal?: AbortSignal
): Promise<CompletePasswordSetupResponse> =>
  requestJSON<CompletePasswordSetupResponse>(
    "/api/auth/password-setup",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        token,
        password,
        confirmPassword,
      }),
      signal,
    }
  );
