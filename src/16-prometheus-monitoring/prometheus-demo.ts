import express from "express";
import client from "prom-client";

const app = express();

// Create a registry to hold our metrics
const register = new client.Registry();

// Collect default Node.js metrics
//collects built-in Node.js performance information, such as memory usage and CPU-related metrics.
client.collectDefaultMetrics({ register });

// Create a counter for HTTP requests
const httpRequestsTotal = new client.Counter({
  name: "app_http_requests_total",
  help: "Total number of HTTP requests received",
  labelNames: ["method", "route", "status_code"],
  registers: [register],
});

const httpRequestDuration = new client.Histogram({
  name: "app_http_request_duration_seconds",
  help: "Duration of HTTP requests in seconds",
  labelNames: ["method", "route", "status_code"],
  buckets: [0.01, 0.05, 0.1, 0.3, 0.5, 1, 2],
  registers: [register],
});

const activeRequests = new client.Gauge({
  name: "app_active_requests",
  help: "Number of HTTP requests currently being processed",
  registers: [register],
});

const requestDurationSummary = new client.Summary({
  name: "app_request_duration_summary_seconds",
  help: "Summary of HTTP request durations in seconds",
  labelNames: ["method", "route", "status_code"],
  percentiles: [0.5, 0.9, 0.95, 0.99],
  registers: [register],
});

// Count requests after their responses finish
app.use((req, res, next) => {
  const startTime = Date.now();

  // A request has started
  activeRequests.inc();

  res.on("finish", () => {
    const durationSeconds = (Date.now() - startTime) / 1000;

    const labels = {
      method: req.method,
      route: req.path,
      status_code: String(res.statusCode),
    };

    // Count completed requests
    httpRequestsTotal.inc(labels);

    // Record request duration
    httpRequestDuration.observe(labels, durationSeconds);

    requestDurationSummary.observe(labels, durationSeconds);

    // A request has finished
    activeRequests.dec();
  });

  next();
});

// Test routes
app.get("/", (_req, res) => {
  res.json({ message: "Home page" });
});

app.get("/users", (_req, res) => {
  res.json({ users: ["Arun", "Priya"] });
});

app.get("/slow", (_req, res) => {
  setTimeout(() => {
    res.json({ message: "Request completed" });
  }, 10000);
});

// Prometheus scrapes this endpoint
app.get("/metrics", async (_req, res) => {
  res.set("Content-Type", register.contentType);
  res.end(await register.metrics());
});

app.listen(3002, () => {
  console.log("Server running at http://localhost:3002");
});
