import { Router } from "express";
import { requireAuth } from "../04-authentication-jwt/auth.middleware.js";
import {
  issueCsrfToken,
  requireCsrfToken,
  requireTrustedOrigin,
} from "./csrf.middleware.js";

const router = Router();

// Local demonstration only: in-memory dummy balance.
let demoBalance = 1000;

// Fetch a token after authentication. Origin validation is applied to this
// endpoint too; the browser frontend should call it from the trusted origin.
router.get(
  "/csrf-token",
  requireAuth,
  requireTrustedOrigin,
  issueCsrfToken,
);

router.post(
  "/transfer",
  requireAuth,
  requireTrustedOrigin,
  requireCsrfToken,
  (req, res) => {
    const amount = Number(req.body?.amount);

    if (!Number.isFinite(amount) || amount <= 0) {
      res.status(400).json({ message: "Invalid amount" });
      return;
    }

    demoBalance -= amount;

    res.json({
      message: "Demo transfer processed",
      demoBalance,
    });
  },
);

export default router;
