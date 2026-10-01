import fs from "fs";
import path from "path";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { z } from "zod";
import { User } from "../models/User.js";
import { SkinScan } from "../models/SkinScan.js";
import { env } from "../config/env.js";
import { HttpError } from "../utils/httpError.js";
import { sendOTP, verifyOTP, isOTPVerified, clearOTP } from "../services/otpService.js";

const registerSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters."),
  email: z.string().email("Please enter a valid email address."),
  password: z.string().min(6, "Password must be at least 6 characters."),
  phone: z.string().optional()
});
const loginSchema = z.object({
  email: z.string().min(1, "Please enter your email or phone number."),
  password: z.string().min(1, "Password is required.")
});

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
    const rawIdentifier = (input.email || "").trim();
    const cleanEmail = rawIdentifier.toLowerCase();
    const cleanPhone = rawIdentifier.replace(/\D/g, "");

    const searchConditions = [{ email: cleanEmail }];
    if (cleanPhone.length >= 7) {
      searchConditions.push({ phone: cleanPhone });
      searchConditions.push({ phone: rawIdentifier });
    }

    let user = await User.findOne({ $or: searchConditions });

    if (!user) {
      try {
        const usersFile = path.resolve(process.cwd(), "../data/users.json");
        const altFile = path.resolve(process.cwd(), "data/users.json");
        const targetPath = fs.existsSync(usersFile) ? usersFile : (fs.existsSync(altFile) ? altFile : null);
        if (targetPath) {
          const diskUsers = JSON.parse(fs.readFileSync(targetPath, "utf8"));
          const matched = diskUsers.find(
            (u) =>
              (u.email && u.email.toLowerCase() === cleanEmail) ||
              (cleanPhone.length >= 7 && u.phone && u.phone.replace(/\D/g, "") === cleanPhone)
          );
          if (matched) {
            user = await User.create({
              name: matched.name,
              email: matched.email.toLowerCase(),
              phone: matched.phone || "",
              passwordHash: matched.passwordHash,
              role: matched.role || "user"
            });
          }
        }
      } catch (migrateErr) {
        console.warn("Auto-migration fallback check failed:", migrateErr.message);
      }
    }

    if (!user || !(await bcrypt.compare(input.password, user.passwordHash))) {
      throw new HttpError(401, "Invalid email/phone or password. Please try again.");
    }

    res.json({ token: tokenFor(user), user: { id: user._id, name: user.name, email: user.email, phone: user.phone || "", role: user.role } });
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
      return res.status(400).json({ error: { message: "Email or phone number is required." } });
    }
    const raw = (email || "").trim();
    const cleanEmail = raw.toLowerCase();
    const cleanPhone = raw.replace(/\D/g, "");

    const searchConditions = [{ email: cleanEmail }];
    if (cleanPhone.length >= 7) {
      searchConditions.push({ phone: cleanPhone });
      searchConditions.push({ phone: raw });
    }

    const user = await User.findOne({ $or: searchConditions });
    if (!user) {
      return res.status(404).json({ error: { message: "No registered account found with this email or phone number." } });
    }

    const result = await sendOTP(user.email, user.phone || cleanPhone);
    res.json({
      ok: true,
      message: result.message,
      targetEmail: user.email
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

// ─── Profile Management ───

export async function getProfile(req, res, next) {
  try {
    const user = await User.findById(req.user.sub, "-passwordHash").lean();
    if (!user) throw new HttpError(404, "User not found.");
    const [totalScans, completedScans, highRiskCount] = await Promise.all([
      SkinScan.countDocuments({ user: user._id }),
      SkinScan.countDocuments({ user: user._id, status: "completed" }),
      SkinScan.countDocuments({ user: user._id, "risk.level": "high" })
    ]);
    res.json({
      user,
      stats: {
        totalScans,
        completedScans,
        highRiskCount
      },
      createdAt: user.createdAt
    });
  } catch (error) {
    next(error);
  }
}

export async function updateProfile(req, res, next) {
  try {
    const { name, phone } = req.body;
    if (!name || name.trim().length < 2) {
      throw new HttpError(400, "Name must be at least 2 characters long.");
    }
    const user = await User.findById(req.user.sub);
    if (!user) throw new HttpError(404, "User not found.");

    user.name = name.trim();
    if (phone !== undefined) {
      user.phone = phone.trim();
    }
    await user.save();

    res.json({
      ok: true,
      message: "Profile updated successfully.",
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone || "",
        role: user.role
      }
    });
  } catch (error) {
    next(error);
  }
}

