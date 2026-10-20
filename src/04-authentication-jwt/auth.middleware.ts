
import type { Request, Response, NextFunction } from "express";
import { verifyAccessToken } from "./jwt.js";

export interface AuthenticatedRequest extends Request {
  userId?: string;
}

export function requireAuth(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) {
  const authorization = req.headers.authorization;

  if (!authorization?.startsWith("Bearer ")) {
    return res.status(401).json({
      message: "Authentication required",
    });
  }

  const token = authorization.slice("Bearer ".length).trim();

  if (!token) {
    return res.status(401).json({
      message: "Authentication required",
    });
  }

  try {
    const payload = verifyAccessToken(token);
    req.userId = payload.sub;
    return next();
  } catch {
    return res.status(401).json({
      message: "Invalid or expired access token",
    });
  }
}
