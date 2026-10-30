# 13. Server-Side Request Forgery (SSRF)

## Overview

Server-Side Request Forgery (SSRF) is a security vulnerability that occurs when an attacker tricks a backend server into making HTTP requests to unintended destinations.

An attacker may attempt to access internal services, localhost endpoints, private network resources, or cloud metadata services through the vulnerable backend.

## Learning Objectives

- Understand SSRF and how it occurs.
- Identify risks from user-controlled URLs.
- Validate URLs using an allowlist.
- Understand URL protocols, hostnames, ports, and embedded credentials.
- Understand DNS-related SSRF risks.
- Understand how HTTP redirects can bypass basic URL validation.
- Learn SSRF prevention techniques in Node.js.

## 1. How SSRF Happens

Consider a backend API that fetches a URL supplied by the user.

```ts
app.get("/fetch-url", async (req, res) => {
  const url = req.query.url as string;

  const response = await fetch(url);
  const content = await response.text();

  res.send(content);
});
```

This code is vulnerable because it trusts the user-provided URL without validating the destination.

An attacker could attempt to make the server access internal resources.

**Important:** This is intentionally vulnerable example code. Do not use it in production.

## 2. Common SSRF Targets

| Target | Example | Potential risk |
|---|---|---|
| Localhost | `http://127.0.0.1:3000` | Access internal endpoints |
| Private network | `http://192.168.1.10` | Reach internal services |
| Cloud metadata | `http://169.254.169.254` | Potential exposure of cloud credentials |
| Internal API | Internal-only service URL | Access restricted operations |

These are examples of possible targets. Actual impact depends on the server's network access and configuration.

## 3. URL Validation Using an Allowlist

A safer application should restrict requests to approved destinations.

Example:

```ts
const ALLOWED_HOST = "images.example.com";

function validateImageUrl(input: unknown): URL | null {
  if (typeof input !== "string" || input.trim() === "") {
    return null;
  }

  let url: URL;

  try {
    url = new URL(input);
  } catch {
    return null;
  }

  if (url.protocol !== "https:") {
    return null;
  }

  if (url.hostname !== ALLOWED_HOST) {
    return null;
  }

  if (url.username !== "" || url.password !== "") {
    return null;
  }

  if (url.port !== "" && url.port !== "443") {
    return null;
  }

  return url;
}
```

This example checks:

- The input is a valid URL.
- The protocol is HTTPS.
- The hostname exactly matches the approved hostname.
- The URL does not contain embedded credentials.
- The port is either the default HTTPS port or explicitly `443`.

An allowlist is generally safer than trying to maintain a list of forbidden hostnames.

## 4. URL Validation Test Cases

| URL | Expected result | Reason |
|---|---|---|
| `https://images.example.com/photo.jpg` | Accept | Approved HTTPS destination |
| `http://images.example.com/photo.jpg` | Reject | HTTP is not allowed |
| `http://127.0.0.1:3000/admin` | Reject | Unapproved hostname and protocol |
| `https://images.example.com.attacker.com/photo.jpg` | Reject | Hostname does not match |
| `https://images.example.com:8080/photo.jpg` | Reject | Unapproved port |
| `https://user:pass@images.example.com/photo.jpg` | Reject | Embedded credentials |
| `not-a-valid-url` | Reject | Invalid URL format |

## 5. DNS and IP Address Validation

Validating a hostname alone is not sufficient.

A hostname may resolve to a private IP address, or its DNS response may change between validation and connection.

For stronger protection:

- Resolve and validate destination IP addresses.
- Reject loopback, private, link-local, and other restricted IP ranges.
- Handle both IPv4 and IPv6.
- Prevent DNS rebinding and validation-to-connection gaps.
- Apply outbound network restrictions.

For a strict allowlist, use trusted destinations and ensure the actual connection goes only to validated addresses.

## 6. Redirect Handling

HTTP redirects can create an SSRF risk when the original URL is approved but redirects to an unsafe destination.

### Automatic redirect handling

```ts
const response = await fetch(url);
```

Node.js `fetch()` follows redirects by default.

### Manual redirect handling

```ts
const response = await fetch(url, {
  redirect: "manual",
});
```

With manual handling, the application receives the redirect response rather than automatically following it.

Example output from the redirect exercise:

```text
--- Manual redirect handling ---
Status: 302
Location: https://example.com

--- Automatic redirect handling ---
Status: 200
Final URL: https://example.com/
```

For SSRF prevention, reject redirects unless the application has a safe way to validate every redirect destination before making another request.

## 7. SSRF Prevention Best Practices

- Avoid fetching arbitrary user-provided URLs.
- Prefer strict allowlists of approved hosts.
- Allow only necessary URL protocols and ports.
- Validate resolved IPv4 and IPv6 addresses.
- Disable automatic redirects or validate each destination.
- Apply outbound firewall and network restrictions.
- Set request timeouts and response-size limits.
- Do not return sensitive internal response data to users.
- Use least privilege for backend services.
- Log rejected requests without recording credentials or sensitive query parameters.

## 8. Limitations of Basic URL Validation

The URL-validation helper developed in this lesson is a starting point, not a complete SSRF defense.

Additional protections are required for:

- DNS resolution and DNS rebinding.
- Private and special-purpose IP address ranges.
- Redirect destinations.
- Symbolic network routing or proxy behavior.
- Request timeouts and excessive response sizes.
- Network-level restrictions.

## Conclusion

SSRF occurs when a backend server makes requests to destinations controlled or influenced by an attacker.

A strict URL allowlist, safe DNS/IP handling, redirect validation, and network restrictions help prevent SSRF. Security must be enforced at both the application and network levels.