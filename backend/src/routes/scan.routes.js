import { Router } from "express";
import { analyzeScan, getScan, listScans, uploadScan } from "../controllers/scan.controller.js";
import { requireAuth } from "../middleware/auth.js";
import { uploadImage } from "../middleware/upload.js";

const router = Router();
router.use(requireAuth);
router.post("/upload", uploadImage.single("image"), uploadScan);
router.post("/analyze", analyzeScan);
router.get("/", listScans);
router.get("/:id", getScan);
export default router;
