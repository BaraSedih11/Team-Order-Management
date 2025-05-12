// Helper functions for the application

// Example helper function (can be expanded as needed)
const generateUniqueId = () => {
  // Basic unique ID generator (for example purposes, consider UUID for production)
  return Date.now().toString(36) + Math.random().toString(36).substring(2);
};

// Function to format API responses consistently (optional)
const formatResponse = (res, statusCode, data, message = "Success") => {
  return res.status(statusCode).json({
    success: statusCode >= 200 && statusCode < 300,
    status: statusCode,
    message: message,
    data: data
  });
};

module.exports = {
  generateUniqueId,
  formatResponse
};
