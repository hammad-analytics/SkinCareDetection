import { Router } from "express";
import { login, logout, register, listUsers, forgotPasswordVerify, forgotPasswordReset } from "../controllers/auth.controller.js";

const router = Router();
router.post("/register", register);
router.post("/login", login);
router.post("/logout", logout);
router.get("/users", listUsers);
router.post("/forgot-password/verify", forgotPasswordVerify);
router.post("/forgot-password/reset", forgotPasswordReset);
export default router;

