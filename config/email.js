import nodemailer from "nodemailer";


export const getTransporter = async () => {
  const host = process.env.SMTP_HOST || "sandbox.smtp.mailtrap.io";
  const port = Number(process.env.SMTP_PORT) || 2525;
  const user = process.env.SMTP_EMAIL || process.env.SMTP_USER;
  const pass = process.env.SMTP_PASSWORD || process.env.SMTP_PASS;

  if (user && pass) {
    return nodemailer.createTransport({
      host,
      port,
      auth: { user, pass },
    });
  }

  try {
    const testAccount = await nodemailer.createTestAccount();
    console.log("[EmailConfig] Using temporary Ethereal SMTP test account:", testAccount.user);
    return nodemailer.createTransport({
      host: "smtp.ethereal.email",
      port: 587,
      secure: false,
      auth: {
        user: testAccount.user,
        pass: testAccount.pass,
      },
    });
  } catch (error) {
    console.warn(
      "[EmailConfig] Ethereal fallback failed, email will be logged to console:",
      error.message,
    );
    return null;
  }
};

export const getPreviewUrl = (info) => nodemailer.getTestMessageUrl(info);
