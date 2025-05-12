const orderShareController = require("../controllers/orderShare.controller.js");
const express = require("express");
const router = express.Router();

// List Order Shares for a Group (e.g., /api/groups/123/order-shares?payment_status=pending)
// This implies that groupId will be part of the path.
// The controller `listOrderSharesForGroup` expects `req.params.groupId`.
// So the route should be structured like router.get("/group/:groupId", orderShareController.listOrderSharesForGroup);
// This will be mounted under a path like /api/groups/:groupId/order-shares in app.js or similar.
// For now, keeping it consistent with the controller.

router.get("/group/:groupId", orderShareController.listOrderSharesForGroup);

// Future: Add routes for updating an order share (e.g., marking as paid)
// router.put("/:shareId", orderShareController.updateOrderShare);

module.exports = router;
