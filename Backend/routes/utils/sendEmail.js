import nodemailer from "nodemailer";

export const sendEmail = async ({ to, subject, text, html }) => {
  try {
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USERNAME,
        pass: process.env.EMAIL_PASSWORD,
      },
    });

    const mailOptions = {
      from: `"CivicEye" <${process.env.EMAIL_USERNAME}>`,
      to,
      subject,
      text,
      html,
    };

    await transporter.sendMail(mailOptions);

    console.log(`📧 Email sent to ${to}`);
    return true;

  } catch (err) {
    console.error("❌ Email sending failed:", err.message);
    return false;
  }
};
