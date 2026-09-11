import fs from "node:fs";
import path from "node:path";
import multer from "multer";
import { nanoid } from "nanoid";
import { env } from "../config/env.js";
import { HttpError } from "../utils/httpError.js";

fs.mkdirSync(env.uploadDir, { recursive: true });

const allowed = new Set(["image/jpeg", "image/png", "image/webp", "image/heic", "image/heif"]);

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, env.uploadDir),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase().replace(/[^.\w]/g, "") || ".img";
    cb(null, `${Date.now()}-${nanoid(10)}${ext}`);
  }
});

export const uploadImage = multer({
  storage,
  limits: { fileSize: env.maxUploadSize, files: 1 },
  fileFilter: (_req, file, cb) => {
    if (!allowed.has(file.mimetype)) return cb(new HttpError(415, "Unsupported image type. Use JPEG, PNG, WebP, HEIC, or HEIF."));
    cb(null, true);
  }
});
