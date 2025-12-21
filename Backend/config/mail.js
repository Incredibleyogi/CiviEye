import nodemailer from "nodemailer";

export const createTransporter = () => {
  // Using Gmail SMTP (app password recommended)
  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.EMAIL_USERNAME,
      pass: process.env.EMAIL_PASSWORD, // use App Password if using Gmail 2FA
    },
  });

  return transporter;
};
