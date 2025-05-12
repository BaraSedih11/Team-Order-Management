const db = require("../models");
const OrderShare = db.OrderShare;
const Order = db.Order;
const { Op } = require("sequelize");

// List Order Shares for a Group — Optional filter: payment_status = "pending"
exports.listOrderSharesForGroup = async (req, res, next) => {
  try {
    const { groupId } = req.params;
    const { payment_status } = req.query;

    const includeOptions = [
      {
        model: Order,
        as: "order",
        attributes: [], // We only need it for filtering by GROUP_id
        where: { GROUP_id: groupId },
        required: true // Ensures we only get shares related to the specified group
      },
      {
        model: db.User,
        as: "user",
        attributes: ["id", "username"]
      }
    ];

    const whereConditions = {};
    if (payment_status === "pending") {
      whereConditions.payment_status = "pending";
    }

    const orderShares = await OrderShare.findAll({
      where: whereConditions,
      include: includeOptions,
      attributes: ["id", "ORDER_id", "USER_id", "share_amount", "payment_status", "paid_at"],
      order: [["id", "ASC"]]
    });

    res.status(200).send(orderShares);
  } catch (error) {
    next(error);
  }
};
