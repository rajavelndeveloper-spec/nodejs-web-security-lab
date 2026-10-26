# Concept 7 — CORS (Cross-Origin Resource Sharing)

This concept uses the existing Node.js + TypeScript + Express security lab.

## What CORS does

CORS is a browser mechanism that controls whether JavaScript running on one origin can read a response from another origin. An origin is the scheme + hostname + port.

Example:
- Frontend: `http://localhost:4200`
- Backend: `http://localhost:3000`

These are different origins because the ports differ.

CORS is not authentication, authorization, or a complete CSRF defense.

## 1. Install dependencies

From the project root:

```bash
npm install cors
npm install -D @types/cors
```

## 2. Configure environment

Add the frontend's exact origin to `.env`:

```env
APP_ORIGIN=http://localhost:4200
```

Change the port if your frontend uses another origin. Load dotenv before reading this variable.

## 3. Integrate into src/app.ts

Import:

```ts
import { corsMiddleware } from "./07-cors/cors.config.js";
```

Register it after `const app = express()` and before your routes:

```ts
app.use(corsMiddleware);
```

Keep it before the route registrations so it can also handle browser preflight requests.

## 4. Test

Follow `test-cases.md`.

## Security notes

- Never use an arbitrary reflected origin with credentials.
- Do not combine `Access-Control-Allow-Origin: *` with credentialed browser requests.
- CORS is enforced by browsers; curl and Postman do not enforce browser CORS.
- A request may reach the server even when browser JavaScript cannot read its response.
- Continue using authentication, authorization, input validation, and CSRF defenses on protected endpoints.
