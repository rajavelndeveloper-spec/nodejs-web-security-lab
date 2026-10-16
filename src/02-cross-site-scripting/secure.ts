import { Router } from "express";

const router = Router();
type StoredComment = {
  id: number;
  content: string;
};

const safeComments: StoredComment[] = [];
let safeNextId = 1;
router.get("/secure-search", (req, res) => {
  const query = String(req.query.q ?? "");

  // Encode characters that have special meaning in HTML text.
  const safeQuery = query.replace(/[&<>"']/g, (character) => {
    const entities: Record<string, string> = {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#x27;",
    };

    return entities[character];
  });

  res.type("html").send(`
    <!doctype html>
    <html>
      <body>
        <h1>Search results</h1>
        <p>You searched for: ${safeQuery}</p>
      </body>
    </html>
  `);
});

router.post("/secure-comments", (req, res) => {
  const { content } = req.body;

  if (
    typeof content !== "string" ||
    content.trim().length === 0 ||
    content.length > 1000
  ) {
    return res.status(400).json({ message: "Invalid comment" });
  }

  const comment = {
    id: safeNextId++,
    content,
  };

  safeComments.push(comment);

  return res.status(201).json({
    message: "Comment saved",
    id: comment.id,
  });
});

router.get("/secure-comments", (_req, res) => {
  const items = safeComments
    .map((comment) => {
      const safeContent = comment.content.replace(/[&<>"']/g, (char) => {
        const entities: Record<string, string> = {
          "&": "&amp;",
          "<": "&lt;",
          ">": "&gt;",
          '"': "&quot;",
          "'": "&#x27;",
        };

        return entities[char];
      });

      return `<li>${safeContent}</li>`;
    })
    .join("");

  return res.type("html").send(`
    <!doctype html>
    <html>
      <body>
        <h1>Comments</h1>
        <ul>${items}</ul>
      </body>
    </html>
  `);
});

export default router;
