
import { Router } from "express";
// import DOMPurify from "isomorphic-dompurify";

const router = Router();

router.post("/sanitize-html", (req, res) => {
  const { content } = req.body;

  if (
    typeof content !== "string" ||
    content.length > 5000
  ) {
    return res.status(400).json({
      message: "Invalid content",
    });
  }

//   const cleanHtml = DOMPurify.sanitize(content, {
//     ALLOWED_TAGS: ["b", "strong", "i", "em", "p", "ul", "ol", "li", "a"],
//     ALLOWED_ATTR: ["href", "title"],
//   });

//   return res.json({
//     sanitizedHtml: cleanHtml,
//   });
});

export default router;
