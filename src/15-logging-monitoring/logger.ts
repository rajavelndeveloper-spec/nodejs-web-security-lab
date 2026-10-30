import winston from "winston";

// Create a logger to record application events, warnings, and errors.
const logger = winston.createLogger({
  // Set the minimum log level to "info".
  // The logger records info, warn, and error messages.
  // Debug messages are ignored because they are below this level.
  level: "info",

  // Combine multiple formatting options into one log format.
  format: winston.format.combine(
    // Add the current date and time to every log entry.
    // This helps us know exactly when an event happened.
    winston.format.timestamp(),

    // Convert each log entry into JSON format.
    // JSON makes logs easier for tools to read, search, and analyse.
    winston.format.json()
  ),

  // Define where the log messages should be stored or displayed.
  transports: [
    // Print log messages in the terminal.
    // Useful during development and debugging.
    new winston.transports.Console(),

    // Save log messages to logs/app.log.
    // This file stores info, warn, and error messages.
    new winston.transports.File({
      filename: "logs/app.log",
    }),

    // Save only error-level messages to logs/error.log.
    // This makes serious problems easier to find quickly.
    new winston.transports.File({
      filename: "logs/error.log",
      level: "error",
    }),
  ],
});

// Export the logger so other files can use the same logger.
export default logger;