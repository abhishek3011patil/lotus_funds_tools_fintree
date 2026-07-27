import "../config/env";
import { transporter } from "../config/mailer";

const recipient =
  process.argv[2]?.trim() ||
  process.env.EMAIL_TEST_RECIPIENT?.trim() ||
  "";
const emailUser =
  process.env.EMAIL_USER?.trim() || "";
const rawEmailPass =
  process.env.EMAIL_PASS || "";
const normalizedEmailPass =
  rawEmailPass.replace(/\s/g, "");

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

const run = async (): Promise<void> => {
  console.info("EMAIL TEST CONFIGURATION:", {
    emailUserLoaded: Boolean(emailUser),
    emailPassExists: Boolean(rawEmailPass),
    emailPassHasWhitespace:
      /\s/.test(rawEmailPass),
    normalizedAppPasswordLength:
      normalizedEmailPass.length,
    recipient,
  });

  if (!emailUser || !rawEmailPass) {
    throw new Error(
      "EMAIL_USER and EMAIL_PASS must be configured."
    );
  }

  if (!recipient) {
    throw new Error(
      "Provide a recipient as the first argument or set EMAIL_TEST_RECIPIENT."
    );
  }

  const verified = await transporter.verify();
  console.info("TRANSPORTER VERIFY RESULT:", {
    verified,
  });

  const info = await transporter.sendMail({
    from: emailUser,
    to: recipient,
    subject:
      "Lotus Funds email configuration test",
    text:
      "This is a test email from the Lotus Funds backend email diagnostics.",
  });

  console.info("TEST EMAIL DELIVERY:", {
    messageId: info.messageId,
    accepted: info.accepted,
    rejected: info.rejected,
    response: info.response,
  });
};

void run()
  .then(() => {
    process.exit(0);
  })
  .catch((error: unknown) => {
    console.error(
      "TEST EMAIL ERROR:",
      getEmailErrorDetails(error)
    );
    process.exit(1);
  });
