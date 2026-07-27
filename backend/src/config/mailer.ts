import "./env";
import nodemailer from "nodemailer";

const emailUser =
  process.env.EMAIL_USER?.trim() || "";
const emailPass =
  process.env.EMAIL_PASS?.replace(/\s/g, "") || "";

console.info("EMAIL CONFIGURATION:", {
  emailUserLoaded: Boolean(emailUser),
  emailPassExists: Boolean(emailPass),
});

export const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: emailUser,
    pass: emailPass,
  },
});

const getEmailErrorDetails = (
  error: unknown
) => {
  const mailError = error as {
    name?: string;
    message?: string;
    code?: string;
    command?: string;
    response?: string;
    responseCode?: number;
    stack?: string;
  };

  return {
    name: mailError?.name || "Error",
    message:
      mailError?.message ||
      "Unknown email error",
    code: mailError?.code || null,
    command: mailError?.command || null,
    response: mailError?.response || null,
    responseCode:
      mailError?.responseCode || null,
    stack: mailError?.stack || null,
  };
};

export const sendApprovalMail = async (
  to: string,
  name: string,
  link: string
) => {
  try {
    console.log("Sending approval email to:", to);

    const info = await transporter.sendMail({
      from: emailUser,
      to,
      subject: "Account Approved - Set Your Password",
      html: `
        <h2>Hello ${name}</h2>
        <p>Your account has been approved.</p>
        <a href="${link}">Set Password</a>
      `,
    });

    console.info("APPROVAL EMAIL DELIVERY:", {
      messageId: info.messageId,
      accepted: info.accepted,
      rejected: info.rejected,
      response: info.response,
    });

  } catch (error) {
    console.error(
      "APPROVAL EMAIL ERROR:",
      getEmailErrorDetails(error)
    );
    throw error;
  }
};

/* ✅ ADD THIS FUNCTION */
export const sendOtpMail = async (to: string, otp: string) => {
  await transporter.sendMail({
    from: emailUser,
    to,
    subject: "Your OTP Code",
    html: `
      <h2>Your OTP is: ${otp}</h2>
      <p>This OTP will expire in 5 minutes.</p>
    `,
  });
};


type RejectionRefundMailInput = {
  to: string;
  name: string;
  reason: string;
  refundRequired: boolean;
  refundStatus?: string;
  amountPaise?: number;
  currency?: string;
};

const formatRefundAmount = (
  amountPaise?: number,
  currency = "INR"
): string | null => {
  if (
    amountPaise === undefined ||
    !Number.isFinite(amountPaise)
  ) {
    return null;
  }

  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency,
  }).format(amountPaise / 100);
};

export const sendRejectionRefundMail =
  async ({
    to,
    name,
    reason,
    refundRequired,
    refundStatus,
    amountPaise,
    currency = "INR",
  }: RejectionRefundMailInput) => {
    const formattedAmount =
      formatRefundAmount(
        amountPaise,
        currency
      );

    const refundMessage =
      refundRequired
        ? refundStatus === "processed"
          ? `A full refund${
              formattedAmount
                ? ` of ${formattedAmount}`
                : ""
            } has been processed to the original payment method.`
          : refundStatus === "failed"
            ? "We could not complete the refund automatically. Our team will review it."
            : `A full refund${
                formattedAmount
                  ? ` of ${formattedAmount}`
                  : ""
              } has been initiated and is being processed.`
        : "No payment refund is required for this application.";

    await transporter.sendMail({
      from: emailUser,
      to,
      subject:
        "Registration Review Update",
      html: `
        <h2>Hello ${name}</h2>
        <p>Your registration was not approved.</p>
        <p><strong>Reason:</strong> ${reason}</p>
        <p>${refundMessage}</p>
        <p>If you need clarification, please contact support.</p>
      `,
    });
  };
