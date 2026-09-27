import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { z } from "zod";
import { User } from "../models/User.js";
import { env } from "../config/env.js";
import { HttpError } from "../utils/httpError.js";
import { sendOTP, verifyOTP, isOTPVerified, clearOTP } from "../services/otpService.js";

const registerSchema = z.object({ name: z.string().min(2), email: z.string().email(), password: z.string().min(6) });
const loginSchema = z.object({ email: z.string().email(), password: z.string().min(1) });

function tokenFor(user) {
  return jwt.sign({ sub: String(user._id), email: user.email, role: user.role }, env.jwtSecret, { expiresIn: env.jwtExpiresIn });
}

export async function register(req, res, next) {
  try {
    const input = registerSchema.parse(req.body);
    const cleanEmail = input.email.toLowerCase().trim();
    let user = await User.findOne({ email: cleanEmail });
    if (user) {
      user.name = input.name;
      if (req.body.phone) user.phone = req.body.phone;
      user.passwordHash = await bcrypt.hash(input.password, 12);
      await user.save();
      return res.status(200).json({ token: tokenFor(user), user: { id: user._id, name: user.name, email: user.email, phone: user.phone, role: user.role } });
    }
    user = await User.create({ name: input.name, email: cleanEmail, phone: req.body.phone || "", passwordHash: await bcrypt.hash(input.password, 12) });
    res.status(201).json({ token: tokenFor(user), user: { id: user._id, name: user.name, email: user.email, phone: user.phone, role: user.role } });
  } catch (error) {
    next(error);
  }
}

export async function login(req, res, next) {
  try {
    const input = loginSchema.parse(req.body);
    const user = await User.findOne({ email: input.email });
    if (!user || !(await bcrypt.compare(input.password, user.passwordHash))) throw new HttpError(401, "Invalid email or password.");
    res.json({ token: tokenFor(user), user: { id: user._id, name: user.name, email: user.email, role: user.role } });
  } catch (error) {
    next(error);
  }
}

export function logout(_req, res) {
  res.json({ ok: true });
}

export async function listUsers(_req, res, next) {
  try {
    const users = await User.find({}, "-passwordHash").sort({ createdAt: -1 });
    res.json({ total: users.length, users });
  } catch (error) {
    next(error);
  }
}

// ─── Secure OTP-Based Forgot Password ───

// Step 1: Send OTP to User's Email
export async function sendResetOTP(req, res, next) {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ error: { message: "Email address is required." } });
    }
    const cleanEmail = email.toLowerCase().trim();
    const user = await User.findOne({ email: cleanEmail });
    if (!user) {
      return res.status(404).json({ error: { message: "No registered account found with this email." } });
    }

    const result = await sendOTP(cleanEmail);
    res.json({
      ok: true,
      message: result.fallback ? "Demo Mode: Verification OTP generated." : "OTP sent to your email address.",
      fallback: result.fallback || false,
      demoOtp: result.fallback ? result.otp : undefined
    });
  } catch (error) {
    next(error);
  }
}

// Step 2: Verify OTP
export async function verifyResetOTP(req, res, next) {
  try {
    const { email, otp } = req.body;
    if (!email || !otp) {
      return res.status(400).json({ error: { message: "Email and 6-digit OTP code are required." } });
    }
    const cleanEmail = email.toLowerCase().trim();
    const result = verifyOTP(cleanEmail, otp);
    if (!result.valid) {
      return res.status(400).json({ error: { message: result.message } });
    }
    res.json({ verified: true, message: result.message });
  } catch (error) {
    next(error);
  }
}

// Step 3: Reset Password (requires verified OTP)
export async function forgotPasswordReset(req, res, next) {
  try {
    const { email, newPassword } = req.body;
    if (!email || !newPassword) {
      return res.status(400).json({ error: { message: "Email and new password are required." } });
    }
    if (newPassword.length < 6) {
      return res.status(400).json({ error: { message: "Password must be at least 6 characters." } });
    }

    const cleanEmail = email.toLowerCase().trim();
    if (!isOTPVerified(cleanEmail)) {
      return res.status(403).json({ error: { message: "Security verification required. Please verify the OTP sent to your email first." } });
    }

    const user = await User.findOne({ email: cleanEmail });
    if (!user) {
      return res.status(404).json({ error: { message: "User account not found." } });
    }

    user.passwordHash = await bcrypt.hash(newPassword, 12);
    await user.save();
    clearOTP(cleanEmail);

    res.json({ ok: true, message: "Password has been reset successfully." });
  } catch (error) {
    next(error);
  }
}

