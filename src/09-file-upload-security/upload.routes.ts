import { Router } from "express";
import multer from "multer";
import { validateFileSignature } from "./upload.middleware.js";
import { randomUUID } from "node:crypto";

const router = Router();
const storage = multer.diskStorage({
  destination: "uploads/",
  filename: (req, file, callback) => {
    callback(null, randomUUID());
  },
});

const upload = multer({
  storage,
  limits: {
    fileSize: 1024 * 1024, // 1 MB
    files: 1, // Allow only one file
  },
  fileFilter: (req, file, callback) => {
    const allowedTypes = [
      "image/jpeg",
      "image/png",
      "image/webp",
    ];

    if (allowedTypes.includes(file.mimetype)) {
      callback(null, true);
    } else {
      callback(new Error("Only JPG, PNG, and WebP images are allowed"));
    }
  },
});

router.post("/upload", upload.single("file"),validateFileSignature, (req, res) => {
  res.json({
    message: "File uploaded successfully",
    file: req.file?.originalname,
  });
});

export default router;