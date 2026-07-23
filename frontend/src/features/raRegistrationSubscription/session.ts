import type {
  RAAudienceType,
  RARegistrationPaymentStatus,
  RARegistrationSession,
} from "./types";

const SESSION_KEYS = {
  applicationId: "registration_application_id",
  registrationToken: "registration_token",
  tokenExpiresAt: "registration_token_expires_at",
  paymentStatus: "registration_payment_status",
  selectedPlanId: "registration_selected_plan_id",
  audienceType: "registration_audience_type",
} as const;

const getSessionStorage = (): Storage | null => {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    return window.sessionStorage;
  } catch {
    return null;
  }
};

const getNonEmptyValue = (
  storage: Storage,
  key: string
): string | null => {
  const value = storage.getItem(key)?.trim();
  return value ? value : null;
};

export const saveRARegistrationSession = (
  session: Omit<
    RARegistrationSession,
    "paymentStatus" | "selectedPlanId"
  > &
    Partial<
      Pick<
        RARegistrationSession,
        "paymentStatus" | "selectedPlanId"
      >
    >
): void => {
  const storage = getSessionStorage();

  if (!storage) {
    throw new Error(
      "Session storage is unavailable in this browser."
    );
  }

  const applicationId = session.applicationId.trim();
  const registrationToken =
    session.registrationToken.trim();
  const tokenExpiresAt = session.tokenExpiresAt.trim();

  if (
    !applicationId ||
    !registrationToken ||
    !tokenExpiresAt ||
    Number.isNaN(Date.parse(tokenExpiresAt))
  ) {
    throw new Error(
      "The registration session details are incomplete."
    );
  }

  if (session.audienceType !== "RA") {
    throw new Error(
      "Only Research Analyst registration sessions are supported."
    );
  }

  storage.setItem(
    SESSION_KEYS.applicationId,
    applicationId
  );
  storage.setItem(
    SESSION_KEYS.registrationToken,
    registrationToken
  );
  storage.setItem(
    SESSION_KEYS.tokenExpiresAt,
    tokenExpiresAt
  );
  storage.setItem(
    SESSION_KEYS.audienceType,
    session.audienceType
  );

  if (session.selectedPlanId?.trim()) {
    storage.setItem(
      SESSION_KEYS.selectedPlanId,
      session.selectedPlanId.trim()
    );
  } else {
    storage.removeItem(SESSION_KEYS.selectedPlanId);
  }

  if (session.paymentStatus) {
    storage.setItem(
      SESSION_KEYS.paymentStatus,
      session.paymentStatus
    );
  } else {
    storage.removeItem(SESSION_KEYS.paymentStatus);
  }
};

export const getRARegistrationSession =
  (): RARegistrationSession | null => {
    const storage = getSessionStorage();

    if (!storage) {
      return null;
    }

    const applicationId = getNonEmptyValue(
      storage,
      SESSION_KEYS.applicationId
    );
    const registrationToken = getNonEmptyValue(
      storage,
      SESSION_KEYS.registrationToken
    );
    const tokenExpiresAt = getNonEmptyValue(
      storage,
      SESSION_KEYS.tokenExpiresAt
    );
    const audienceType = getNonEmptyValue(
      storage,
      SESSION_KEYS.audienceType
    );

    if (
      !applicationId ||
      !registrationToken ||
      !tokenExpiresAt ||
      audienceType !== "RA"
    ) {
      return null;
    }

    const paymentStatusValue = getNonEmptyValue(
      storage,
      SESSION_KEYS.paymentStatus
    );
    const paymentStatus:
      | RARegistrationPaymentStatus
      | undefined =
      paymentStatusValue === "PAID_PENDING_APPROVAL"
        ? paymentStatusValue
        : undefined;
    const selectedPlanId =
      getNonEmptyValue(
        storage,
        SESSION_KEYS.selectedPlanId
      ) ?? undefined;

    return {
      applicationId,
      registrationToken,
      tokenExpiresAt,
      audienceType: audienceType as RAAudienceType,
      paymentStatus,
      selectedPlanId,
    };
  };

export const clearRARegistrationSession = (): void => {
  const storage = getSessionStorage();

  if (!storage) {
    return;
  }

  Object.values(SESSION_KEYS).forEach((key) => {
    storage.removeItem(key);
  });
};

export const isRARegistrationSessionExpired = (
  session: Pick<RARegistrationSession, "tokenExpiresAt">
): boolean => {
  const expiresAt = Date.parse(session.tokenExpiresAt);

  return (
    Number.isNaN(expiresAt) || expiresAt <= Date.now()
  );
};

export const setRASelectedPlanId = (
  planId: string
): void => {
  const storage = getSessionStorage();
  const normalizedPlanId = planId.trim();

  if (!storage || !normalizedPlanId) {
    return;
  }

  storage.setItem(
    SESSION_KEYS.selectedPlanId,
    normalizedPlanId
  );
};

export const setRAPaymentStatus = (
  status: RARegistrationPaymentStatus
): void => {
  const storage = getSessionStorage();

  if (!storage) {
    return;
  }

  storage.setItem(SESSION_KEYS.paymentStatus, status);
};
