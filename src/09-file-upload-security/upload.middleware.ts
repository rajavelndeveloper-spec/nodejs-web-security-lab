
import type { Request, Response, NextFunction } from "express";
import { fileTypeFromFile } from "file-type";
import { unlink } from "node:fs/promises";
import { randomUUID } from "node:crypto";
const allowedTypes = [
  "image/jpeg",
  "image/png",
  "image/webp",
];

export async function validateFileSignature(
  req: Request,
  res: Response,
  next: NextFunction
) {
  if (!req.file) {
    res.status(400).json({ message: "File is required" });
    return;
  }

  try {
    const detectedType = await fileTypeFromFile(req.file.path);

    if (!detectedType || !allowedTypes.includes(detectedType.mime)) {
      await unlink(req.file.path);

      res.status(400).json({
        message: "Invalid file content. Only JPG, PNG, and WebP are allowed.",
      });
      return;
    }

    next();
  } catch (error) {
    await unlink(req.file.path).catch(() => {});
    next(error);
  }
}
