
import express, { Request, Response, NextFunction } from "express";
import logger from "./logger.js";

const app = express();

// HTTP request logging middleware
app.use((req: Request, res: Response, next: NextFunction) => {
  const startTime = Date.now();

  res.on("finish", () => {
    const durationMs = Date.now() - startTime;

    const logData = {
      method: req.method,
      path: req.path,
      statusCode: res.statusCode,
      durationMs,
    };

    if (res.statusCode >= 500) {
      logger.error("HTTP request failed", logData);
    } else if (res.statusCode >= 400) {
      logger.warn("HTTP request returned a client error", logData);
    } else {
      logger.info("HTTP request completed", logData);
    }
  });

  next();
});

// Test endpoints
app.get("/", (req: Request, res: Response) => {
  res.status(200).json({ message: "Home page" });
});

app.get("/missing", (req: Request, res: Response) => {
  res.status(404).json({ message: "Resource not found" });
});

app.get("/error-demo", (req: Request, res: Response) => {
  res.status(500).json({ message: "Internal server error" });
});

app.listen(3001, () => {
  logger.info("HTTP logging demo server started", {
    port: 3001,
  });
});