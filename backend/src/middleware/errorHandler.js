import { HttpError } from "../utils/httpError.js";

export function errorHandler(error, _req, res, _next) {
  const status = error instanceof HttpError ? error.status : 500;
  res.status(status).json({
    error: {
      message: status === 500 ? "Something went wrong. Please try again." : error.message,
      details: error.details
    }
  });
}
