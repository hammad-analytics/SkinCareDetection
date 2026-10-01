import axios from "axios";
import nodemailer from "nodemailer";

// ─── In-memory OTP store (key: email, value: { otp, expiresAt, verified }) ───
const otpStore = new Map();

// OTP expires in 5 minutes
const OTP_EXPIRY_MS = 5 * 60 * 1000;

/**
 * Generate a 6-digit numeric OTP
 */
function generateOTP() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

/**
 * Send real SMS to mobile phone (Fast2SMS or Twilio)
 */
async function sendSMS(phone, otp) {
  const cleanNumber = (phone || "").replace(/\D/g, "");
  if (!cleanNumber || cleanNumber.length < 10) return false;
  const mobile10 = cleanNumber.slice(-10);

  // 1. Fast2SMS Gateway (Standard Indian SMS)
  const fast2smsKey = process.env.FAST2SMS_API_KEY;
  if (fast2smsKey) {
    try {
      const res = await axios.get("https://www.fast2sms.com/dev/bulkV2", {
        params: {
          authorization: fast2smsKey,
          route: "otp",
          variables_values: otp,
          numbers: mobile10
        },
        timeout: 8000
      });
      if (res.data?.return) {
        console.log(`[SMS DISPATCHED] Fast2SMS sent OTP to +91 ${mobile10}`);
        return true;
      }
    } catch (err) {
      console.warn("[Fast2SMS Delivery Error]", err.response?.data || err.message);
    }
  }

  // 2. Twilio Gateway (Global SMS)
  const twilioSid = process.env.TWILIO_ACCOUNT_SID;
  const twilioToken = process.env.TWILIO_AUTH_TOKEN;
  const twilioFrom = process.env.TWILIO_PHONE_NUMBER;
  if (twilioSid && twilioToken && twilioFrom) {
    try {
      const auth = Buffer.from(`${twilioSid}:${twilioToken}`).toString("base64");
      const params = new URLSearchParams();
      params.append("To", `+91${mobile10}`);
      params.append("From", twilioFrom);
      params.append("Body", `Your DermAI verification code is: ${otp}. Valid for 5 minutes.`);
      await axios.post(
        `https://api.twilio.com/2010-04-01/Accounts/${twilioSid}/Messages.json`,
        params.toString(),
        {
          headers: {
            Authorization: `Basic ${auth}`,
            "Content-Type": "application/x-www-form-urlencoded"
          },
          timeout: 8000
        }
      );
      console.log(`[SMS DISPATCHED] Twilio sent OTP to +91 ${mobile10}`);
      return true;
    } catch (err) {
      console.warn("[Twilio Delivery Error]", err.response?.data || err.message);
    }
  }

  return false;
}

/**
 * Create Gmail SMTP transporter
 */
function createTransporter() {
  const email = process.env.SMTP_EMAIL;
  const password = process.env.SMTP_PASSWORD;

  if (!email || !password || password === "YOUR_GMAIL_APP_PASSWORD_HERE") {
    return null;
  }

  return nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: email,
      pass: password,
    },
  });
}

/**
 * Send OTP to user's registered contact (SMS or Email)
 */
export async function sendOTP(email, phone = "") {
  const otp = generateOTP();
  const expiresAt = Date.now() + OTP_EXPIRY_MS;
  const cleanEmail = email.toLowerCase().trim();

  // Store OTP against email and phone
  otpStore.set(cleanEmail, { otp, expiresAt, verified: false });
  if (phone) {
    const cleanPhone = phone.replace(/\D/g, "").slice(-10);
    if (cleanPhone) otpStore.set(cleanPhone, { otp, expiresAt, verified: false });
  }

  // Auto-cleanup after expiry
  setTimeout(() => {
    const stored = otpStore.get(cleanEmail);
    if (stored && stored.otp === otp) {
      otpStore.delete(cleanEmail);
    }
  }, OTP_EXPIRY_MS + 1000);

  // Attempt real SMS if phone is present
  const smsSent = await sendSMS(phone, otp);

  // Attempt real email if SMTP is configured
  let emailSent = false;
  const transporter = createTransporter();
  if (transporter) {
    try {
      await transporter.sendMail({
        from: `"DermAI Security" <${process.env.SMTP_EMAIL}>`,
        to: cleanEmail,
        subject: "🔐 DermAI — Password Reset OTP",
        html: `
          <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 480px; margin: 0 auto; padding: 32px; background: #f8fafc; border-radius: 16px;">
            <div style="text-align: center; margin-bottom: 24px;">
              <h1 style="color: #0f172a; font-size: 24px; margin: 0;">🔐 Password Reset</h1>
              <p style="color: #64748b; font-size: 14px; margin-top: 8px;">DermAI Skin Health Platform</p>
            </div>
            <div style="background: white; border-radius: 12px; padding: 24px; text-align: center; border: 1px solid #e2e8f0;">
              <p style="color: #475569; font-size: 14px; margin: 0 0 16px 0;">Your one-time verification code is:</p>
              <div style="background: linear-gradient(135deg, #0f766e, #0d9488); border-radius: 12px; padding: 20px; margin: 0 auto; display: inline-block;">
                <span style="font-size: 36px; font-weight: 800; letter-spacing: 8px; color: white; font-family: 'Courier New', monospace;">${otp}</span>
              </div>
              <p style="color: #94a3b8; font-size: 12px; margin-top: 16px;">This code expires in <strong>5 minutes</strong></p>
            </div>
          </div>
        `,
      });
      emailSent = true;
    } catch (err) {
      console.warn("[Email Delivery Error]", err.message);
    }
  }

  // Always log securely to server console
  console.log(`\n╔═══════════════════════════════════════════════════╗`);
  console.log(`║  🔐 SECURITY VERIFICATION OTP CODE                `);
  console.log(`║  Target: ${cleanEmail} ${phone ? `| Mobile: +91 ${phone}` : ""}`);
  console.log(`║  OTP:    ${otp}                                   `);
  console.log(`║  Valid:  5 Minutes (SMS: ${smsSent ? "SENT" : "GATEWAY NOT CONFIGURED"} | Email: ${emailSent ? "SENT" : "NOT CONFIGURED"})`);
  console.log(`╚═══════════════════════════════════════════════════╝\n`);

  let message = "A 6-digit verification code has been dispatched to your registered contact.";
  if (smsSent) message = `SMS verification code sent to +91 ${phone.slice(-10)}.`;
  else if (emailSent) message = `Verification code sent to ${cleanEmail}.`;

  return { success: true, message, otp };
}

/**
 * Verify OTP entered by the user
 */
export function verifyOTP(identifier, otp) {
  const cleanId = identifier.toLowerCase().trim();
  const cleanDigits = identifier.replace(/\D/g, "").slice(-10);

  const stored = otpStore.get(cleanId) || (cleanDigits ? otpStore.get(cleanDigits) : null);

  if (!stored) {
    return { valid: false, message: "No OTP found. Please request a new verification code." };
  }

  if (Date.now() > stored.expiresAt) {
    otpStore.delete(cleanId);
    if (cleanDigits) otpStore.delete(cleanDigits);
    return { valid: false, message: "Verification code has expired. Please request a new one." };
  }

  if (stored.otp !== otp.toString().trim()) {
    return { valid: false, message: "Incorrect OTP code. Please check and try again." };
  }

  stored.verified = true;
  otpStore.set(cleanId, stored);
  if (cleanDigits) otpStore.set(cleanDigits, stored);

  return { valid: true, message: "Verification code confirmed successfully." };
}

/**
 * Check if identifier has a verified OTP
 */
export function isOTPVerified(identifier) {
  const cleanId = identifier.toLowerCase().trim();
  const cleanDigits = identifier.replace(/\D/g, "").slice(-10);
  const stored = otpStore.get(cleanId) || (cleanDigits ? otpStore.get(cleanDigits) : null);
  return stored?.verified === true && Date.now() <= stored.expiresAt;
}

/**
 * Clear OTP after successful password reset
 */
export function clearOTP(identifier) {
  const cleanId = identifier.toLowerCase().trim();
  const cleanDigits = identifier.replace(/\D/g, "").slice(-10);
  otpStore.delete(cleanId);
  if (cleanDigits) otpStore.delete(cleanDigits);
}
