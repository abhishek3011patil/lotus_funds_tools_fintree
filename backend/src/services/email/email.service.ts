import nodemailer, {
  type SendMailOptions,
  type SentMessageInfo,
} from "nodemailer";
import {
  getEmailConfig,
  getMissingEmailConfig,
  type EmailConfig,
} from "./email.config";
import { renderEmailTemplate } from "./email.templates";
import type {
  EmailSendResult,
  EmailTemplateDataMap,
  EmailTemplateName,
} from "./email.types";

export interface EmailTransport {
  sendMail(
    options: SendMailOptions
  ): Promise<SentMessageInfo>;
}

export type EmailTransportFactory = (
  config: EmailConfig
) => EmailTransport;

interface EmailLogger {
  info(message: string, details?: unknown): void;
  error(message: string, details?: unknown): void;
}

interface EmailServiceOptions {
  config?: EmailConfig;
  createTransport?: EmailTransportFactory;
  logger?: EmailLogger;
}

const defaultTransportFactory: EmailTransportFactory = (
  config
) =>
  nodemailer.createTransport(
    config.provider === "gmail"
      ? {
          service: "gmail",
          auth: {
            user: config.user,
            pass: config.password,
          },
        }
      : {
          host: config.host,
          port: config.port,
          secure: config.secure,
          auth: {
            user: config.user,
            pass: config.password,
          },
        }
  );

export const sanitizeRecipient = (
  recipient: string
): string => {
  const [localPart, domain] = recipient.split("@");

  if (!domain) {
    return "invalid-recipient";
  }

  const visible = localPart.slice(0, 1);
  return `${visible}${"*".repeat(
    Math.max(localPart.length - 1, 3)
  )}@${domain}`;
};

const normalizeAddresses = (
  value: unknown
): string[] => {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.map((item) => String(item));
};

const getSafeEmailError = (
  error: unknown
): { message: string; code?: string } => {
  if (!(error instanceof Error)) {
    return { message: "Unknown email delivery error" };
  }

  const code =
    "code" in error &&
    typeof error.code === "string"
      ? error.code
      : undefined;

  return {
    message: error.message,
    code,
  };
};

export class EmailService {
  private readonly config: EmailConfig;
  private readonly createTransport: EmailTransportFactory;
  private readonly logger: EmailLogger;
  private transport: EmailTransport | null = null;

  constructor(options: EmailServiceOptions = {}) {
    this.config = options.config || getEmailConfig();
    this.createTransport =
      options.createTransport || defaultTransportFactory;
    this.logger = options.logger || console;
  }

  async send<Name extends EmailTemplateName>(
    templateName: Name,
    recipient: string,
    data: EmailTemplateDataMap[Name]
  ): Promise<EmailSendResult> {
    const sanitizedRecipient =
      sanitizeRecipient(recipient);

    if (!this.config.enabled) {
      this.logger.info("EMAIL EVENT", {
        template: templateName,
        eventType: templateName,
        status: "SKIPPED",
        reason: "EMAIL_DISABLED",
        recipient: sanitizedRecipient,
      });

      return {
        sent: false,
        skipped: true,
        reason: "EMAIL_DISABLED",
      };
    }

    const missingConfiguration =
      getMissingEmailConfig(this.config);

    if (missingConfiguration.length > 0) {
      this.logger.error("EMAIL EVENT", {
        template: templateName,
        eventType: templateName,
        status: "SKIPPED",
        reason: "EMAIL_NOT_CONFIGURED",
        missingConfiguration,
        recipient: sanitizedRecipient,
      });

      return {
        sent: false,
        skipped: true,
        reason: "EMAIL_NOT_CONFIGURED",
      };
    }

    const rendered = renderEmailTemplate(
      templateName,
      data
    );

    try {
      this.transport =
        this.transport ||
        this.createTransport(this.config);

      const info = await this.transport.sendMail({
        from: {
          name: this.config.fromName,
          address: this.config.fromAddress,
        },
        to: recipient,
        subject: rendered.subject,
        text: rendered.text,
        html: rendered.html,
      });
      const accepted = normalizeAddresses(info.accepted);
      const rejected = normalizeAddresses(info.rejected);

      this.logger.info("EMAIL EVENT", {
        template: templateName,
        eventType: templateName,
        status: "SENT",
        recipient: sanitizedRecipient,
        messageId: info.messageId,
        acceptedCount: accepted.length,
        rejectedCount: rejected.length,
      });

      return {
        sent: true,
        skipped: false,
        messageId: String(info.messageId || ""),
        accepted,
        rejected,
      };
    } catch (error) {
      const safeError = getSafeEmailError(error);

      this.logger.error("EMAIL EVENT", {
        template: templateName,
        eventType: templateName,
        status: "FAILED",
        recipient: sanitizedRecipient,
        error: safeError,
      });

      return {
        sent: false,
        skipped: false,
        reason: "SEND_FAILED",
        errorCode: safeError.code,
      };
    }
  }
}

export const createEmailService = (
  options: EmailServiceOptions = {}
): EmailService => new EmailService(options);
