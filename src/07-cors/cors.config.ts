import "dotenv/config";
import cors, { type CorsOptions } from "cors";

const allowedOrigin = process.env.APP_ORIGIN;

if (!allowedOrigin) {
  throw new Error("APP_ORIGIN is not configured");
}

const corsOptions: CorsOptions = {
  origin: allowedOrigin,
  credentials: true,
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
  allowedHeaders: [
    "Content-Type",
    "Authorization",
    "X-CSRF-Token",
  ],
  optionsSuccessStatus: 204,
};

export const corsMiddleware = cors(corsOptions);
