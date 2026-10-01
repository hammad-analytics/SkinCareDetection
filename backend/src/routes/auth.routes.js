import { Router } from "express";
import {
  login,
  logout,
  register,
  listUsers,
  sendResetOTP,
  verifyResetOTP,
  forgotPasswordReset,
  getProfile,
  updateProfile
} from "../controllers/auth.controller.js";
import { requireAuth } from "../middleware/auth.js";

const router = Router();
router.post("/register", register);
router.post("/login", login);
router.post("/logout", logout);
router.get("/users", listUsers);
router.post("/forgot-password/send-otp", sendResetOTP);
router.post("/forgot-password/verify-otp", verifyResetOTP);
router.post("/forgot-password/reset", forgotPasswordReset);

// Profile management
router.get("/profile", requireAuth, getProfile);
router.put("/profile", requireAuth, updateProfile);

export default router;
