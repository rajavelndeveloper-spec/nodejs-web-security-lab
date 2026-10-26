/**
 * Reference examples for frontend calls.
 * These examples are not imported by the Express server.
 */

// JWT supplied explicitly by frontend code.
export function getCurrentUser(accessToken: string) {
  return fetch("http://localhost:3000/api/auth/me", {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });
}

// Browser sends eligible cookies because credentials is set to "include".
// Server-side Origin validation and CSRF protection are still required.
export function refreshSession() {
  return fetch("http://localhost:3000/api/auth/refresh", {
    method: "POST",
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
    },
  });
}
