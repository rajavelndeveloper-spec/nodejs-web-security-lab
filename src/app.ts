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
import vulnerableAuthorizationRoutes from "./05-authorization-idor-bola/vulnerable.js";
import secureAuthorizationRoutes from "./05-authorization-idor-bola/secure.js";
import vulnerableCsrfRoutes from "./06-csrf/vulnerable.js";
import secureCsrfRoutes from "./06-csrf/secure.js";
import { securityHeadersMiddleware } from "./08-security-headers/security-headers.config.js";
const app = express();
app.use((req, res, next) => {
  res.setHeader(
    "Permissions-Policy",
    "camera=(), microphone=(), geolocation=()",
  );
  next();
});
app.use(securityHeadersMiddleware);
app.use(express.json({ limit: "100kb" }));
app.use(cookieParser());
app.use(express.static("public"));
// app.use(helmet());

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
app.use("/api/idor/vulnerable", vulnerableAuthorizationRoutes);
app.use("/api/idor/secure", secureAuthorizationRoutes);
app.use("/api/csrf/vulnerable", vulnerableCsrfRoutes);
app.use("/api/csrf/secure", secureCsrfRoutes);
//since below is inline script it is blocked.if it is included like <script src='/....'> refering from cuurent page means it is allowed.<script src='evil.com/data.js'> external scritps are not allowed
app.get("/csp-test", (req, res) => {
  res.type("html").send(`
    <script src="/csp-test.js"></script>
    <!DOCTYPE html>
    <html>
      <body>
        <h1>CSP Test</h1>

        <script>
          alert("Inline script executed");
        </script>
      </body>
    </html>
  `);
});
app.get("/mime-test", (_req, res) => {
  res
    .type("text/plain")
    .send('console.log("This is plain text, not a JavaScript file");');
});
app.get("/check-referer", (req, res) => {
  console.log("Referer:", req.get("Referer"));

  res.json({
    message: "Check the Referer header",
    referer: req.get("Referer") ?? "No Referer header received",
  });
});
app.get("/permissions-test", (_req, res) => {
  res.type("html").send(`
    <!DOCTYPE html>
    <html>
      <body>
      <h1>Permissions Policy Test</h1>
      <button id="check-location">Check location</button>
      
      </body>
      <script src="/permissions-test.js"></script>
    </html>
  `);
});
export default app;
