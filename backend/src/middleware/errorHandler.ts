import type { NextFunction, Request, Response } from "express";
import { ApiError } from "../utils/ApiError.js";
import logger from "../utils/logger.js";

export function errorHandler(
  err: Error,
  req: Request,
  res: Response,
  _next: NextFunction,
): void {
  if (err instanceof ApiError) {
    logger.warn("API error", {
      statusCode: err.statusCode,
      code: err.code,
      message: err.message,
      path: req.path,
    });
    res.status(err.statusCode).json({ error: err.message, code: err.code });
    return;
  }

  
  logger.error("Unhandled error", {
    error: err.message,
    stack: err.stack,
    path: req.path,
  });
  res
    .status(500)
    .json({ error: "Internal server error", code: "INTERNAL_ERROR" });
}
