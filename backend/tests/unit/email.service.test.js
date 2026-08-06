"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vitest_1 = require("vitest");
const email_service_1 = require("../../src/services/email/email.service");
const email_templates_1 = require("../../src/services/email/email.templates");
const configuredEmail = {
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
    info: vitest_1.vi.fn(),
    error: vitest_1.vi.fn(),
};
const sentInfo = {
    messageId: "message-1",
    accepted: ["recipient@example.test"],
    rejected: [],
    response: "250 Accepted",
};
(0, vitest_1.describe)("EmailService", () => {
    (0, vitest_1.it)("skips safely when email is disabled", async () => {
        const createTransport = vitest_1.vi.fn();
        const service = (0, email_service_1.createEmailService)({
            config: {
                ...configuredEmail,
                enabled: false,
            },
            createTransport,
            logger,
        });
        const result = await service.send("RA_REGISTRATION_RECEIVED", "recipient@example.test", { name: "Sample Analyst" });
        (0, vitest_1.expect)(result).toEqual({
            sent: false,
            skipped: true,
            reason: "EMAIL_DISABLED",
        });
        (0, vitest_1.expect)(createTransport).not.toHaveBeenCalled();
    });
    (0, vitest_1.it)("skips safely when required configuration is missing", async () => {
        const createTransport = vitest_1.vi.fn();
        const service = (0, email_service_1.createEmailService)({
            config: {
                ...configuredEmail,
                host: "",
            },
            createTransport,
            logger,
        });
        const result = await service.send("RA_APPROVED", "recipient@example.test", {
            name: "Sample Analyst",
            passwordSetupUrl: "https://example.test/set-password?token=test",
        });
        (0, vitest_1.expect)(result.reason).toBe("EMAIL_NOT_CONFIGURED");
        (0, vitest_1.expect)(createTransport).not.toHaveBeenCalled();
    });
    (0, vitest_1.it)("returns safe delivery details after a mocked send", async () => {
        let message;
        const createTransport = () => ({
            sendMail: async (options) => {
                message = options;
                return sentInfo;
            },
        });
        const service = (0, email_service_1.createEmailService)({
            config: configuredEmail,
            createTransport,
            logger,
        });
        const result = await service.send("BROKER_APPROVED", "recipient@example.test", {
            name: "Sample Broker",
            passwordSetupUrl: "https://example.test/set-password?token=test",
        });
        (0, vitest_1.expect)(result.sent).toBe(true);
        (0, vitest_1.expect)(result.messageId).toBe("message-1");
        (0, vitest_1.expect)(result.accepted).toEqual([
            "recipient@example.test",
        ]);
        (0, vitest_1.expect)(message?.subject).toContain("Broker");
        (0, vitest_1.expect)(message?.text).toContain("Set your password");
    });
    (0, vitest_1.it)("returns SEND_FAILED after a mocked transport error", async () => {
        const authenticationError = Object.assign(new Error("Authentication failed"), { code: "EAUTH" });
        const service = (0, email_service_1.createEmailService)({
            config: configuredEmail,
            createTransport: () => ({
                sendMail: async () => {
                    throw authenticationError;
                },
            }),
            logger,
        });
        const result = await service.send("PAYMENT_FAILED", "recipient@example.test", {
            name: "Sample User",
            amount: "INR 100",
            reference: "payment-reference",
        });
        (0, vitest_1.expect)(result).toMatchObject({
            sent: false,
            skipped: false,
            reason: "SEND_FAILED",
            errorCode: "EAUTH",
        });
    });
});
(0, vitest_1.describe)("email templates", () => {
    (0, vitest_1.it)("escapes dynamic HTML content", () => {
        const rendered = (0, email_templates_1.renderEmailTemplate)("RA_REJECTED", {
            name: "<script>alert(1)</script>",
            reason: '<img src=x onerror="alert(1)">',
        });
        (0, vitest_1.expect)(rendered.html).not.toContain("<script>");
        (0, vitest_1.expect)(rendered.html).not.toContain("<img src=x");
        (0, vitest_1.expect)(rendered.html).toContain("&lt;script&gt;");
        (0, vitest_1.expect)((0, email_templates_1.escapeHtml)("'quoted'")).toBe("&#039;quoted&#039;");
    });
    (0, vitest_1.it)("renders subject, text, and HTML for required templates", () => {
        const rendered = (0, email_templates_1.renderEmailTemplate)("SUBSCRIPTION_EXPIRY_REMINDER", {
            name: "Sample User",
            expiryDate: "31 July 2026",
        });
        (0, vitest_1.expect)(rendered.subject).toBe("Subscription expiry reminder");
        (0, vitest_1.expect)(rendered.text).toContain("31 July 2026");
        (0, vitest_1.expect)(rendered.html).toContain("Lotus Funds");
    });
});
