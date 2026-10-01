import { HttpError } from "../utils/httpError.js";

export function errorHandler(error, _req, res, _next) {
  console.error("API Error:", error);
  const isZod = error.name === "ZodError";
  const status = error instanceof HttpError ? error.status : (isZod ? 400 : 500);
  let message = error.message || "An unexpected error occurred.";
  if (isZod && Array.isArray(error.issues) && error.issues.length > 0) {
    message = error.issues.map((i) => i.message).join(". ");
  }
  res.status(status).json({
    error: {
      message,
      details: error.details || error.issues
    }
  });
}
