import { createTransporter, getMailFrom } from "../config/mail.js";

export const sendEmail = async ({ to, subject, text, html }) => {
  try {
    const transporter = createTransporter();

    const mailOptions = {
      from: `"CivicEye" <${getMailFrom()}>`,
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
