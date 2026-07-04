import nodemailer from "nodemailer";

export const getMailConfig = () => {
  const host = process.env.EMAIL_HOST || process.env.BREVO_SMTP_HOST || "smtp-relay.brevo.com";
  const port = Number(process.env.EMAIL_PORT || process.env.BREVO_SMTP_PORT || 587);
  const user = process.env.EMAIL_USERNAME || process.env.BREVO_SMTP_USER;
  const pass = process.env.EMAIL_PASSWORD || process.env.BREVO_SMTP_PASS;

  return {
    host,
    port,
    secure: false,
    requireTLS: true,
    auth: user && pass ? { user, pass } : undefined,
  };
};

export const createTransporter = () => {
  const config = getMailConfig();

  if (!config.auth) {
    throw new Error("Email provider credentials are not configured. Set BREVO_SMTP_USER and BREVO_SMTP_PASS (or EMAIL_USERNAME/EMAIL_PASSWORD)." );
  }

  return nodemailer.createTransport(config);
};

export const getMailFrom = () => {
  return process.env.EMAIL_FROM || process.env.MAIL_FROM || process.env.EMAIL_USERNAME || "civieyeworld@gmail.com";
};
