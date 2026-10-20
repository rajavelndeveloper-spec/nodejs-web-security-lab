import { Router } from "express";
import { loginUser, registerUser } from "./auth.service.js";
import { requireAuth, type AuthenticatedRequest } from "./auth.middleware.js";
import {
  createRefreshSession,
  rotateRefreshToken,
  revokeRefreshToken,
} from "./refresh-token.service.js";

const router = Router();

const refreshCookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "strict" as const,
  path: "/api/auth",
};

// Register
router.post("/register", async (req, res) => {
  const { email, password } = req.body ?? {};

  if (
    typeof email !== "string" ||
    typeof password !== "string" ||
    email.length > 255 ||
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim()) ||
    password.length < 12 ||
    Buffer.byteLength(password, "utf8") > 128
  ) {
    return res.status(400).json({
      message: "Invalid email or password",
    });
  }

  try {
    const user = await registerUser(email, password);

    return res.status(201).json({
      message: "Registration successful",
      user,
    });
  } catch (error: unknown) {
    if (error instanceof Error && error.message === "EMAIL_ALREADY_EXISTS") {
      return res.status(409).json({
        message: "An account with this email already exists",
      });
    }

    return res.status(500).json({
      message: "Internal server error",
    });
  }
});

// Login
router.post("/login", async (req, res) => {
  const { email, password } = req.body ?? {};

  if (
    typeof email !== "string" ||
    typeof password !== "string" ||
    email.length > 255 ||
    password.length > 128
  ) {
    return res.status(400).json({
      message: "Invalid email or password",
    });
  }

  try {
    const result = await loginUser(email, password);

    if (!result) {
      return res.status(401).json({
        message: "Invalid email or password",
      });
    }

    const refresh = await createRefreshSession(result.user.id);

    res.cookie("refreshToken", refresh.token, {
      ...refreshCookieOptions,
      expires: refresh.expiresAt,
    });

    return res.json({
      accessToken: result.accessToken,
      user: result.user,
    });
  } catch {
    return res.status(500).json({
      message: "Internal server error",
    });
  }
});

// Refresh access token and rotate refresh token
router.post("/refresh", async (req, res) => {
  const token: unknown = req.cookies?.refreshToken;

  if (typeof token !== "string" || !token) {
    return res.status(401).json({
      message: "Refresh token required",
    });
  }

  try {
    const result = await rotateRefreshToken(token);

    if (!result) {
      res.clearCookie("refreshToken", refreshCookieOptions);

      return res.status(401).json({
        message: "Invalid refresh token",
      });
    }

    res.cookie("refreshToken", result.token, {
      ...refreshCookieOptions,
      expires: result.expiresAt,
    });

    return res.json({
      accessToken: result.accessToken,
    });
  } catch {
    return res.status(500).json({
      message: "Internal server error",
    });
  }
});

// Logout and revoke the current refresh token
router.post("/logout", async (req, res) => {
  const token: unknown = req.cookies?.refreshToken;

  try {
    if (typeof token === "string" && token) {
      await revokeRefreshToken(token);
    }

    res.clearCookie("refreshToken", refreshCookieOptions);

    return res.status(204).end();
  } catch {
    return res.status(500).json({
      message: "Internal server error",
    });
  }
});

// Protected route
router.get("/me", requireAuth, (req, res) => {
  const authReq = req as AuthenticatedRequest;

  return res.json({
    userId: authReq.userId,
  });
});

export default router;
