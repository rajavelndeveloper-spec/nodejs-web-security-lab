import { Router } from "express";
import { pool } from "./db.js";

const router = Router();

router.post("/login", async (req, res) => {
  if (
    process.env.NODE_ENV === "production" ||
    process.env.ENABLE_VULNERABLE_POC !== "true"
  ) {
    return res.sendStatus(404);
  }

  const { username, password } = req.body;

  if (typeof username !== "string" || typeof password !== "string") {
    return res.status(400).json({ message: "Invalid input" });
  }

  // INTENTIONALLY VULNERABLE: local security demonstration only.
  const sql = `
    SELECT id, username,password
    FROM demo_users
    WHERE username = '${username}'
      AND password = '${password}'
  `;
console.log(sql)
  try {
    const result = await pool.query(sql);

    return res.json({
      authenticated: result.rows.length > 0,
      users: result.rows,
    });
  } catch (error) {
    console.error("SQL query failed:", error);

    return res.status(400).json({
      message: "Query failed",
    });
  }
});

export default router;
