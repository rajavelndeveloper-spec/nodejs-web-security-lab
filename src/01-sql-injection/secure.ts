import { Router } from "express";
import { pool } from "./db.js";

const router = Router();

router.post("/login", async (req, res) => {
  const { username, password } = req.body;

  if (typeof username !== "string" || typeof password !== "string") {
    return res.status(400).json({ message: "Invalid input" });
  }

  try {
    const result = await pool.query(
      `SELECT id, username
       FROM demo_users
       WHERE username = $1 AND password = $2`,
      [username, password]
    );

    return res.json({
      authenticated: result.rows.length > 0,
      user: result.rows[0] ?? null
    });
  } catch {
    return res.status(500).json({ message: "Internal server error" });
  }
});

export default router;