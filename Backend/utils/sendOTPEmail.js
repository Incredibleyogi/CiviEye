// utils/sendOTPEmail.js
import { sendEmail } from "./sendEmail.js";

const sendOTPEmail = async (email, otp) => {
  const subject = "Your OTP Verification Code";
  const html = `
    <div style="font-family:Arial; padding:20px;">
      <h2>Your CivicEye OTP</h2>
      <p>Your verification code is:</p>
      <h1 style="letter-spacing:4px;">${otp}</h1>
      <p>This OTP is valid for 10 minutes.</p>
    </div>
  `;

  return await sendEmail({
    to: email,
    subject,
    html,
  });
};

export default sendOTPEmail;
