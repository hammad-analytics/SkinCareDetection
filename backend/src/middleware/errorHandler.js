import { HttpError } from "../utils/httpError.js";

export function errorHandler(error, _req, res, _next) {
  console.error("API Error:", error);
  const status = error instanceof HttpError ? error.status : (error.name === "ZodError" ? 400 : 500);
  res.status(status).json({
    error: {
      message: error.message || "An unexpected error occurred.",
      details: error.details || error.issues
    }
  });
}
