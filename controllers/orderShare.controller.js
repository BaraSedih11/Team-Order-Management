const db = require("../models");
const OrderShare = db.OrderShare;
const Order = db.Order;
const { Op } = require("sequelize");

// List Order Shares for a Group — Optional filter: payment_status = "pending" or "paid"
exports.listOrderSharesForGroup = async (req, res, next) => {
  try {
    const { groupId } = req.params;
    const { payment_status } = req.query;

    const validStatuses = ["pending", "paid"];
    const whereConditions = {};

    // Apply filter only if status is valid
    if (validStatuses.includes(payment_status)) {
      whereConditions.payment_status = payment_status;
    }

    const includeOptions = [
      {
        model: Order,
        as: "order",
        attributes: [], // Only used for filtering by GROUP_id
        where: { GROUP_id: groupId },
        required: true,
      },
      {
        model: db.User,
        as: "user",
        attributes: ["id", "username"],
      },
    ];

    const orderShares = await OrderShare.findAll({
      where: whereConditions,
      include: includeOptions,
      attributes: [
        "id",
        "ORDER_id",
        "USER_id",
        "share_amount",
        "payment_status",
        "paid_at",
      ],
      order: [["id", "ASC"]],
    });

    res.status(200).send(orderShares);
  } catch (error) {
    next(error);
  }
};

// Update Payment Status for an Order Share
exports.updatePaymentStatus = async (req, res, next) => {
  const transaction = await db.sequelize.transaction();
  try {
    const { id } = req.params;
    const { payment_status } = req.body;

    // Validate payment status
    const validStatuses = ["pending", "paid"];
    if (!validStatuses.includes(payment_status)) {
      await transaction.rollback();
      return res.status(400).send({
        message: "Invalid payment status. Must be 'pending' or 'paid'.",
      });
    }

    // Find the order share
    const orderShare = await OrderShare.findByPk(id, { transaction });
    if (!orderShare) {
      await transaction.rollback();
      return res
        .status(404)
        .send({ message: `Order share with id=${id} not found.` });
    }

    // Update the payment status and paid_at timestamp if needed
    const updates = {
      payment_status,
      paid_at: payment_status === "paid" ? new Date() : null,
    };

    await orderShare.update(updates, { transaction });
    await transaction.commit();

    res.status(200).send({
      id: orderShare.id,
      ORDER_id: orderShare.ORDER_id,
      USER_id: orderShare.USER_id,
      share_amount: orderShare.share_amount,
      payment_status: orderShare.payment_status,
      paid_at: orderShare.paid_at,
    });
  } catch (error) {
    if (
      transaction &&
      transaction.finished !== "commit" &&
      transaction.finished !== "rollback"
    ) {
      await transaction.rollback();
    }
    next(error);
  }
};
