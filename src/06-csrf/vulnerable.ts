import { Router } from "express";
import { requireAuth } from "../04-authentication-jwt/auth.middleware.js";

const router = Router();

// Local demonstration only: in-memory dummy balance.
let demoBalance = 1000;

router.post("/transfer", requireAuth, (req, res) => {
  if (
    process.env.NODE_ENV === "production" ||
    process.env.ENABLE_VULNERABLE_POC !== "true"
  ) {
    res.sendStatus(404);
    return;
  }

  const amount = Number(req.body?.amount);

  if (!Number.isFinite(amount) || amount <= 0) {
    res.status(400).json({ message: "Invalid amount" });
    return;
  }

  // Intentionally vulnerable: no CSRF/Origin validation.
  demoBalance -= amount;

  res.json({
    message: "Demo transfer processed",
    demoBalance,
  });
});

export default router;
