
import {
  createHash,
  randomBytes,
  randomUUID,
} from "node:crypto";
import { pool } from "./db.js";
import { createAccessToken } from "./jwt.js";

const REFRESH_TTL_MS = 7 * 24 * 60 * 60 * 1000;

function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

function generateToken(): string {
  return randomBytes(32).toString("base64url");
}

export async function createRefreshSession(userId: string) {
  const token = generateToken();
  const tokenHash = hashToken(token);
  const sessionId = randomUUID();
  const familyId = randomUUID();
  const expiresAt = new Date(Date.now() + REFRESH_TTL_MS);

  await pool.query(
    `INSERT INTO refresh_sessions
       (id, user_id, token_hash, family_id, expires_at)
     VALUES ($1, $2, $3, $4, $5)`,
    [sessionId, userId, tokenHash, familyId, expiresAt]
  );

  return { token, expiresAt };
}

export async function rotateRefreshToken(token: string) {
  const client = await pool.connect();
  const oldHash = hashToken(token);

  try {
    await client.query("BEGIN");

    const result = await client.query(
      `SELECT id, user_id, family_id, expires_at, revoked_at
       FROM refresh_sessions
       WHERE token_hash = $1
       FOR UPDATE`,
      [oldHash]
    );

    const session = result.rows[0];

    if (!session) {
      await client.query("ROLLBACK");
      return null;
    }

    if (session.revoked_at) {
      await client.query(
        `UPDATE refresh_sessions
         SET revoked_at = COALESCE(revoked_at, NOW())
         WHERE family_id = $1`,
        [session.family_id]
      );

      await client.query("COMMIT");
      return null;
    }

    if (new Date(session.expires_at).getTime() <= Date.now()) {
      await client.query(
        `UPDATE refresh_sessions
         SET revoked_at = NOW()
         WHERE id = $1`,
        [session.id]
      );

      await client.query("COMMIT");
      return null;
    }

    const newToken = generateToken();
    const newHash = hashToken(newToken);
    const newId = randomUUID();
    const expiresAt = new Date(Date.now() + REFRESH_TTL_MS);

    await client.query(
      `UPDATE refresh_sessions
       SET revoked_at = NOW()
       WHERE id = $1`,
      [session.id]
    );

    await client.query(
      `INSERT INTO refresh_sessions
         (id, user_id, token_hash, family_id, expires_at)
       VALUES ($1, $2, $3, $4, $5)`,
      [
        newId,
        session.user_id,
        newHash,
        session.family_id,
        expiresAt,
      ]
    );

    await client.query("COMMIT");

    return {
      token: newToken,
      expiresAt,
      accessToken: createAccessToken(String(session.user_id)),
    };
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

export async function revokeRefreshToken(token: string) {
  await pool.query(
    `UPDATE refresh_sessions
     SET revoked_at = COALESCE(revoked_at, NOW())
     WHERE token_hash = $1`,
    [hashToken(token)]
  );
}
