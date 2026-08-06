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
      from: `"Tarkashh" <${emailUser}>`,
      to,
      subject: "Welcome to Tarkashh | Account Approved",
      html: `
<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
</head>

<body style="margin:0;padding:0;background:#f4f6f9;font-family:Arial,Helvetica,sans-serif;">

<table width="100%" cellpadding="0" cellspacing="0" style="padding:40px 0;background:#f4f6f9;">
<tr>
<td align="center">

<table width="600" cellpadding="0" cellspacing="0"
style="background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 6px 20px rgba(0,0,0,0.08);">

<!-- Header -->
<tr>
<td style="background:#2F5BEA;padding:28px;text-align:center;">
<h1 style="margin:0;color:#ffffff;font-size:30px;">
Tarkashh
</h1>
<p style="margin:8px 0 0;color:#EAF0FF;font-size:15px;">
Empowering Smarter Investment Research
</p>
</td>
</tr>

<!-- Body -->
<tr>
<td style="padding:40px;">

<h2 style="margin-top:0;color:#222;">
🎉 Congratulations, ${name}!
</h2>

<p style="font-size:16px;color:#555;line-height:1.8;">
We're delighted to inform you that your registration has been
<strong>successfully reviewed and approved.</strong>
</p>

<p style="font-size:16px;color:#555;line-height:1.8;">
Your Tarkashh account is almost ready.
For security reasons, you'll need to create your password before signing in.
</p>

<!-- Button -->
<table width="100%" cellspacing="0" cellpadding="0" style="margin:35px 0;">
<tr>
<td align="center">

<a href="${link}"
style="
background:#2F5BEA;
color:#ffffff;
padding:16px 34px;
text-decoration:none;
font-size:17px;
font-weight:bold;
border-radius:8px;
display:inline-block;
">
Create Your Password
</a>

</td>
</tr>
</table>

<p style="font-size:15px;color:#666;line-height:1.8;">
If the button above doesn't work, copy and paste the following link into your browser:
</p>

<p style="word-break:break-all;font-size:14px;color:#2F5BEA;">
${link}
</p>

<div style="
margin:35px 0;
padding:20px;
background:#EEF4FF;
border-left:5px solid #2F5BEA;
border-radius:8px;
">

<h3 style="margin-top:0;color:#2F5BEA;">
Important Information
</h3>

<ul style="padding-left:18px;color:#555;line-height:1.9;font-size:15px;">
<li>This password setup link is valid for <strong>1 hour</strong>.</li>
<li>Create a strong password that is unique to your account.</li>
<li>Never share your password or OTP with anyone.</li>
<li>After setting your password, you can log in immediately.</li>
</ul>

</div>

<p style="font-size:15px;color:#555;line-height:1.8;">
If you did not register for a Tarkashh account, you can safely ignore this email.
No further action is required.
</p>

<p style="margin-top:35px;font-size:16px;color:#555;">
We look forward to having you onboard.
</p>

<p style="font-size:16px;color:#555;">
Warm Regards,<br>
<strong>Tarkashh Team</strong>
</p>

</td>
</tr>

<!-- Footer -->
<tr>
<td style="background:#F7F8FA;padding:25px;text-align:center;">

<p style="margin:0;color:#666;font-size:14px;">
This is an automated email from <strong>Tarkashh</strong>.
Please do not reply to this message.
</p>

<p style="margin-top:10px;color:#999;font-size:13px;">
© 2026 Tarkashh. All Rights Reserved.
</p>

</td>
</tr>

</table>

</td>
</tr>
</table>

</body>
</html>
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
export const sendOtpMail = async (
  to: string,
  otp: string
) => {
  await transporter.sendMail({
    from: `"Tarkashh" <${emailUser}>`,
    to,
    subject: "Tarkashh | Login Verification OTP",
    html: `
<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
</head>

<body style="margin:0;padding:0;background:#f4f6f9;font-family:Arial,Helvetica,sans-serif;">

<table width="100%" cellpadding="0" cellspacing="0" style="padding:40px 0;background:#f4f6f9;">
<tr>
<td align="center">

<table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 6px 20px rgba(0,0,0,0.08);">

<tr>
<td style="background:#2F5BEA;padding:25px;text-align:center;">
<h1 style="margin:0;color:#ffffff;font-size:30px;">
Tarkashh
</h1>
</td>
</tr>

<tr>
<td style="padding:35px;">

<h2 style="margin-top:0;color:#222;">
Login Verification
</h2>

<p style="font-size:16px;color:#555;line-height:1.8;">
Hello,
</p>

<p style="font-size:16px;color:#555;line-height:1.8;">
We received a request to sign in to your
<strong>Tarkashh</strong> account.
To complete your login, please use the One-Time Password (OTP) below.
</p>

<div style="
background:#EEF4FF;
border:2px dashed #2F5BEA;
padding:25px;
border-radius:10px;
text-align:center;
margin:30px 0;
">

<p style="margin:0;font-size:15px;color:#666;">
Your Verification Code
</p>

<h1 style="
margin:15px 0;
font-size:40px;
letter-spacing:8px;
color:#2F5BEA;
">
${otp}
</h1>

<p style="margin:0;font-size:14px;color:#777;">
This OTP is valid for <strong>5 minutes</strong>.
</p>

</div>

<p style="font-size:15px;color:#555;line-height:1.8;">
For your security:
</p>

<ul style="color:#555;font-size:15px;line-height:1.8;padding-left:20px;">
<li>Never share this OTP with anyone.</li>
<li>Tarkashh will never ask for your OTP via phone, email, or message.</li>
<li>If you did not request this login, please ignore this email. Your account will remain secure.</li>
</ul>

<p style="font-size:15px;color:#555;line-height:1.8;margin-top:30px;">
Thank you,<br>
<strong>Tarkashh Team</strong>
</p>

</td>
</tr>

<tr>
<td style="background:#F7F8FA;padding:18px;text-align:center;color:#888;font-size:13px;">
This is an automated email sent by <strong>Tarkashh</strong>. Please do not reply to this email.
</td>
</tr>

</table>

</td>
</tr>
</table>

</body>
</html>
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
