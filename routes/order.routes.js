const orderController = require("../controllers/order.controller.js");
const express = require("express");
const router = express.Router();

router.post("/", orderController.createOrder);
router.get("/group/:groupId", orderController.listOrdersForGroup);

module.exports = router;
