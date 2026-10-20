
import { Router } from "express";
import rateLimit from "express-rate-limit";
import argon2 from "argon2";

const router = Router();

const demoPassword = "Demo-Password-123!";

// Demo only: simulate a database record containing a password hash.
const demoUserPromise = argon2.hash(demoPassword, {
  type: argon2.argon2id,
}).then((passwordHash) => ({
  username: "alice",
  passwordHash,
}));

// Limit requests from a client IP.
const ipLimiter = rateLimit({
  windowMs: 60 * 1000,
  limit: 10,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  message: {
    message: "Too many requests. Try again later.",
  },
});

// Limit attempts for a particular account as well.
const accountLimiter = rateLimit({
  windowMs: 60 * 1000,
  limit: 5,
  keyGenerator: (req) => {
    const username = req.body?.username;

    return typeof username === "string"
      ? username.trim().toLowerCase()
      : "invalid-account";
  },
  standardHeaders: "draft-8",
  legacyHeaders: false,
  message: {
    message: "Too many login attempts. Try again later.",
  },
});

router.post("/login", ipLimiter, accountLimiter, async (req, res) => {
  const { username, password } = req.body ?? {};

  if (
    typeof username !== "string" ||
    typeof password !== "string" ||
    username.length > 100 ||
    password.length > 128
  ) {
    return res.status(400).json({
      message: "Invalid input",
    });
  }

  try {
    const demoUser = await demoUserPromise;

    const passwordMatches = await argon2.verify(
      demoUser.passwordHash,
      password
    );

    const authenticated =
      username.trim().toLowerCase() === demoUser.username &&
      passwordMatches;

    if (!authenticated) {
      console.warn(JSON.stringify({
        event: "login_failed",
        account: username.trim().toLowerCase(),
        timestamp: new Date().toISOString(),
      }));

      return res.status(401).json({
        authenticated: false,
        message: "Invalid credentials",
      });
    }

    console.info(JSON.stringify({
      event: "login_success",
      account: demoUser.username,
      timestamp: new Date().toISOString(),
    }));

    return res.json({
      authenticated: true,
      message: "Login successful",
    });
  } catch {
    return res.status(500).json({
      message: "Internal server error",
    });
  }
});

export default router;
