import express from "express";
import helmet from "helmet";
import cookieParser from "cookie-parser";
import vulnerableSqlRoutes from "./01-sql-injection/vulnerable.js";
import secureSqlRoutes from "./01-sql-injection/secure.js";
import reflectedXssRoutes from "./02-cross-site-scripting/reflected-xss.js";
import secureXssRoutes from "./02-cross-site-scripting/secure.js";
import storedXssRoutes from "./02-cross-site-scripting/stored-xss.js";
import bruteForceRoutes from "./03-brute-force/vulnerable.js";
import secureBruteForceRoutes from "./03-brute-force/secure.js";
import jwtAuthRoutes from "./04-authentication-jwt/auth.routes.js";
const app = express();

app.use(express.json({ limit: "100kb" }));
app.use(cookieParser());
app.use(helmet());

app.get("/", (_req, res) => {
  res.json({
    message: "Node.js Web Security Lab",
    status: "running",
  });
});

app.use("/api/sqli/vulnerable", vulnerableSqlRoutes);
app.use("/api/sqli/secure", secureSqlRoutes);
app.use("/api/xss", reflectedXssRoutes);
app.use("/api/xss", secureXssRoutes);
app.use("/api/xss", storedXssRoutes);
app.use("/api/brute-force/vulnerable", bruteForceRoutes);
app.use("/api/brute-force/secure", secureBruteForceRoutes);
app.use("/api/auth", jwtAuthRoutes);
export default app;
