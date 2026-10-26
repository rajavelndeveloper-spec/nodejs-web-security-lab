# CORS Test Cases

Assumptions:
- API: `http://localhost:3000`
- Trusted frontend: `http://localhost:4200`
- Untrusted origin: `http://evil.example`

## Test 1 — Trusted origin

```bash
curl -i http://localhost:3000/api/auth/me \
  -H "Origin: http://localhost:4200"
```

Expected: response includes:

```http
Access-Control-Allow-Origin: http://localhost:4200
```

The endpoint may still return `401` because this test doesn't provide a JWT. That is expected; CORS and authentication are separate.

## Test 2 — Untrusted origin

```bash
curl -i http://localhost:3000/api/auth/me \
  -H "Origin: http://evil.example"
```

Expected: no CORS permission is granted to `http://evil.example`. The server may still process the request; curl does not enforce browser CORS.

## Test 3 — Preflight

```bash
curl -i -X OPTIONS http://localhost:3000/api/csrf/secure/transfer \
  -H "Origin: http://localhost:4200" \
  -H "Access-Control-Request-Method: POST" \
  -H "Access-Control-Request-Headers: content-type,x-csrf-token"
```

Expected: the preflight response allows the configured origin, POST method, and requested headers.

## Test 4 — Credentials

For cookie-authenticated requests, browser frontend code typically needs:

```ts
fetch("http://localhost:3000/api/auth/refresh", {
  method: "POST",
  credentials: "include",
  headers: { "Content-Type": "application/json" },
});
```

The server must use an explicit allowed origin and `credentials: true`. Cookie SameSite rules and CSRF protection still apply.

## Checklist

- [ ] `APP_ORIGIN` matches the frontend origin exactly.
- [ ] CORS middleware is registered before routes.
- [ ] Trusted origin response includes `Access-Control-Allow-Origin`.
- [ ] Untrusted origin does not receive CORS permission.
- [ ] Preflight allows only configured methods and headers.
- [ ] Authentication and CSRF protections remain enabled.
