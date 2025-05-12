const express = require("express");
const dotenv = require("dotenv");
dotenv.config(); // Load environment variables from .env file

const db = require("./models"); // Imports Sequelize instance and models
const errorHandler = require("./middleware/errorHandler");

// Import routes
const orderRoutes = require("./routes/order.routes");
const orderShareRoutes = require("./routes/orderShare.routes");
// Potentially, routes for users and groups if CRUD operations for them are needed directly
// const userRoutes = require("./routes/user.routes");
// const groupRoutes = require("./routes/group.routes");

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
db.sequelize.sync()
  .then(() => {
    console.log("Synced db.");
    // Optionally, run seeders after sync if it's the first time or for development
    if (process.env.NODE_ENV === 'development' && process.env.SEED_DB === 'true') {
      const seedMockData = require('./seeders/mockData');
      console.log("Attempting to seed database...");
      seedMockData().catch(err => console.error("Seeding failed:", err));
    }
  })
  .catch((err) => {
    console.log("Failed to sync db: " + err.message);
  });

// Simple route for testing server
app.get("/", (req, res) => {
  res.json({ message: "Welcome to the Order Management API." });
});

// API Routes
// The user request implies specific routes for orders and order shares related to groups.
// Example: List Order Shares for a Group -> GET /api/groups/:groupId/order-shares
// Example: List All Orders for a Group -> GET /api/groups/:groupId/orders
// Example: Create Order -> POST /api/orders (GROUP_id in body)

app.use("/api/orders", orderRoutes); // For creating orders, and potentially listing specific order by its own ID

// For routes that are specific to a group, it's common to nest them:
// e.g., /api/groups/:groupId/orders and /api/groups/:groupId/order-shares
// The current route files (order.routes.js, orderShare.routes.js) expect :groupId in params for listing.
// So we can mount them like this, or adjust the routes within those files.

// Let's adjust the mounting to make the paths more explicit as per common REST patterns
// and align with how controllers expect groupId from params.

// For listing orders of a group: GET /api/groups/:groupId/orders
// The order.routes.js has: router.get("/group/:groupId", orderController.listOrdersForGroup);
// So if we mount orderRoutes under /api/orders, the path becomes /api/orders/group/:groupId

// For listing order shares of a group: GET /api/groups/:groupId/order-shares
// The orderShare.routes.js has: router.get("/group/:groupId", orderShareController.listOrderSharesForGroup);
// So if we mount orderShareRoutes under /api/order-shares, path becomes /api/order-shares/group/:groupId
app.use("/api/order-shares", orderShareRoutes);

// If we want /api/groups/:groupId/orders, we might need a group route file that then uses orderController.
// For now, the current setup will result in:
// POST /api/orders  (Create Order)
// GET  /api/orders/group/:groupId (List orders for a group)
// GET  /api/order-shares/group/:groupId (List order shares for a group)

// --- User and Group routes (Optional, as per user prompt "You can create endpoints or actions for users freely") ---
// For full CRUD on users and groups if needed for testing or administration
// const userRoutes = express.Router(); // Define in routes/user.routes.js
// const groupRoutes = express.Router(); // Define in routes/group.routes.js
// app.use("/api/users", userRoutes);
// app.use("/api/groups", groupRoutes);

// Global error handler - should be the last middleware
app.use(errorHandler);

const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}.`);
});

module.exports = app; // For potential testing
