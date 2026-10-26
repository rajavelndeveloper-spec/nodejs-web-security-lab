# CSRF Test Cases

| ID | Test | Expected result |
|---|---|---|
| CSRF-01 | Request `/csrf-token` without JWT | `401 Unauthorized` |
| CSRF-02 | Request `/csrf-token` with trusted Origin and valid JWT | `200 OK` with `csrfToken` |
| CSRF-03 | Request `/csrf-token` with untrusted or missing Origin | `403 Forbidden` |
| CSRF-04 | POST transfer with valid JWT, trusted Origin, and valid CSRF token | `200 OK` |
| CSRF-05 | POST transfer without `X-CSRF-Token` | `403 Forbidden` |
| CSRF-06 | POST transfer with incorrect token | `403 Forbidden` |
| CSRF-07 | POST transfer with untrusted Origin | `403 Forbidden` |
| CSRF-08 | POST transfer with invalid JWT | `401 Unauthorized` |
| CSRF-09 | Invalid amount (zero, negative, non-numeric) | `400 Bad Request` |

## Manual checks

- Use dummy data only.
- Keep the vulnerable POC disabled in production.
- Confirm the frontend origin exactly matches `APP_ORIGIN`.
- Restarting the server clears demo CSRF tokens because they are stored in memory.
