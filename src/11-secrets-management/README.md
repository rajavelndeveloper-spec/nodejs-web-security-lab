# Lesson 11 — Secrets Management

## What is Secrets Management?

Secrets management is the process of securely storing and handling sensitive information used by an application.

### Examples of Secrets
- Database passwords
- JWT secrets
- API keys
- Session secrets
- Third-party service credentials

## Why is it important?
- Prevents attackers from accessing sensitive credentials.
- Avoids exposing secrets in source code or GitHub repositories.
- Reduces the risk of unauthorized access to databases and APIs.

## Best Practices

1. **Never hardcode secrets** in source code.
2. Store local development secrets in a `.env` file.
3. Add `.env` to `.gitignore` to prevent accidental commits.
4. Use `process.env` to access environment variables in Node.js.
5. Validate that required secrets exist before starting the application.
6. Use strong, randomly generated secrets.
7. Never print secrets in logs or share them publicly.
8. Rotate secrets immediately if they are exposed.
9. Use a dedicated secrets manager for production applications when appropriate.

## Example

**`.env`**
```env
JWT_ACCESS_SECRET=your_generated_secret
```

**TypeScript**
```ts
const jwtSecret = process.env.JWT_ACCESS_SECRET;

if (!jwtSecret) {
  throw new Error("JWT secret is missing");
}
```

## Important Points

- `.env` files are useful for local development but are not a complete production secrets-management solution.
- `.gitignore` prevents new accidental tracking; it does not remove secrets already committed to Git.
- If a secret is exposed, rotate it. Deleting it from the source code alone is not enough.
- Never expose backend secrets in frontend code, browser responses, or public repositories.

**Remember:** Secrets should be stored securely, accessed only when needed, and never exposed to unauthorized people.