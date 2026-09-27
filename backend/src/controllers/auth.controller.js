import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { z } from "zod";
import { User } from "../models/User.js";
import { env } from "../config/env.js";
import { HttpError } from "../utils/httpError.js";

const registerSchema = z.object({ name: z.string().min(2), email: z.string().email(), password: z.string().min(8) });
const loginSchema = z.object({ email: z.string().email(), password: z.string().min(1) });

function tokenFor(user) {
  return jwt.sign({ sub: String(user._id), email: user.email, role: user.role }, env.jwtSecret, { expiresIn: env.jwtExpiresIn });
}

export async function register(req, res, next) {
  try {
    const input = registerSchema.parse(req.body);
    const existing = await User.findOne({ email: input.email });
    if (existing) throw new HttpError(409, "An account already exists for this email.");
    const user = await User.create({ name: input.name, email: input.email, phone: req.body.phone || "", passwordHash: await bcrypt.hash(input.password, 12) });
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

// Forgot Password - Step 1: Verify email + name match
export async function forgotPasswordVerify(req, res, next) {
  try {
    const { email, name } = req.body;
    if (!email || !name) {
      return res.status(400).json({ error: { message: "Email and name are required." } });
    }
    const user = await User.findOne({ email: email.toLowerCase().trim() });
    if (!user) {
      return res.status(404).json({ error: { message: "No account found with this email address." } });
    }
    // Case-insensitive name comparison
    if (user.name.toLowerCase().trim() !== name.toLowerCase().trim()) {
      return res.status(403).json({ error: { message: "The name does not match our records for this email." } });
    }
    res.json({ verified: true, message: "Identity verified successfully." });
  } catch (error) {
    next(error);
  }
}

// Forgot Password - Step 2: Reset password
export async function forgotPasswordReset(req, res, next) {
  try {
    const { email, name, newPassword } = req.body;
    if (!email || !name || !newPassword) {
      return res.status(400).json({ error: { message: "Email, name, and new password are required." } });
    }
    if (newPassword.length < 6) {
      return res.status(400).json({ error: { message: "Password must be at least 6 characters." } });
    }
    const user = await User.findOne({ email: email.toLowerCase().trim() });
    if (!user || user.name.toLowerCase().trim() !== name.toLowerCase().trim()) {
      return res.status(403).json({ error: { message: "Verification failed. Please try again." } });
    }
    user.passwordHash = await bcrypt.hash(newPassword, 12);
    await user.save();
    res.json({ ok: true, message: "Password has been reset successfully." });
  } catch (error) {
    next(error);
  }
}

