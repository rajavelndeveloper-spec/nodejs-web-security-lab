import { Pool } from "pg";

console.log("DATABASE_URL loaded:", Boolean(process.env.DATABASE_URL));
if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL is not configured");
}
export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 5,
});
