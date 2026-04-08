import nodemailer from "nodemailer";

export const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

export const sendApprovalMail = async (
  to: string,
  name: string,
  link: string
) => {
  try {
    console.log("Sending approval email to:", to);

    const info = await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to,
      subject: "Account Approved - Set Your Password",
      html: `
        <h2>Hello ${name}</h2>
        <p>Your account has been approved.</p>
        <a href="${link}">Set Password</a>
      `,
    });

    console.log("Approval email sent:", info.response);

  } catch (error) {
    console.error("Approval email error:", error); // 🔥 VERY IMPORTANT
    throw error; // ❗ so API fails if mail fails
  }
};

/* ✅ ADD THIS FUNCTION */
export const sendOtpMail = async (to: string, otp: string) => {
  await transporter.sendMail({
    from: process.env.EMAIL_USER,
    to,
    subject: "Your OTP Code",
    html: `
      <h2>Your OTP is: ${otp}</h2>
      <p>This OTP will expire in 5 minutes.</p>
    `,
  });
};