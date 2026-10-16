# SQL Injection — Test Cases

## 1. Objective

Verify that the vulnerable endpoint demonstrates SQL injection and that the secure endpoint prevents the same injection attempt.

**Environment:** Local development only  
**Tool:** Postman  
**Database:** Dedicated PostgreSQL security_lab database

## 2. Test Configuration

| Item | Value |
|---|---|
| Vulnerable endpoint | POST /api/sqli/vulnerable/login |
| Secure endpoint | POST /api/sqli/secure/login |
| Content-Type | application/json |
| Test account | admin |
| Valid test password | demo-admin-password |

## 3. Test Cases

### TC-01: Valid Credentials

**Input**

```json
{
  "username": "admin",
  "password": "demo-admin-password"
}
```

Expected result:
- HTTP 200
- `authenticated: true`
- A matching user is returned.

Applicable endpoint: Both.

### TC-02: Invalid Password

**Input**

```json
{
  "username": "admin",
  "password": "wrong-password"
}
```

Expected result:
- HTTP 200
- `authenticated: false`
- No authenticated user is returned.

Applicable endpoint: Both.

### TC-03: SQL Injection Authentication Bypass

**Input**

```json
{
  "username": "' OR '1'='1' -- ",
  "password": "wrong-password"
}
```

Expected result:

- Vulnerable endpoint: `authenticated: true`, demonstrating the injection.
- Secure endpoint: `authenticated: false`, because the input is treated as a parameter value.

### TC-04: SQL-Like Input Treated as Data

**Input**

```json
{
  "username": "admin' OR '1'='1",
  "password": "wrong-password"
}
```

Expected result:
- Secure endpoint returns `authenticated: false`.
- No SQL condition is injected into the query.

### TC-05: Missing Username

**Input**

```json
{
  "password": "wrong-password"
}
```

Expected result:
- HTTP 400
- `{"message":"Invalid input"}`

Applicable endpoint: Both.

### TC-06: Invalid Input Types

**Input**

```json
{
  "username": 123,
  "password": true
}
```

Expected result:
- HTTP 400
- Invalid input is rejected before querying PostgreSQL.

Applicable endpoint: Both.

### TC-07: Vulnerable Route Disabled

Set:

```dotenv
ENABLE_VULNERABLE_POC=false
```

Expected result:
- Vulnerable endpoint returns HTTP 404.

Repeat with:

```dotenv
NODE_ENV=production
ENABLE_VULNERABLE_POC=true
```

Expected result:
- Vulnerable endpoint still returns HTTP 404.

Restart the application after changing environment variables.

## 4. Test Results

Update the status column after running each test.

| Test ID | Scenario | Expected result | Actual result |
|---|---|---|---|
| TC-01 | Valid credentials | Login succeeds | Pending |
| TC-02 | Invalid password | Login fails | Pending |
| TC-03 | Injection attempt | Vulnerable succeeds; secure fails | Pending |
| TC-04 | SQL-like input | Secure query remains safe | Pending |
| TC-05 | Missing username | HTTP 400 | Pending |
| TC-06 | Invalid input types | HTTP 400 | Pending |
| TC-07 | Vulnerable route disabled | HTTP 404 | Pending |

Replace `Pending` with `Pass` or `Fail` based on your actual observations. Record unexpected results separately.

## 5. Conclusion

Parameterized SQL queries prevent the demonstrated SQL injection by separating query instructions from user-supplied values.

Input validation improves robustness, but it does not replace parameterized queries.

**Status:** Update after completing all test cases.
