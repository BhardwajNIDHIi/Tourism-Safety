
const nodemailer = require("nodemailer");
const crypto = require("crypto");

const otpStore = new Map();

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_APP_PASSWORD,
  },
});

async function sendEmailOtp(email) {
  const normalizedEmail = email.trim().toLowerCase();
  const existing = otpStore.get(normalizedEmail);

  // Allow one send per 60 seconds.
  if (existing && Date.now() - existing.sentAt < 60000) {
    const error = new Error("Please wait 60 seconds before requesting another OTP.");
    error.status = 429;
    throw error;
  }

  const otp = crypto.randomInt(100000, 1000000).toString();

  await transporter.sendMail({
    from: `"Safe Tourism" <${process.env.GMAIL_USER}>`,
    to: normalizedEmail,
    subject: "Safe Tourism - Email Verification OTP",
    text: `Your verification code is ${otp}. It expires in 5 minutes. Do not share it.`,
  });

  // Store only a hash of the OTP.
  otpStore.set(normalizedEmail, {
    hash: crypto.createHash("sha256").update(otp).digest("hex"),
    expiresAt: Date.now() + 5 * 60 * 1000,
    sentAt: Date.now(),
    attempts: 0,
    verified: false,
  });

  return true;
}

function verifyEmailOtp(email, submittedOtp) {
  const normalizedEmail = email.trim().toLowerCase();
  const record = otpStore.get(normalizedEmail);

  if (!record) {
    return { success: false, message: "Request an OTP first." };
  }

  if (Date.now() > record.expiresAt) {
    otpStore.delete(normalizedEmail);
    return { success: false, message: "OTP expired. Request a new one." };
  }

  if (record.verified) {
    return { success: true, message: "Email already verified." };
  }

  if (record.attempts >= 5) {
    otpStore.delete(normalizedEmail);
    return { success: false, message: "Too many attempts. Request a new OTP." };
  }

  record.attempts += 1;

  const submittedHash = crypto
    .createHash("sha256")
    .update(String(submittedOtp))
    .digest("hex");

  const valid =
    submittedHash.length === record.hash.length &&
    crypto.timingSafeEqual(
      Buffer.from(submittedHash, "hex"),
      Buffer.from(record.hash, "hex")
    );

  if (!valid) {
    return { success: false, message: "Incorrect OTP." };
  }

  record.verified = true;
  return { success: true, message: "Email verified successfully." };
}

function isEmailVerified(email) {
  const record = otpStore.get(email.trim().toLowerCase());

  if (!record || !record.verified || Date.now() > record.expiresAt) {
    return false;
  }

  otpStore.delete(email.trim().toLowerCase());
  return true;
}

module.exports = {
  sendEmailOtp,
  verifyEmailOtp,
  isEmailVerified,
};
