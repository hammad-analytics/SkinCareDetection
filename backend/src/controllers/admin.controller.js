import axios from "axios";
import { User } from "../models/User.js";
import { SkinScan } from "../models/SkinScan.js";
import { ChatSession } from "../models/ChatSession.js";
import { CareReport } from "../models/CareReport.js";
import { env } from "../config/env.js";
import { HttpError } from "../utils/httpError.js";

export async function getAdminStats(_req, res, next) {
  try {
    const [totalUsers, totalScans, totalChats, totalReports] = await Promise.all([
      User.countDocuments(),
      SkinScan.countDocuments(),
      ChatSession.countDocuments(),
      CareReport.countDocuments()
    ]);

    // Aggregate condition breakdown from skinscans
    const scans = await SkinScan.find({}, "modelResult risk createdAt").lean();
    const diseaseBreakdown = {};
    const riskBreakdown = { low: 0, medium: 0, high: 0, undetermined: 0 };

    for (const scan of scans) {
      const condition = scan.modelResult?.condition || scan.modelResult?.predictedClass || "unknown";
      diseaseBreakdown[condition] = (diseaseBreakdown[condition] || 0) + 1;

      const riskLevel = scan.risk?.level?.toLowerCase() || "undetermined";
      if (riskBreakdown[riskLevel] !== undefined) {
        riskBreakdown[riskLevel]++;
      } else {
        riskBreakdown.undetermined++;
      }
    }

    // Check ML service health
    let mlServiceStatus = "offline";
    try {
      const mlRes = await axios.get(`${env.mlServiceUrl}/health`, { timeout: 2000 });
      if (mlRes.data?.ok) mlServiceStatus = "online";
    } catch {
      mlServiceStatus = "offline";
    }

    // Recent 6 scans with user info
    const recentScans = await SkinScan.find({})
      .sort({ createdAt: -1 })
      .limit(6)
      .populate("user", "name email phone")
      .lean();

    // Recent 5 users
    const recentUsers = await User.find({}, "-passwordHash")
      .sort({ createdAt: -1 })
      .limit(5)
      .lean();

    res.json({
      metrics: {
        totalUsers,
        totalScans,
        totalChats,
        totalReports
      },
      diseaseBreakdown,
      riskBreakdown,
      systemHealth: {
        database: "MongoDB (Local 27017) - Connected",
        mlService: mlServiceStatus,
        llmProvider: `${env.llmProvider.toUpperCase()} (${env.groqModel || "qwen/qwen3.8-27b"})`,
        storage: "Local Disks / GridFS"
      },
      recentScans,
      recentUsers
    });
  } catch (error) {
    next(error);
  }
}

export async function getAdminUsers(_req, res, next) {
  try {
    const users = await User.find({}, "-passwordHash").sort({ createdAt: -1 }).lean();
    
    // Count scans per user
    const usersWithStats = await Promise.all(
      users.map(async (u) => {
        const [scanCount, chatCount] = await Promise.all([
          SkinScan.countDocuments({ user: u._id }),
          ChatSession.countDocuments({ user: u._id })
        ]);
        return {
          ...u,
          scanCount,
          chatCount
        };
      })
    );

    res.json({ total: usersWithStats.length, users: usersWithStats });
  } catch (error) {
    next(error);
  }
}

export async function updateUserRole(req, res, next) {
  try {
    const { id } = req.params;
    const { role } = req.body;

    if (!["user", "admin"].includes(role)) {
      throw new HttpError(400, "Role must be 'user' or 'admin'.");
    }

    const user = await User.findById(id);
    if (!user) throw new HttpError(404, "User not found.");

    user.role = role;
    await user.save();

    res.json({ ok: true, message: `Role updated to ${role} for ${user.email}`, user: { id: user._id, name: user.name, email: user.email, role: user.role } });
  } catch (error) {
    next(error);
  }
}

export async function deleteUser(req, res, next) {
  try {
    const { id } = req.params;

    if (String(req.user?.sub) === String(id)) {
      throw new HttpError(400, "You cannot delete your own admin account.");
    }

    const user = await User.findByIdAndDelete(id);
    if (!user) throw new HttpError(404, "User not found.");

    // Clean up user's data
    await Promise.all([
      SkinScan.deleteMany({ user: id }),
      ChatSession.deleteMany({ user: id }),
      CareReport.deleteMany({ user: id })
    ]);

    res.json({ ok: true, message: `User ${user.email} and associated clinical data deleted.` });
  } catch (error) {
    next(error);
  }
}

export async function getAdminScans(req, res, next) {
  try {
    const { condition, risk } = req.query;
    const filter = {};

    if (condition) {
      filter["modelResult.condition"] = condition;
    }
    if (risk) {
      filter["risk.level"] = risk;
    }

    const scans = await SkinScan.find(filter)
      .sort({ createdAt: -1 })
      .populate("user", "name email phone")
      .limit(100)
      .lean();

    res.json({ total: scans.length, scans });
  } catch (error) {
    next(error);
  }
}

export async function deleteScan(req, res, next) {
  try {
    const { id } = req.params;
    const scan = await SkinScan.findByIdAndDelete(id);
    if (!scan) throw new HttpError(404, "Scan not found.");

    res.json({ ok: true, message: "Scan deleted successfully." });
  } catch (error) {
    next(error);
  }
}

export async function getAdminChats(_req, res, next) {
  try {
    const chats = await ChatSession.find({})
      .sort({ updatedAt: -1 })
      .limit(50)
      .populate("user", "name email")
      .lean();

    res.json({ total: chats.length, chats });
  } catch (error) {
    next(error);
  }
}
