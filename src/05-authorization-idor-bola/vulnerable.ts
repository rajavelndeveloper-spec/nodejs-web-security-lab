import { Router } from "express";
import { pool } from "./db.js";
import {
  requireAuth,
  type AuthenticatedRequest,
} from "../04-authentication-jwt/auth.middleware.js";

const router = Router();

router.get("/employees/:id", requireAuth, async (req, res) => {
  // Allow this vulnerable POC only in local development.
  if (
    process.env.NODE_ENV === "production" ||
    process.env.ENABLE_VULNERABLE_POC !== "true"
  ) {
    return res.sendStatus(404);
  }

  const id = req.params.id;

  // Validate employee ID safely.
  if (typeof id !== "string" || !/^\d+$/.test(id)) {
    return res.status(400).json({
      message: "Invalid employee ID",
    });
  }

  const authReq = req as AuthenticatedRequest;
  const userId = authReq.userId;

  if (!userId) {
    return res.status(401).json({
      message: "Unauthorized",
    });
  }

  try {
    // INTENTIONALLY VULNERABLE:
    // Authentication is checked, but record ownership is not.
    const result = await pool.query(
      `SELECT id, user_id, name, department
       FROM employees
       WHERE id = $1`,
      [id],
    );

    if (result.rowCount === 0) {
      return res.status(404).json({
        message: "Employee not found",
      });
    }

    return res.json(result.rows[0]);
  } catch (error) {
    console.error("Failed to fetch employee:", error);

    return res.status(500).json({
      message: "Internal server error",
    });
  }
});

export default router;
