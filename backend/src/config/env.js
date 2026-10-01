import dotenv from "dotenv";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const envPaths = [
  process.env.ENV_FILE,
  path.resolve(process.cwd(), ".env"),
  path.resolve(process.cwd(), "../.env"),
  path.resolve(__dirname, "../../.env"),
  path.resolve(__dirname, "../../../.env")
];

for (const p of envPaths) {
  if (p && fs.existsSync(p)) {
    dotenv.config({ path: p });
    break;
  }
}


export const env = {
  appEnv: process.env.APP_ENV || "development",
  port: Number(process.env.BACKEND_PORT || 5000),
  frontendOrigin: process.env.FRONTEND_ORIGIN || "http://localhost:5173",
  mongodbUri: process.env.MONGODB_URI || "mongodb://localhost:27017/skincare_detection",
  jwtSecret: process.env.JWT_SECRET || "dev-only-change-me",
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || "7d",
  mlServiceUrl: process.env.ML_SERVICE_URL || "http://localhost:8000",
  uploadDir: process.env.UPLOAD_DIR || "uploads",
  maxUploadSize: Number(process.env.MAX_UPLOAD_SIZE || 10 * 1024 * 1024),
  ollamaBaseUrl: process.env.OLLAMA_BASE_URL || "http://localhost:11434",
  ollamaModel: process.env.OLLAMA_MODEL || "qwen3:8b",
  llmProvider: process.env.LLM_PROVIDER || "gemini",
  geminiApiKey: process.env.GEMINI_API_KEY || "",
  geminiModel: process.env.GEMINI_MODEL || "gemini-3.6-flash",
  groqApiKey: process.env.GROQ_API_KEY || "",
  groqModel: process.env.GROQ_MODEL || "openai/gpt-oss-120b",
  ragDatabase: process.env.RAG_DATABASE || "./rag/knowledge",
  confidenceThreshold: Number(process.env.CONFIDENCE_THRESHOLD || 0.55)
};
