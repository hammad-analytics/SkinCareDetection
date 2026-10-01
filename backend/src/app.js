import express from "express";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import { env } from "./config/env.js";
import authRoutes from "./routes/auth.routes.js";
import scanRoutes from "./routes/scan.routes.js";
import reportRoutes from "./routes/report.routes.js";
import chatRoutes from "./routes/chat.routes.js";
import knowledgeRoutes from "./routes/knowledge.routes.js";
import path from "path";
import adminRoutes from "./routes/admin.routes.js";
import { errorHandler } from "./middleware/errorHandler.js";

const app = express();
app.use(helmet({
  crossOriginResourcePolicy: false
}));
app.use(cors({
  origin: (origin, callback) => callback(null, true),
  credentials: true
}));
app.use(express.json({ limit: "1mb" }));
app.use(rateLimit({ windowMs: 15 * 60 * 1000, limit: 250 }));

app.use("/uploads", express.static(path.resolve(process.cwd(), env.uploadDir)));
app.get("/health", (_req, res) => res.json({ ok: true, service: "backend" }));
app.get("/api/health", (_req, res) => res.json({ ok: true, service: "backend" }));
app.use("/api/auth", authRoutes);
app.use("/api/scans", scanRoutes);
app.use("/api/reports", reportRoutes);
app.use("/api/chat", chatRoutes);
app.use("/api/knowledge", knowledgeRoutes);
app.use("/api/admin", adminRoutes);
app.use(errorHandler);

export default app;
