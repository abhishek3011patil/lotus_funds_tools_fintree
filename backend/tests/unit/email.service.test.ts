import { describe, expect, it, vi } from "vitest";
import type {
  SendMailOptions,
  SentMessageInfo,
} from "nodemailer";
import {
  createEmailService,
  type EmailTransportFactory,
} from "../../src/services/email/email.service";
import type { EmailConfig } from "../../src/services/email/email.config";
import {
  escapeHtml,
  renderEmailTemplate,
} from "../../src/services/email/email.templates";

const configuredEmail: EmailConfig = {
  enabled: true,
  provider: "smtp",
  host: "smtp.example.test",
  port: 587,
  secure: false,
  user: "mailer@example.test",
  password: "app-password",
  fromName: "Lotus Funds",
  fromAddress: "mailer@example.test",
};

const logger = {
  info: vi.fn(),
  error: vi.fn(),
};

const sentInfo: SentMessageInfo = {
  messageId: "message-1",
  accepted: ["recipient@example.test"],
  rejected: [],
  response: "250 Accepted",
};

describe("EmailService", () => {
  it("skips safely when email is disabled", async () => {
    const createTransport = vi.fn();
    const service = createEmailService({
      config: {
        ...configuredEmail,
        enabled: false,
      },
      createTransport,
      logger,
    });

    const result = await service.send(
      "RA_REGISTRATION_RECEIVED",
      "recipient@example.test",
      { name: "Sample Analyst" }
    );

    expect(result).toEqual({
      sent: false,
      skipped: true,
      reason: "EMAIL_DISABLED",
    });
    expect(createTransport).not.toHaveBeenCalled();
  });

  it("skips safely when required configuration is missing", async () => {
    const createTransport = vi.fn();
    const service = createEmailService({
      config: {
        ...configuredEmail,
        host: "",
      },
      createTransport,
      logger,
    });

    const result = await service.send(
      "RA_APPROVED",
      "recipient@example.test",
      {
        name: "Sample Analyst",
        passwordSetupUrl:
          "https://example.test/set-password?token=test",
      }
    );

    expect(result.reason).toBe(
      "EMAIL_NOT_CONFIGURED"
    );
    expect(createTransport).not.toHaveBeenCalled();
  });

  it("returns safe delivery details after a mocked send", async () => {
    let message: SendMailOptions | undefined;
    const createTransport: EmailTransportFactory = () => ({
      sendMail: async (options) => {
        message = options;
        return sentInfo;
      },
    });
    const service = createEmailService({
      config: configuredEmail,
      createTransport,
      logger,
    });

    const result = await service.send(
      "BROKER_APPROVED",
      "recipient@example.test",
      {
        name: "Sample Broker",
        passwordSetupUrl:
          "https://example.test/set-password?token=test",
      }
    );

    expect(result.sent).toBe(true);
    expect(result.messageId).toBe("message-1");
    expect(result.accepted).toEqual([
      "recipient@example.test",
    ]);
    expect(message?.subject).toContain("Broker");
    expect(message?.text).toContain("Set your password");
  });

  it("returns SEND_FAILED after a mocked transport error", async () => {
    const authenticationError = Object.assign(
      new Error("Authentication failed"),
      { code: "EAUTH" }
    );
    const service = createEmailService({
      config: configuredEmail,
      createTransport: () => ({
        sendMail: async () => {
          throw authenticationError;
        },
      }),
      logger,
    });

    const result = await service.send(
      "PAYMENT_FAILED",
      "recipient@example.test",
      {
        name: "Sample User",
        amount: "INR 100",
        reference: "payment-reference",
      }
    );

    expect(result).toMatchObject({
      sent: false,
      skipped: false,
      reason: "SEND_FAILED",
      errorCode: "EAUTH",
    });
  });
});

describe("email templates", () => {
  it("escapes dynamic HTML content", () => {
    const rendered = renderEmailTemplate(
      "RA_REJECTED",
      {
        name: "<script>alert(1)</script>",
        reason: '<img src=x onerror="alert(1)">',
      }
    );

    expect(rendered.html).not.toContain("<script>");
    expect(rendered.html).not.toContain("<img src=x");
    expect(rendered.html).toContain("&lt;script&gt;");
    expect(escapeHtml("'quoted'")).toBe(
      "&#039;quoted&#039;"
    );
  });

  it("renders subject, text, and HTML for required templates", () => {
    const rendered = renderEmailTemplate(
      "SUBSCRIPTION_EXPIRY_REMINDER",
      {
        name: "Sample User",
        expiryDate: "31 July 2026",
      }
    );

    expect(rendered.subject).toBe(
      "Subscription expiry reminder"
    );
    expect(rendered.text).toContain("31 July 2026");
    expect(rendered.html).toContain("Lotus Funds");
  });

  it("renders a password setup resend without approval wording", () => {
    const rendered = renderEmailTemplate(
      "PASSWORD_SETUP_RESENT",
      {
        name: "Sample Analyst",
        passwordSetupUrl:
          "https://example.test/set-password?token=test",
        expiresInHours: 24,
      }
    );

    expect(rendered.subject).toBe(
      "Your new password setup link"
    );
    expect(rendered.text).toContain(
      "new password setup link"
    );
    expect(rendered.text).not.toContain("approved");
    expect(rendered.html).toContain("Set your password");
  });

  it("renders an administrator password reset link", () => {
    const rendered = renderEmailTemplate(
      "PASSWORD_RESET_LINK",
      {
        name: "Active Analyst",
        passwordResetUrl:
          "https://example.test/reset-password?token=test",
        expiresInHours: 1,
      }
    );

    expect(rendered.subject).toBe("Reset your password");
    expect(rendered.text).toContain("administrator");
    expect(rendered.text).toContain("OTP");
    expect(rendered.text).not.toContain("approved");
  });
});
