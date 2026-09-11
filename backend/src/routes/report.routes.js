import { Router } from "express";
import { getReport } from "../controllers/report.controller.js";
import { requireAuth } from "../middleware/auth.js";

const router = Router();
router.use(requireAuth);
router.get("/:id", getReport);
export default router;
