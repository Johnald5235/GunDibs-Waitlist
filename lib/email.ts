import nodemailer from "nodemailer";

const smtpHost = process.env.SMTP_HOST;
const smtpPort = Number(process.env.SMTP_PORT || 587);
const smtpUser = process.env.SMTP_USER;
const smtpPass = process.env.SMTP_PASS;
const smtpFrom = process.env.SMTP_FROM;

function assertSmtpConfig() {
  if (!smtpHost || !smtpUser || !smtpPass || !smtpFrom) {
    throw new Error(
      "Missing SMTP environment variables. Required: SMTP_HOST, SMTP_USER, SMTP_PASS, SMTP_FROM."
    );
  }

  if (Number.isNaN(smtpPort)) {
    throw new Error("SMTP_PORT must be a valid number.");
  }
}

assertSmtpConfig();

const transporter = nodemailer.createTransport({
  host: smtpHost,
  port: smtpPort,
  secure: smtpPort === 465,
  auth: {
    user: smtpUser,
    pass: smtpPass,
  },
});

export async function sendWaitlistVerificationEmail(params: {
  to: string;
  verifyUrl: string;
}) {
  const { to, verifyUrl } = params;

  try {
    await transporter.sendMail({
      from: smtpFrom,
      to,
      subject: "Verify your GunDibs waitlist signup",
      text: [
        "Verify your email to confirm your GunDibs waitlist signup.",
        "",
        `Verification link: ${verifyUrl}`,
        "",
        "This link expires in 24 hours.",
      ].join("\n"),
      html: `
        <div style="font-family: Arial, sans-serif; line-height: 1.5; color: #111; max-width: 600px; margin: 0 auto; padding: 24px;">
          <h2 style="margin: 0 0 16px;">Verify your email</h2>
          <p style="margin: 0 0 16px;">
            Click the button below to confirm your GunDibs waitlist signup.
          </p>

          <p style="margin: 24px 0;">
            <a
              href="${verifyUrl}"
              style="background:#b08a52;color:#111;text-decoration:none;padding:12px 18px;border-radius:8px;font-weight:700;display:inline-block;"
            >
              Verify Email
            </a>
          </p>

          <p style="margin: 0 0 8px;">Or paste this link into your browser:</p>
          <p style="margin: 0 0 16px; word-break: break-all;">
            <a href="${verifyUrl}" style="color:#111;">${verifyUrl}</a>
          </p>

          <p style="margin: 0; color:#555;">This link expires in 24 hours.</p>
        </div>
      `,
    });
  } catch (error) {
    console.error("Failed to send waitlist verification email.", {
      message: error instanceof Error ? error.message : "Unknown error",
      smtpHost,
      smtpPort,
      smtpUser,
      smtpFrom,
      to,
    });

    throw error;
  }
}