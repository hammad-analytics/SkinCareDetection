import { Router } from "express";
import { ingestKnowledge } from "../controllers/knowledge.controller.js";
import { requireAdmin, requireAuth } from "../middleware/auth.js";

const router = Router();
router.post("/ingest", requireAuth, requireAdmin, ingestKnowledge);
export default router;
