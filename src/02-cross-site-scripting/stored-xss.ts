
import { Router } from "express";

const router = Router();

type Comment = {
  id: number;
  content: string;
};

const comments: Comment[] = [];
let nextId = 1;

// Intentionally vulnerable: local learning only.
router.post("/vulnerable-comments", (req, res) => {
  if (
    process.env.NODE_ENV === "production" ||
    process.env.ENABLE_VULNERABLE_POC !== "true"
  ) {
    return res.sendStatus(404);
  }

  const { content } = req.body;

  if (typeof content !== "string" || content.length > 1000) {
    return res.status(400).json({ message: "Invalid comment" });
  }

  comments.push({
    id: nextId++,
    content,
  });

  return res.status(201).json({
    message: "Comment saved",
    id: comments[comments.length - 1].id,
  });
});

// Intentionally vulnerable: renders stored content as HTML.
router.get("/vulnerable-comments", (req, res) => {
  if (
    process.env.NODE_ENV === "production" ||
    process.env.ENABLE_VULNERABLE_POC !== "true"
  ) {
    return res.sendStatus(404);
  }

  const commentHtml = comments
    .map((comment) => `<li>${comment.content}</li>`)
    .join("");

  return res.type("html").send(`
    <!doctype html>
    <html>
      <body>
        <h1>Comments</h1>
        <ul>${commentHtml}</ul>
      </body>
    </html>
  `);
});

export default router;
