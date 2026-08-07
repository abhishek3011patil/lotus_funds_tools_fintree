export type EmailTemplateName =
  | "RA_REGISTRATION_RECEIVED"
  | "RA_APPROVED"
  | "RA_REJECTED"
  | "RA_SUSPENDED"
  | "BROKER_REGISTRATION_RECEIVED"
  | "BROKER_APPROVED"
  | "BROKER_REJECTED"
  | "SUBSCRIPTION_EXPIRY_REMINDER"
  | "SUBSCRIPTION_EXPIRED"
  | "SUBSCRIPTION_CANCELLED"
  | "PAYMENT_SUCCESSFUL"
  | "PAYMENT_FAILED"
  | "RESEARCH_CALL_DELIVERY_FAILURE"
  | "ERRATA_NOTIFICATION";

export interface RegistrationReceivedTemplateData {
  name: string;
  applicationId?: string;
}

export interface ApprovalTemplateData {
  name: string;
  passwordSetupUrl: string;
}

export interface RejectionTemplateData {
  name: string;
  reason: string;
  refundRequired?: boolean;
  refundStatus?: string;
  amountPaise?: number;
  currency?: string;
}

export interface SuspensionTemplateData {
  name: string;
  reason?: string;
}

export interface SubscriptionTemplateData {
  name: string;
  expiryDate: string;
}

export interface SubscriptionCancellationTemplateData {
  name: string;
  planName: string;
  cancelledAt: string;
  reason: string;
}

export interface PaymentTemplateData {
  name: string;
  amount: string;
  reference: string;
}

export interface ResearchCallDeliveryFailureTemplateData {
  name: string;
  callReference: string;
  channel: string;
  reason: string;
}

export interface ErrataTemplateData {
  name: string;
  symbol: string;
  summary: string;
}

export interface EmailTemplateDataMap {
  RA_REGISTRATION_RECEIVED:
    RegistrationReceivedTemplateData;
  RA_APPROVED: ApprovalTemplateData;
  RA_REJECTED: RejectionTemplateData;
  RA_SUSPENDED: SuspensionTemplateData;
  BROKER_REGISTRATION_RECEIVED:
    RegistrationReceivedTemplateData;
  BROKER_APPROVED: ApprovalTemplateData;
  BROKER_REJECTED: RejectionTemplateData;
  SUBSCRIPTION_EXPIRY_REMINDER:
    SubscriptionTemplateData;
  SUBSCRIPTION_EXPIRED: SubscriptionTemplateData;
  SUBSCRIPTION_CANCELLED:
    SubscriptionCancellationTemplateData;
  PAYMENT_SUCCESSFUL: PaymentTemplateData;
  PAYMENT_FAILED: PaymentTemplateData;
  RESEARCH_CALL_DELIVERY_FAILURE:
    ResearchCallDeliveryFailureTemplateData;
  ERRATA_NOTIFICATION: ErrataTemplateData;
}

export interface RenderedEmailTemplate {
  subject: string;
  text: string;
  html: string;
}

export type EmailSkipReason =
  | "EMAIL_DISABLED"
  | "EMAIL_NOT_CONFIGURED";

export interface EmailSendResult {
  sent: boolean;
  skipped: boolean;
  reason?: EmailSkipReason | "SEND_FAILED";
  messageId?: string;
  accepted?: string[];
  rejected?: string[];
  errorCode?: string;
}
