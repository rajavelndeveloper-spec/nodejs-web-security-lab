
const ALLOWED_HOST = "images.example.com";

type ValidationResult =
  | { ok: true; url: URL }
  | { ok: false; reason: string };

function validateImageUrl(input: unknown): ValidationResult {
  // 1. Validate the input type and check for empty values.
  // WHAT IT DOES:
  // Ensures the user provides a non-empty string before parsing it.
  // WHAT IT PREVENTS:
  // Avoids processing missing, empty, or unexpected input types.
  // SECURITY BENEFIT:
  // This is basic input validation, not a complete SSRF defence.
  if (typeof input !== "string" || input.trim() === "") {
    return { ok: false, reason: "URL must be a non-empty string" };
  }

  let url: URL;

  // 2. Parse the supplied string as a URL.
  // WHAT IT DOES:
  // Converts the input into a URL object so we can inspect its
  // protocol, hostname, port, username, and password separately.
  // WHAT IT PREVENTS:
  // Rejects malformed URLs that cannot be parsed.
  // SECURITY BENEFIT:
  // Structured parsing is safer than checking URLs with simple
  // string matching, which can be fooled by misleading URL formats.
  try {
    url = new URL(input);
    console.log(url,"url")
  } catch {
    return { ok: false, reason: "Invalid URL format" };
  }

  // 3. Allow HTTPS only.
  // WHAT IT DOES:
  // Requires the URL to use HTTPS instead of HTTP or another protocol.
  // WHAT IT PREVENTS:
  // Blocks requests using unencrypted HTTP and protocols such as
  // file:// that could otherwise be dangerous if accepted.
  // SECURITY BENEFIT:
  // HTTPS protects data while it travels between the server and
  // the destination. It does NOT, by itself, prevent SSRF.
  if (url.protocol !== "https:") {
    return { ok: false, reason: "Only HTTPS URLs are allowed" };
  }

  // 4. Allow only the exact approved hostname.
  // WHAT IT DOES:
  // Accepts requests only for images.example.com.
  // WHAT IT PREVENTS:
  // Blocks requests to localhost, private IP addresses, cloud metadata
  // endpoints, and attacker-controlled domains that use a different
  // hostname.
  // SECURITY BENEFIT:
  // This is the main destination allowlist check in this example.
  // Exact comparison also rejects lookalike hosts such as
  // images.example.com.attacker.com.
  if (url.hostname !== ALLOWED_HOST) {
    return { ok: false, reason: "Hostname is not allowed" };
  }

  // 5. Reject usernames and passwords embedded in the URL.
  // WHAT IT DOES:
  // Rejects URLs containing credentials before the hostname, such as
  // https://user:password@images.example.com/photo.jpg.
  // WHAT IT PREVENTS:
  // Reduces misleading URLs and avoids accepting credentials embedded
  // in a URL, which can expose secrets in logs or other systems.
  // SECURITY BENEFIT:
  // Makes the destination less ambiguous. This check is not a
  // substitute for hostname validation.
  if (url.username !== "" || url.password !== "") {
    return { ok: false, reason: "Credentials in URLs are not allowed" };
  }

  // 6. Allow only the standard HTTPS port.
  // WHAT IT DOES:
  // Accepts the default HTTPS port or an explicitly specified port 443.
  // WHAT IT PREVENTS:
  // Blocks requests to other ports, such as 8080, where an unexpected
  // service might be listening on the approved host.
  // SECURITY BENEFIT:
  // Reduces the destinations and services the application can reach.
  // Note: URL normalisation may turn an explicit :443 into an empty
  // url.port, so both "" and "443" are accepted.
  if (url.port !== "" && url.port !== "443") {
    return { ok: false, reason: "Port is not allowed" };
  }

  // 7. All checks passed.
  // WHAT IT DOES:
  // Returns the parsed URL so the caller can use the validated result.
  // IMPORTANT:
  // Validation alone does not make the eventual network request safe.
  // The caller must use this URL, enforce redirect restrictions,
  // check DNS/IP resolution, and apply network-level protections.
  return { ok: true, url };
}

// Test cases: a mixture of allowed and rejected URLs.
const testUrls: unknown[] = [
  "https://images.example.com/photo.jpg",          // Expected: accepted
  "http://images.example.com/photo.jpg",            // Rejected: HTTP
  "http://127.0.0.1:3000/admin",                    // Rejected: HTTP and hostname
  "https://images.example.com.attacker.com/photo.jpg", // Rejected: lookalike hostname
  "https://images.example.com:8080/photo.jpg",      // Rejected: unapproved port
  "not-a-valid-url",                                // Rejected: invalid URL
  "https://user:pass@images.example.com/photo.jpg", // Rejected: embedded credentials
];

for (const input of testUrls) {
  const result = validateImageUrl(input);

  console.log({
    input,
    valid: result.ok,
    message: result.ok ? "URL accepted" : result.reason,
  });
}
