# SQL Injection (SQLi)

## 1. Overview

SQL Injection (SQLi) is a web security vulnerability that occurs when an application inserts untrusted user input directly into an SQL query.

An attacker may manipulate the query's logic to bypass authentication, access unauthorized data, or modify database records.

**Technology stack:**
- Node.js
- TypeScript
- Express.js
- PostgreSQL
- Postman

## 2. Project Structure

```text
01-sql-injection/
├── README.md
├── schema.sql
├── db.ts
├── vulnerable.ts
├── secure.ts
└── test-cases.md
```

## 3. Vulnerability Demonstration

The vulnerable implementation builds an SQL query by concatenating user input.

```typescript
const sql = `
  SELECT id, username
  FROM demo_users
  WHERE username = '${username}'
    AND password = '${password}'
`;
```

### Why is this vulnerable?

The application treats user input as part of the SQL statement. A specially crafted input can change the query's intended logic.

Potential consequences include:
- Authentication bypass
- Unauthorized data access
- Unauthorized database modifications, depending on query permissions and implementation

## 4. Attack Scenario

A login request uses the following test input:

```json
{
  "username": "' OR '1'='1' -- ",
  "password": "wrong-password"
}
```

In the vulnerable query, the injected condition can make the WHERE clause true, allowing the login check to succeed without valid credentials.

In the secure implementation, the input is passed as a parameter and treated as a literal value.

## 5. Secure Implementation

The secure implementation uses PostgreSQL parameterized queries.

```typescript
const result = await pool.query(
  `SELECT id, username
   FROM demo_users
   WHERE username = $1 AND password = $2`,
  [username, password]
);
```

### Why is this secure against SQL injection?

- SQL instructions and user-supplied values are sent separately.
- Input cannot change the query's SQL structure.
- Malicious-looking strings are treated as data.

## 6. Additional Prevention Techniques

1. Use parameterized queries for database operations.
2. Validate input types, lengths, and expected formats.
3. Use a database account with only the permissions the application requires.
4. Avoid exposing raw database errors to clients.
5. Never rely on input validation alone to prevent SQL injection.
6. Use secure password hashing for authentication.

## 7. How to Test

Start the local application:

```bash
npm run dev
```

Use Postman to send POST requests with JSON bodies.

**Vulnerable endpoint**

`POST /api/sqli/vulnerable/login`

**Secure endpoint**

`POST /api/sqli/secure/login`

Compare the results using valid credentials, invalid credentials, malformed inputs, and the controlled SQL injection test.

## 8. Important Security Note

The vulnerable endpoint is intentionally insecure and exists only for local learning.

- Never deploy the vulnerable endpoint publicly.
- Use only dummy data and a dedicated test database.
- Disable the vulnerable route outside the local development environment.
- The secure example is an SQL injection prevention demonstration, not a complete production authentication implementation.

The demonstration uses plaintext passwords solely to isolate SQL injection behavior. Production applications must store password hashes using an appropriate password-hashing algorithm such as Argon2id or bcrypt.

## 9. Learning Outcomes

- Understood how SQL injection occurs.
- Reproduced an authentication-bypass scenario in a local POC.
- Compared vulnerable SQL construction with parameterized queries.
- Practiced input validation and safe database error handling.
- Learned why parameterized queries are the primary defense against SQL injection.
