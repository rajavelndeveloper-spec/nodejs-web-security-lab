import { Router } from "express";
import { pool } from "./db.js";
import {
  requireAuth,
  type AuthenticatedRequest,
} from "../04-authentication-jwt/auth.middleware.js";

const router = Router();

router.get("/employees/:id", requireAuth, async (req, res) => {
  const id = req.params.id;

  // Validate employee ID
  if (typeof id !== "string" || !/^\d+$/.test(id)) {
    return res.status(400).json({
      message: "Invalid employee ID",
    });
  }

  const authReq = req as AuthenticatedRequest;
  const userId = authReq.userId;

  // Ensure the authenticated user ID exists
  if (!userId) {
    return res.status(401).json({
      message: "Unauthorized",
    });
  }

  try {
    const result = await pool.query(
      `SELECT id, name, department
       FROM employees
       WHERE id = $1 AND user_id = $2`,
      [id, userId],
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
