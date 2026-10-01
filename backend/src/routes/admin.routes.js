import { Router } from "express";
import {
  getAdminStats,
  getAdminUsers,
  updateUserRole,
  deleteUser,
  getAdminScans,
  deleteScan,
  getAdminChats
} from "../controllers/admin.controller.js";
import { requireAuth, requireAdmin } from "../middleware/auth.js";

const router = Router();

// Secure all admin routes
router.use(requireAuth, requireAdmin);

router.get("/stats", getAdminStats);
router.get("/users", getAdminUsers);
router.patch("/users/:id/role", updateUserRole);
router.delete("/users/:id", deleteUser);
router.get("/scans", getAdminScans);
router.delete("/scans/:id", deleteScan);
router.get("/chats", getAdminChats);

export default router;
