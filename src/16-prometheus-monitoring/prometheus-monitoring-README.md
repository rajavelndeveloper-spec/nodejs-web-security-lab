# Prometheus Monitoring with Node.js, Express, and TypeScript

This README documents the Prometheus monitoring concepts practised in this project, including metric types, Express instrumentation, Prometheus scraping, and PromQL queries.

## 1. What is Prometheus?

**Prometheus** is an open-source monitoring and alerting system. It collects numerical metrics from applications at regular intervals and stores them as time-series data.

A time series is a metric value recorded over time, with labels that identify what the value describes.

In this project:

- The Express application exposes metrics on `http://localhost:3002/metrics`.
- Prometheus scrapes that endpoint every 5 seconds.
- Prometheus is available at `http://localhost:9090`.

docker run -d --name prometheus `                      
>>   -p 9090:9090 `
>>   -v "${PWD}/src/16-prometheus-monitoring/prometheus.yml:/etc/prometheus/prometheus.yml:ro" `
>>   prom/prometheus

## 2. Project setup

### Express metrics endpoint

The application uses the `prom-client` package to register and expose metrics.

```ts
import express from "express";
import client from "prom-client";

const app = express();
const register = new client.Registry();

// Collect default Node.js process metrics.
client.collectDefaultMetrics({ register });
```

The `/metrics` endpoint exposes registered metrics in Prometheus format:

```ts
app.get("/metrics", async (_req, res) => {
  res.set("Content-Type", register.contentType);
  res.end(await register.metrics());
});
```

Start the application using the command configured for this project:

```bash
npx tsx src/16-prometheus-monitoring/prometheus-demo.ts
```

The example application listens on port `3002`.

### Prometheus configuration

Example `prometheus/prometheus.yml`:

```yaml
global:
  scrape_interval: 5s

scrape_configs:
  - job_name: "express-app"
    metrics_path: "/metrics"
    static_configs:
      - targets: ["host.docker.internal:3002"]
```

**What these settings mean:**

- `scrape_interval: 5s`: Prometheus tries to collect metrics every five seconds.
- `job_name`: A label identifying this scrape target.
- `metrics_path`: The HTTP path Prometheus requests.
- `host.docker.internal:3002`: From a typical Docker Desktop container, this hostname reaches a service on the host machine at port `3002`.

The target can be checked at `http://localhost:9090/targets`. The target should show **UP** when Prometheus can scrape it successfully.

> Docker note: `host.docker.internal` is common with Docker Desktop. On native Linux Docker installations, its availability depends on configuration; you may need to add a host-gateway mapping or use another reachable host address.

## 3. Metric types

### 3.1 Counter

A **Counter** tracks a running total that normally only increases, such as total requests or total server errors. It can reset when the process restarts.

Example:

```ts
const httpRequestsTotal = new client.Counter({
  name: "app_http_requests_total",
  help: "Total number of HTTP requests received",
  labelNames: ["method", "route", "status_code"],
  registers: [register],
});
```

Increment it when a request completes:

```ts
httpRequestsTotal.inc({
  method: req.method,
  route: req.path,
  status_code: String(res.statusCode),
});
```

Use a Counter for questions such as:

- How many requests have been recorded?
- How many HTTP 500 responses have occurred?
- How many jobs or tasks have completed?

### 3.2 Gauge

A **Gauge** tracks a value that can go up and down, such as active requests, in-progress jobs, or current queue size.

Example:

```ts
const activeRequests = new client.Gauge({
  name: "app_active_requests",
  help: "Number of HTTP requests currently being processed",
  registers: [register],
});
```

Update it as requests start and finish:

```ts
activeRequests.inc(); // A request starts.
activeRequests.dec(); // A request finishes.
```

Typical values might be `0`, `1`, `5`, or `20`, depending on how many requests are currently being processed.

**Implementation note:** Decrement the Gauge exactly once for each request that was incremented. A robust middleware should also account for connections that close before the response finishes. Since `/metrics` passes through general request middleware, scraping that endpoint can briefly affect the active-request count.

### 3.3 Histogram

A **Histogram** records observations, such as request duration, into configured buckets. It also exposes the observation count and sum. Prometheus can use the bucket counts to estimate percentiles.

Example:

```ts
const httpRequestDuration = new client.Histogram({
  name: "app_http_request_duration_seconds",
  help: "Duration of HTTP requests in seconds",
  labelNames: ["method", "route", "status_code"],
  buckets: [0.01, 0.05, 0.1, 0.3, 0.5, 1, 2],
  registers: [register],
});
```

Record a request's duration:

```ts
const durationSeconds = (Date.now() - startTime) / 1000;
httpRequestDuration.observe(labels, durationSeconds);
```

The bucket boundaries are in **seconds**:

- `0.01` = 10 milliseconds
- `0.1` = 100 milliseconds
- `0.5` = 500 milliseconds
- `1` = 1 second
- `2` = 2 seconds

Histogram metric names typically include:

- `_bucket`: number of observations within each bucket boundary (cumulative)
- `_sum`: sum of all observed values
- `_count`: number of observations

### 3.4 Summary

A **Summary** records observations and calculates configured quantiles inside the application process. It can also expose the sum and count.

Example:

```ts
const requestDurationSummary = new client.Summary({
  name: "app_request_duration_summary_seconds",
  help: "Summary of HTTP request durations in seconds",
  labelNames: ["method", "route", "status_code"],
  percentiles: [0.5, 0.9, 0.95, 0.99],
  registers: [register],
});
```

Record an observation:

```ts
requestDurationSummary.observe(labels, durationSeconds);
```

Configured quantiles:

- `0.5` = p50, the median
- `0.9` = p90
- `0.95` = p95
- `0.99` = p99

Summary quantiles are calculated locally and generally cannot be accurately aggregated across application instances. Histograms are often the better choice when you need fleet-wide percentiles in Prometheus.

## 4. Counter, Gauge, Histogram, and Summary compared

| Metric type | What it measures | Example |
|---|---|---|
| Counter | Accumulating total | Total HTTP requests |
| Gauge | Current value that can rise or fall | Active requests |
| Histogram | Distribution of observations using buckets | Request durations and latency percentiles |
| Summary | Observations and application-side quantiles | p50 and p95 latency |

## 5. Express middleware: tracking requests

A request middleware can measure duration and update the metrics when a response finishes.

Simplified example using the metric variables defined above:

```ts
app.use((req, res, next) => {
  const startTime = Date.now();
  activeRequests.inc();

  res.on("finish", () => {
    const durationSeconds = (Date.now() - startTime) / 1000;

    const labels = {
      method: req.method,
      route: req.path,
      status_code: String(res.statusCode),
    };

    httpRequestsTotal.inc(labels);
    httpRequestDuration.observe(labels, durationSeconds);

    // If using a Summary, record the same observation:
    // requestDurationSummary.observe(labels, durationSeconds);

    activeRequests.dec();
  });

  next();
});
```

This demonstrates the basic pattern:

1. Record the request start time.
2. Increase the active-request Gauge.
3. When the response finishes, calculate duration.
4. Increment the request Counter with labels.
5. Observe the duration in the Histogram (and optionally Summary).
6. Decrease the active-request Gauge.

For production code, make sure the Gauge is decremented exactly once even if the client disconnects or the connection closes before `finish`. Also consider using normalized route templates (for example, `/users/:id`) rather than raw paths (for example, `/users/123`) as metric labels. Raw paths can create too many distinct time series.

## 6. Labels

Labels add context to a metric.

In this project, the request Counter and Histogram use:

- `method`: HTTP method such as `GET` or `POST`
- `route`: request path or route identifier
- `status_code`: HTTP response status, such as `200` or `500`

For example, a metric may appear as:

```text
app_http_requests_total{method="GET",route="/users",status_code="200"} 12
```

Avoid labels with unlimited or highly variable values, such as user IDs, email addresses, raw URLs containing IDs, or request IDs. These can create high cardinality, increasing memory and storage use.

## 7. Useful PromQL queries

Open `http://localhost:9090`, enter a query in the Prometheus expression browser, and select **Execute**.

### Total requests recorded, excluding `/metrics`

```promql
sum(app_http_requests_total{route!="/metrics"})
```

This sums the current Counter values across matching series. It is not limited to a time window.

### Total recorded HTTP 500 responses

```promql
sum(app_http_requests_total{status_code="500"})
```

This selects series with status code `500` and sums their current Counter values.

### Estimated HTTP 500 responses during the last five minutes

```promql
sum(
  increase(app_http_requests_total{status_code="500"}[5m])
)
```

`increase()` estimates how much the Counter increased during the selected range, accounting for Counter resets.

### Average request rate per second over five minutes

```promql
sum(rate(app_http_requests_total{route!="/metrics"}[5m]))
```

`rate()` calculates the average per-second increase of each Counter over the five-minute window. `sum()` adds the rates.

### Average `/users` response duration in milliseconds over five minutes

```promql
1000 *
rate(app_http_request_duration_seconds_sum{route="/users"}[5m])
/
rate(app_http_request_duration_seconds_count{route="/users"}[5m])
```

The average is calculated as the increase in total duration divided by the increase in observation count. Multiplying by `1000` converts seconds to milliseconds.

### Approximate p95 latency in milliseconds from a Histogram

```promql
histogram_quantile(
  0.95,
  sum by (le) (
    rate(app_http_request_duration_seconds_bucket{route="/users"}[5m])
  )
) * 1000
```

This calculates a p95 estimate using the Histogram buckets for `/users`, aggregating the buckets across matching series. `le` is the label that identifies each bucket's upper boundary. Multiplying by `1000` converts seconds to milliseconds.

### Average active requests

To inspect the current active-request value, query:

```promql
app_active_requests
```

Prometheus records samples periodically, so the displayed value is the latest scraped sample, not a continuous live count.

## 8. Important PromQL functions

| Function | Meaning | Typical use |
|---|---|---|
| `sum()` | Adds matching series | Total requests across routes |
| `rate()` | Average Counter increase per second over a range | Requests per second |
| `increase()` | Estimated Counter increase over a range | Errors in the last five minutes |
| `histogram_quantile()` | Estimates a quantile from Histogram buckets | p95 latency |

Example distinction:

- `sum(app_http_requests_total)` = sum of current Counter values.
- `sum(rate(app_http_requests_total[5m]))` = average requests per second over five minutes.
- `sum(increase(app_http_requests_total[5m]))` = estimated requests over five minutes.

## 9. Testing and troubleshooting

1. Start the Express application on port `3002`.
2. Open `http://localhost:3002/` and `http://localhost:3002/users` to generate requests.
3. Open `http://localhost:3002/metrics` and look for metric names such as `app_http_requests_total`, `app_http_request_duration_seconds`, and `app_active_requests`.
4. Open `http://localhost:9090/targets` and confirm the `express-app` target is **UP**.
5. Open `http://localhost:9090` and try the PromQL queries above.

### Why might `app_active_requests` show `1`?

The active-request Gauge increments when a request starts and decrements when its response finishes. A request may be active at the moment Prometheus scrapes `/metrics`. The metrics endpoint itself can also pass through the same middleware, so it can temporarily affect the Gauge.

### Why might p95 and average response time look different?

They measure different things:

- Average response time divides total duration by request count.
- p95 estimates the latency threshold at or below which 95% of observations fall.

They can differ substantially, especially when a few requests are much slower than the rest. Results also depend on the selected time window, the number of observations, and Histogram bucket boundaries.

## 10. Key takeaways

- Prometheus scrapes an application's metrics endpoint and stores time-series samples.
- `prom-client` lets a Node.js/Express application register and expose metrics.
- Use a Counter for accumulating totals, a Gauge for values that can rise and fall, a Histogram for bucketed distributions, and a Summary for application-side quantiles.
- Use `rate()` for a per-second Counter rate and `increase()` for the estimated increase during a time range.
- Use Histogram buckets with `histogram_quantile()` to estimate p95 latency across instances.
- Keep metric labels bounded and predictable to avoid excessive time-series cardinality.
- A target marked **UP** indicates that Prometheus can scrape it successfully; it does not guarantee every metric or query is correct.

## Next step

Create a Grafana dashboard connected to Prometheus and visualise:

- Request rate
- HTTP 500 error count or rate
- Active requests
- Average response time
- p95 response time
