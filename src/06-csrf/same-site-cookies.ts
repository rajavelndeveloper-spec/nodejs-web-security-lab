/**
 * Example cookie options for the refresh-token cookie in auth.routes.ts.
 *
 * Use the same path/domain attributes when clearing the cookie.
 * Do not use a Domain attribute unless the deployment specifically needs it.
 */
export const refreshCookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "strict" as const,
  path: "/api/auth",
};

/**
 * Example usage:
 *
 * res.cookie("refreshToken", refreshToken, {
 *   ...refreshCookieOptions,
 *   maxAge: 7 * 24 * 60 * 60 * 1000,
 * });
 *
 * On logout:
 * res.clearCookie("refreshToken", refreshCookieOptions);
 *
 * SameSite:
 * - "strict": strongest cross-site restriction; may affect some navigation flows.
 * - "lax": allows cookies on same-site requests and certain top-level safe navigations.
 * - "none": permits cross-site cookie use and requires Secure.
 *
 * HttpOnly prevents JavaScript from reading the cookie; it does not alone stop CSRF.
 */
