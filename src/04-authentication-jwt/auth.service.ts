
import argon2 from "argon2";
import { pool } from "./db.js";
import { createAccessToken } from "./jwt.js";

export async function registerUser(
  email: string,
  password: string
) {
  const normalizedEmail = email.trim().toLowerCase();

  const passwordHash = await argon2.hash(password, {
    type: argon2.argon2id,
  });

  try {
    const result = await pool.query(
      `INSERT INTO app_users (email, password_hash)
       VALUES ($1, $2)
       RETURNING id, email`,
      [normalizedEmail, passwordHash]
    );

    return result.rows[0] as {
      id: string;
      email: string;
    };
  } catch (error: unknown) {
    if (
      typeof error === "object" &&
      error !== null &&
      "code" in error &&
      error.code === "23505"
    ) {
      throw new Error("EMAIL_ALREADY_EXISTS");
    }

    throw error;
  }
}

export async function loginUser(
  email: string,
  password: string
) {
  const normalizedEmail = email.trim().toLowerCase();

  const result = await pool.query(
    `SELECT id, email, password_hash
     FROM app_users
     WHERE email = $1`,
    [normalizedEmail]
  );

  const user = result.rows[0];

  if (!user) {
    return null;
  }

  const passwordMatches = await argon2.verify(
    user.password_hash,
    password
  );

  if (!passwordMatches) {
    return null;
  }

  const accessToken = createAccessToken(String(user.id));

  return {
    accessToken,
    user: {
      id: String(user.id),
      email: user.email as string,
    },
  };
}
