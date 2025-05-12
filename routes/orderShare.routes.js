const orderShareController = require("../controllers/orderShare.controller.js");
const express = require("express");
const router = express.Router();

// List Order Shares for a Group (e.g., /api/groups/123/order-shares?payment_status=pending)
router.get("/group/:groupId", orderShareController.listOrderSharesForGroup);

// Update Payment Status for an Order Share
router.patch("/:id/payment-status", orderShareController.updatePaymentStatus);

module.exports = router;
