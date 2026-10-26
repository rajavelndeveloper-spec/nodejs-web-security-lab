# Concept 7 — CSRF and SameSite Cookies

This folder demonstrates CSRF defenses in the existing Node.js + TypeScript + Express security lab.

## Files

- `vulnerable.ts` — intentionally lacks Origin and CSRF-token checks; local POC only.
- `secure.ts` — requires authentication, a trusted Origin, and a synchronizer CSRF token.
- `csrf.middleware.ts` — Origin validation, token issuance, token validation, and token revocation.
- `same-site-cookies.ts` — cookie options example for the existing refresh-token route.
- `test-cases.md` — manual test checklist.

## 1. Environment

Add the exact frontend origin to `.env`, for example:

```env
APP_ORIGIN=http://localhost:4200
```

Use your real frontend origin including scheme and port. Do not set this to `*`.

## 2. Register routes

In `src/app.ts` (adjust paths if your folder structure differs):

```ts
import secureCsrfRoutes from "./06-csrf/secure.js";
import vulnerableCsrfRoutes from "./06-csrf/vulnerable.js";

app.use("/api/csrf/secure", secureCsrfRoutes);
app.use("/api/csrf/vulnerable", vulnerableCsrfRoutes);
```

Ensure `express.json()` is registered before these routers. Keep the vulnerable route disabled in production; it already checks `NODE_ENV` and `ENABLE_VULNERABLE_POC`.

## 3. Test the synchronizer token flow

1. Log in and obtain a valid access token using your existing authentication flow.
2. Fetch a CSRF token:

```bash
curl -i http://localhost:3000/api/csrf/secure/csrf-token \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Origin: http://localhost:4200"
```

3. Copy the returned `csrfToken` value and submit the state-changing request:

```bash
curl -i -X POST http://localhost:3000/api/csrf/secure/transfer \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Origin: http://localhost:4200" \
  -H "X-CSRF-Token: YOUR_CSRF_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"amount":100}'
```

4. Try omitting `X-CSRF-Token`, changing it, or sending an untrusted Origin. Those requests should be rejected.

This POC uses an in-memory token store and is intended for learning and single-process local testing only. Tokens disappear on restart and are not shared between server instances. For production, use a well-reviewed CSRF implementation and a session/shared store where needed, with rotation, expiration, and appropriate CSRF token lifecycle management.

## 4. Cookie settings

See `same-site-cookies.ts` and reuse its options in `auth.routes.ts` when setting and clearing the refresh-token cookie. `SameSite=Strict` is useful defense in depth but does not replace Origin validation and CSRF tokens.

## 5. Important architecture note

This demo uses Bearer access tokens in the `Authorization` header. A CSRF token is primarily needed for requests authenticated automatically by the browser, such as cookie-authenticated requests. This exercise intentionally demonstrates a synchronizer token flow alongside your existing auth middleware. For the real refresh-token endpoints, protect the cookie-authenticated operations with Origin validation and select a CSRF-token approach that matches your frontend and deployment architecture.
