
import { Router } from "express";

const router = Router();

// Intentionally vulnerable: local learning only.
router.get("/vulnerable-search", (req, res) => {
  if (
    process.env.NODE_ENV === "production" ||
    process.env.ENABLE_VULNERABLE_POC !== "true"
  ) {
    return res.sendStatus(404);
  }

  const query = String(req.query.q ?? "");

  res.type("html").send(`
    <!doctype html>
    <html>
      <body>
        <h1>Search results</h1>
        <p>You searched for: ${query}</p>
      </body>
    </html>
  `);
});

export default router;
