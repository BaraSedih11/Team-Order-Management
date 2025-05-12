const express = require("express");
const dotenv = require("dotenv");
dotenv.config();

const db = require("./models");
const errorHandler = require("./middleware/errorHandler");

// Import routes
const orderRoutes = require("./routes/order.routes");
const orderShareRoutes = require("./routes/orderShare.routes");

const app = express();

// Middleware to parse JSON bodies
app.use(express.json());
// Middleware to parse URL-encoded bodies
app.use(express.urlencoded({ extended: true }));

// Database synchronization
// In development, you might use { alter: true } or { force: true } to update/recreate tables.
// For production, migrations are preferred.
// The schema was provided, so we assume tables are created as per schema.
// `db.sequelize.sync()` will create tables if they don't exist based on model definitions.
// If your tables are already created by MySQL Workbench Forward Engineering, you might not need sync,
// or use it carefully (e.g., without force/alter options initially).
db.sequelize
  .sync()
  .then(() => {
    console.log("Synced db.");
    // Optionally, run seeders after sync if it's the first time or for development
    if (
      process.env.NODE_ENV === "development" &&
      process.env.SEED_DB === "true"
    ) {
      const seedMockData = require("./seeders/mockData");
      console.log("Attempting to seed database...");
      seedMockData().catch((err) => console.error("Seeding failed:", err));
    }
  })
  .catch((err) => {
    console.log("Failed to sync db: " + err.message);
  });

// Simple route for testing server
app.get("/api", (req, res) => {
  res.json({ message: "Welcome to the Order Management API." });
});

// API Routes
app.use("/api/orders", orderRoutes); // For creating orders, and potentially listing specific order by its own ID
app.use("/api/order-shares", orderShareRoutes);

// Global error handler - should be the last middleware
app.use(errorHandler);

const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}.`);
});

module.exports = app;
