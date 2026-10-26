# CORS Quick Notes

- Origin = protocol + hostname + port.
- `localhost:4200` and `localhost:3000` are different origins.
- `origin` defines which browser origin may read the response.
- `credentials: true` enables credentialed CORS responses; browser fetch must also use `credentials: "include"` for cookies.
- `allowedHeaders` must include custom headers such as `Authorization` and `X-CSRF-Token`.
- CORS does not authenticate users and does not replace CSRF protection.
- Avoid wildcard origins for credentialed APIs.
