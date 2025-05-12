// Centralized error handling middleware
const errorHandler = (err, req, res, next) => {
  console.error("ERROR STACK:", err.stack);

  // Default error status and message
  let statusCode = err.statusCode || 500;
  let message = err.message || "Internal Server Error";

  // Handle Sequelize validation errors
  if (
    err.name === "SequelizeValidationError" ||
    err.name === "SequelizeUniqueConstraintError"
  ) {
    statusCode = 400; // Bad Request
    message = err.errors.map((e) => e.message).join(", ");
  }

  // Handle Sequelize foreign key constraint errors
  if (err.name === "SequelizeForeignKeyConstraintError") {
    statusCode = 400; // Bad Request
    // message = `Foreign key constraint error on field: ${err.fields.join(", ")}`;
    // Provide a more generic message for FK errors to avoid exposing too much detail
    message =
      "A related resource could not be found or a constraint was violated.";
  }

  // Handle cases where an item is not found (e.g., findByPk returns null)
  // This should ideally be handled in controllers with a 404, but this is a fallback.
  if (err.message.toLowerCase().includes("not found")) {
    statusCode = 404;
  }

  res.status(statusCode).json({
    success: false,
    status: statusCode,
    message: message,
    // Optionally include stack trace in development
    stack: process.env.NODE_ENV === "development" ? err.stack : undefined,
  });
};

module.exports = errorHandler;
