import dotenv from "dotenv";

dotenv.config({ path: process.env.ENV_FILE || "../.env" });

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
  geminiModel: process.env.GEMINI_MODEL || "gemini-2.5-flash",
  ragDatabase: process.env.RAG_DATABASE || "./rag/knowledge",
  confidenceThreshold: Number(process.env.CONFIDENCE_THRESHOLD || 0.55)
};
