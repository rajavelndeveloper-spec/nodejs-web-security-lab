import jwt, { type JwtPayload } from "jsonwebtoken";

function getJwtSecret(): string {
  const value = process.env.JWT_ACCESS_SECRET;

  if (!value || value.length < 32) {
    throw new Error(
      "JWT_ACCESS_SECRET must be configured with a strong secret"
    );
  }

  return value;
}

const secret: string = getJwtSecret();

export interface AccessTokenClaims extends JwtPayload {
  sub: string;
}

export function createAccessToken(userId: string): string {
  return jwt.sign(
    { sub: userId },
    secret,
    {
      algorithm: "HS256",
      expiresIn: "15m",
      issuer: "nodejs-web-security-lab",
      audience: "security-lab-api",
    }
  );
}

export function verifyAccessToken(
  token: string
): AccessTokenClaims {
  const payload = jwt.verify(token, secret, {
    algorithms: ["HS256"],
    issuer: "nodejs-web-security-lab",
    audience: "security-lab-api",
  });

  if (
    typeof payload === "string" ||
    typeof payload.sub !== "string"
  ) {
    throw new Error("Invalid token payload");
  }

  return payload as AccessTokenClaims;
}