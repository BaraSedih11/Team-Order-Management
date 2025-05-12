const orderController = require("../controllers/order.controller.js");
const express = require("express");
const router = express.Router();

// Create a new Order
router.post("/", orderController.createOrder);

// List All Orders for a Group (e.g., /groups/123/orders?uncompleted=true)
// This route structure implies that groupId will be part of the path
// So, the route should be defined in a way that captures groupId
// Let's adjust the controller and this route to be /groups/:groupId/orders
// For now, keeping it simple as /:groupId/orders as per controller expectation or adjust controller
// Assuming the base path for these order routes will be something like /api/orders
// and groupId will be passed in params for specific group orders.
// Let's assume a structure like /api/groups/:groupId/orders for listing orders of a group.
// The current controller `listOrdersForGroup` expects `req.params.groupId`.

// If routes are mounted under /api/orders, then this path would be /:groupId
// router.get("/:groupId", orderController.listOrdersForGroup);
// However, the prompt implies listing orders *for a group*. A more RESTful way:
// GET /api/groups/:groupId/orders
// This means this route file might be better named group.routes.js or part of it.
// For now, let's stick to the provided file structure and assume routes are mounted accordingly in app.js

// Let's make a dedicated route for listing orders of a specific group
// This will be mounted under a path like /api/groups/:groupId/orders in app.js
// Or, if this file is for general order operations, and group-specific ones are separate:
// For simplicity, let's assume this route file handles general order creation and group-specific listing
// The controller `listOrdersForGroup` expects `req.params.groupId`.
// So the route should be structured like router.get("/group/:groupId", orderController.listOrdersForGroup);

router.get("/group/:groupId", orderController.listOrdersForGroup);

module.exports = router;
