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
 * Create Gmail SMTP transporter
 */
function createTransporter() {
  const email = process.env.SMTP_EMAIL;
  const password = process.env.SMTP_PASSWORD;

  if (!email || !password || password === "YOUR_GMAIL_APP_PASSWORD_HERE") {
    return null; // Not configured — will use console fallback
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
 * Send OTP to user's email
 * @returns {{ success: boolean, message: string, fallback?: boolean }}
 */
export async function sendOTP(email) {
  const otp = generateOTP();
  const expiresAt = Date.now() + OTP_EXPIRY_MS;

  // Store OTP
  otpStore.set(email.toLowerCase().trim(), { otp, expiresAt, verified: false });

  // Auto-cleanup after expiry
  setTimeout(() => {
    const stored = otpStore.get(email.toLowerCase().trim());
    if (stored && stored.otp === otp) {
      otpStore.delete(email.toLowerCase().trim());
    }
  }, OTP_EXPIRY_MS + 1000);

  const transporter = createTransporter();

  if (!transporter) {
    // Fallback: log to console (for development/demo)
    console.log(`\n╔══════════════════════════════════════════╗`);
    console.log(`║  PASSWORD RESET OTP for ${email}`);
    console.log(`║  OTP: ${otp}`);
    console.log(`║  Expires in 5 minutes`);
    console.log(`╚══════════════════════════════════════════╝\n`);
    return { success: true, message: "OTP sent (check server console — SMTP not configured)", fallback: true };
  }

  try {
    await transporter.sendMail({
      from: `"DermAI Security" <${process.env.SMTP_EMAIL}>`,
      to: email,
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
          <p style="color: #94a3b8; font-size: 11px; text-align: center; margin-top: 20px;">
            If you didn't request this, please ignore this email.<br/>
            DermAI — B.Tech Major Project 2026–2027
          </p>
        </div>
      `,
    });
    return { success: true, message: "OTP sent to your email address." };
  } catch (err) {
    console.error("Email send failed:", err.message);
    // Fallback to console on error
    console.log(`\n╔══════════════════════════════════════════╗`);
    console.log(`║  PASSWORD RESET OTP for ${email}`);
    console.log(`║  OTP: ${otp}`);
    console.log(`║  (Email sending failed — using console)`);
    console.log(`╚══════════════════════════════════════════╝\n`);
    return { success: true, message: "OTP generated (email sending failed — check server console)", fallback: true };
  }
}

/**
 * Verify OTP entered by the user
 * @returns {{ valid: boolean, message: string }}
 */
export function verifyOTP(email, otp) {
  const key = email.toLowerCase().trim();
  const stored = otpStore.get(key);

  if (!stored) {
    return { valid: false, message: "No OTP found. Please request a new one." };
  }

  if (Date.now() > stored.expiresAt) {
    otpStore.delete(key);
    return { valid: false, message: "OTP has expired. Please request a new one." };
  }

  if (stored.otp !== otp.toString().trim()) {
    return { valid: false, message: "Invalid OTP. Please check and try again." };
  }

  // Mark as verified (one-time use)
  stored.verified = true;
  otpStore.set(key, stored);

  return { valid: true, message: "OTP verified successfully." };
}

/**
 * Check if email has a verified OTP (for password reset step)
 */
export function isOTPVerified(email) {
  const stored = otpStore.get(email.toLowerCase().trim());
  return stored?.verified === true && Date.now() <= stored.expiresAt;
}

/**
 * Clear OTP after successful password reset
 */
export function clearOTP(email) {
  otpStore.delete(email.toLowerCase().trim());
}
