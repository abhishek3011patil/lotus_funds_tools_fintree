import type {
  EmailTemplateDataMap,
  EmailTemplateName,
  RenderedEmailTemplate,
  RejectionTemplateData,
} from "./email.types";

export const escapeHtml = (value: unknown): string =>
  String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");

const brandedLayout = (
  title: string,
  bodyHtml: string
): string => `
<!doctype html>
<html lang="en">
  <body style="margin:0;background:#f6f7fb;font-family:Arial,sans-serif;color:#1f2937">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#f6f7fb;padding:24px">
      <tr>
        <td align="center">
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:640px;background:#ffffff;border:1px solid #e5e7eb;border-radius:8px">
            <tr>
              <td style="padding:20px 24px;background:#1d4ed8;color:#ffffff;font-size:20px;font-weight:bold">
                Lotus Funds
              </td>
            </tr>
            <tr>
              <td style="padding:24px">
                <h1 style="font-size:20px;margin:0 0 16px">${escapeHtml(
                  title
                )}</h1>
                ${bodyHtml}
                <p style="margin:24px 0 0;color:#6b7280;font-size:12px">This is an automated Lotus Funds notification.</p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`.trim();

const paragraph = (value: unknown): string =>
  `<p style="line-height:1.6;margin:0 0 12px">${escapeHtml(
    value
  )}</p>`;

const linkButton = (
  label: string,
  url: string
): string =>
  `<p style="margin:20px 0"><a href="${escapeHtml(
    url
  )}" style="display:inline-block;background:#1d4ed8;color:#ffffff;text-decoration:none;padding:10px 16px;border-radius:6px">${escapeHtml(
    label
  )}</a></p>`;

const registrationReceived = (
  role: "Research Analyst" | "Broker",
  data: EmailTemplateDataMap["RA_REGISTRATION_RECEIVED"]
): RenderedEmailTemplate => {
  const reference = data.applicationId
    ? ` Application reference: ${data.applicationId}.`
    : "";
  const subject = `${role} registration received`;
  const text = `Hello ${data.name},\n\nWe received your ${role.toLowerCase()} registration.${reference} We will notify you after review.`;

  return {
    subject,
    text,
    html: brandedLayout(
      subject,
      paragraph(`Hello ${data.name},`) +
        paragraph(
          `We received your ${role.toLowerCase()} registration.${reference}`
        ) +
        paragraph(
          "We will notify you after review."
        )
    ),
  };
};

const approved = (
  role: "Research Analyst" | "Broker",
  data: EmailTemplateDataMap["RA_APPROVED"]
): RenderedEmailTemplate => {
  const subject = `${role} account approved`;
  const text = `Hello ${data.name},\n\nYour ${role.toLowerCase()} account has been approved. Set your password using this link:\n${data.passwordSetupUrl}`;

  return {
    subject,
    text,
    html: brandedLayout(
      subject,
      paragraph(`Hello ${data.name},`) +
        paragraph(
          `Your ${role.toLowerCase()} account has been approved.`
        ) +
        linkButton(
          "Set your password",
          data.passwordSetupUrl
        )
    ),
  };
};

const formatRefundMessage = (
  data: RejectionTemplateData
): string => {
  if (!data.refundRequired) {
    return "No payment refund is required for this application.";
  }

  const amount =
    data.amountPaise !== undefined &&
    Number.isFinite(data.amountPaise)
      ? new Intl.NumberFormat("en-IN", {
          style: "currency",
          currency: data.currency || "INR",
        }).format(data.amountPaise / 100)
      : null;
  const amountText = amount ? ` of ${amount}` : "";

  if (data.refundStatus === "processed") {
    return `A full refund${amountText} has been processed to the original payment method.`;
  }
  if (data.refundStatus === "failed") {
    return "We could not complete the refund automatically. Our team will review it.";
  }

  return `A full refund${amountText} has been initiated and is being processed.`;
};

const rejected = (
  role: "Research Analyst" | "Broker",
  data: RejectionTemplateData
): RenderedEmailTemplate => {
  const subject = `${role} registration review update`;
  const refundMessage = formatRefundMessage(data);
  const text = `Hello ${data.name},\n\nYour ${role.toLowerCase()} registration was not approved.\nReason: ${data.reason}\n\n${refundMessage}`;

  return {
    subject,
    text,
    html: brandedLayout(
      subject,
      paragraph(`Hello ${data.name},`) +
        paragraph(
          `Your ${role.toLowerCase()} registration was not approved.`
        ) +
        paragraph(`Reason: ${data.reason}`) +
        paragraph(refundMessage)
    ),
  };
};

type TemplateRendererMap = {
  [Name in EmailTemplateName]: (
    data: EmailTemplateDataMap[Name]
  ) => RenderedEmailTemplate;
};

const renderers: TemplateRendererMap = {
  RA_REGISTRATION_RECEIVED: (data) =>
    registrationReceived("Research Analyst", data),
  RA_APPROVED: (data) =>
    approved("Research Analyst", data),
  RA_REJECTED: (data) =>
    rejected("Research Analyst", data),
  RA_SUSPENDED: (data) => {
    const subject = "Research Analyst account suspended";
    const reason = data.reason
      ? ` Reason: ${data.reason}`
      : "";
    return {
      subject,
      text: `Hello ${data.name},\n\nYour Research Analyst account has been suspended.${reason}`,
      html: brandedLayout(
        subject,
        paragraph(`Hello ${data.name},`) +
          paragraph(
            `Your Research Analyst account has been suspended.${reason}`
          )
      ),
    };
  },
  BROKER_REGISTRATION_RECEIVED: (data) =>
    registrationReceived("Broker", data),
  BROKER_APPROVED: (data) =>
    approved("Broker", data),
  BROKER_REJECTED: (data) =>
    rejected("Broker", data),
  SUBSCRIPTION_EXPIRY_REMINDER: (data) => {
    const subject = "Subscription expiry reminder";
    return {
      subject,
      text: `Hello ${data.name},\n\nYour Lotus Funds subscription expires on ${data.expiryDate}.`,
      html: brandedLayout(
        subject,
        paragraph(`Hello ${data.name},`) +
          paragraph(
            `Your Lotus Funds subscription expires on ${data.expiryDate}.`
          )
      ),
    };
  },
  SUBSCRIPTION_EXPIRED: (data) => {
    const subject = "Subscription expired";
    return {
      subject,
      text: `Hello ${data.name},\n\nYour Lotus Funds subscription expired on ${data.expiryDate}.`,
      html: brandedLayout(
        subject,
        paragraph(`Hello ${data.name},`) +
          paragraph(
            `Your Lotus Funds subscription expired on ${data.expiryDate}.`
          )
      ),
    };
  },
  SUBSCRIPTION_CANCELLED: (data) => {
    const subject = "Subscription cancelled";
    const text = `Hello ${data.name},\n\nYour ${data.planName} subscription was cancelled on ${data.cancelledAt}.\nReason: ${data.reason}\n\nYour account remains available, but subscription-protected features are disabled. You can renew again from Settings.`;
    return {
      subject,
      text,
      html: brandedLayout(
        subject,
        paragraph(`Hello ${data.name},`) +
          paragraph(
            `Your ${data.planName} subscription was cancelled on ${data.cancelledAt}.`
          ) +
          paragraph(`Reason: ${data.reason}`) +
          paragraph(
            "Your account remains available, but subscription-protected features are disabled. You can renew again from Settings."
          )
      ),
    };
  },
  PAYMENT_SUCCESSFUL: (data) => {
    const subject = "Payment successful";
    return {
      subject,
      text: `Hello ${data.name},\n\nWe received your payment of ${data.amount}. Reference: ${data.reference}.`,
      html: brandedLayout(
        subject,
        paragraph(`Hello ${data.name},`) +
          paragraph(
            `We received your payment of ${data.amount}.`
          ) +
          paragraph(`Reference: ${data.reference}`)
      ),
    };
  },
  PAYMENT_FAILED: (data) => {
    const subject = "Payment failed";
    return {
      subject,
      text: `Hello ${data.name},\n\nYour payment of ${data.amount} could not be completed. Reference: ${data.reference}.`,
      html: brandedLayout(
        subject,
        paragraph(`Hello ${data.name},`) +
          paragraph(
            `Your payment of ${data.amount} could not be completed.`
          ) +
          paragraph(`Reference: ${data.reference}`)
      ),
    };
  },
  RESEARCH_CALL_DELIVERY_FAILURE: (data) => {
    const subject = "Research call delivery failure";
    return {
      subject,
      text: `Hello ${data.name},\n\nResearch call ${data.callReference} could not be delivered through ${data.channel}. Reason: ${data.reason}`,
      html: brandedLayout(
        subject,
        paragraph(`Hello ${data.name},`) +
          paragraph(
            `Research call ${data.callReference} could not be delivered through ${data.channel}.`
          ) +
          paragraph(`Reason: ${data.reason}`)
      ),
    };
  },
  ERRATA_NOTIFICATION: (data) => {
    const subject = `Errata notification for ${data.symbol}`;
    return {
      subject,
      text: `Hello ${data.name},\n\nAn Errata was issued for ${data.symbol}.\n${data.summary}`,
      html: brandedLayout(
        subject,
        paragraph(`Hello ${data.name},`) +
          paragraph(
            `An Errata was issued for ${data.symbol}.`
          ) +
          paragraph(data.summary)
      ),
    };
  },
};

export const renderEmailTemplate = <
  Name extends EmailTemplateName
>(
  name: Name,
  data: EmailTemplateDataMap[Name]
): RenderedEmailTemplate => renderers[name](data);
