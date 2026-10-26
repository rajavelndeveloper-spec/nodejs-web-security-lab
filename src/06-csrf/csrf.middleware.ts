import {
  createHash,
  randomBytes,
  timingSafeEqual,
} from "node:crypto";
import type { Request, Response, NextFunction } from "express";
import type { AuthenticatedRequest } from "../04-authentication-jwt/auth.middleware.js";

const allowedOrigin = process.env.APP_ORIGIN;

// Demo-only in-memory token store. Use a shared server-side store in production.
const csrfTokensByUser = new Map<string, string>();

export function requireTrustedOrigin(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  if (!allowedOrigin) {
    res.status(500).json({ message: "APP_ORIGIN is not configured" });
    return;
  }

  if (req.get("Origin") !== allowedOrigin) {
    res.status(403).json({ message: "Untrusted request origin" });
    return;
  }

  next();
}

/**
 * Issues a synchronizer token for the authenticated user.
 * The client should keep this token in memory and send it as X-CSRF-Token.
 */
export function issueCsrfToken(
  req: AuthenticatedRequest,
  res: Response,
) {
  if (!req.userId) {
    res.status(401).json({ message: "Authentication required" });
    return;
  }

  const token = randomBytes(32).toString("base64url");
  csrfTokensByUser.set(String(req.userId), token);

  res.setHeader("Cache-Control", "no-store");
  res.json({ csrfToken: token });
}

export function requireCsrfToken(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
) {
  if (!req.userId) {
    res.status(401).json({ message: "Authentication required" });
    return;
  }

  const expected = csrfTokensByUser.get(String(req.userId));
  const supplied = req.get("X-CSRF-Token");

  if (!expected || !supplied) {
    res.status(403).json({ message: "Missing or invalid CSRF token" });
    return;
  }

  // Compare fixed-length hashes to avoid length mismatch errors.
  const expectedHash = createHash("sha256").update(expected).digest();
  const suppliedHash = createHash("sha256").update(supplied).digest();

  if (!timingSafeEqual(expectedHash, suppliedHash)) {
    res.status(403).json({ message: "Missing or invalid CSRF token" });
    return;
  }

  next();
}

/** Call after logout/session revocation to invalidate the user's demo token. */
export function revokeCsrfToken(userId: string | number) {
  csrfTokensByUser.delete(String(userId));
}
