
import logger from "./logger.js";

logger.info("Application started");

logger.warn("Failed login attempt", {
  userId: 42,
  reason: "Invalid credentials",
});

logger.error("Database connection failed", {
  errorCode: "ECONNREFUSED",
});

// 1. Successful login
logger.info("User logged in successfully", {
  userId: 101,
});

// 2. Suspicious login attempt
logger.warn("Suspicious login attempt detected", {
  userId: 202,
  ip: "192.168.1.50",
});

// 3. API failure
logger.error("API request failed", {
  endpoint: "/api/users",
  statusCode: 500,
});


async function fetchUsers() {
  try {
    // Simulate a database connection failure
    throw Object.assign(
      new Error("Database connection refused"),
      { code: "ECONNREFUSED" }
    );
  } catch (error: unknown) {
    const err = error as NodeJS.ErrnoException;

    logger.error("Failed to fetch users", {
      operation: "fetchUsers",
      errorCode: err.code ?? "UNKNOWN",
    });
  }
}

fetchUsers();
