import { Router } from "express";
import { login, logout, register, listUsers, sendResetOTP, verifyResetOTP, forgotPasswordReset } from "../controllers/auth.controller.js";

const router = Router();
router.post("/register", register);
router.post("/login", login);
router.post("/logout", logout);
router.get("/users", listUsers);
router.post("/forgot-password/send-otp", sendResetOTP);
router.post("/forgot-password/verify-otp", verifyResetOTP);
router.post("/forgot-password/reset", forgotPasswordReset);
export default router;


