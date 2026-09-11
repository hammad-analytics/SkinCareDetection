import { Router } from "express";
import { chat } from "../controllers/chat.controller.js";
import { requireAuth } from "../middleware/auth.js";

const router = Router();
router.use(requireAuth);
router.post("/", chat);
export default router;
