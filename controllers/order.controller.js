const db = require("../models");
const { Op } = require("sequelize");
const Order = db.Order;
const OrderShare = db.OrderShare;
const User = db.User; // Needed for creating order shares
const Group = db.Group; // Needed for validating group existence

// Create a new Order with its OrderShares
exports.createOrder = async (req, res, next) => {
  const transaction = await db.sequelize.transaction();
  try {
    const { GROUP_id, created_by_user_id, total_amount, shares } = req.body;

    // Validate required fields
    if (
      !GROUP_id ||
      !created_by_user_id ||
      !shares ||
      !Array.isArray(shares) ||
      shares.length === 0
    ) {
      return res.status(400).send({
        message:
          "GROUP_id, created_by_user_id, and a non-empty array of shares are required.",
      });
    }

    // Optional: Validate if GROUP_id and created_by_user_id exist
    const groupExists = await Group.findByPk(GROUP_id, { transaction });
    if (!groupExists) {
      await transaction.rollback();
      return res
        .status(404)
        .send({ message: `Group with id=${GROUP_id} not found.` });
    }
    const userExists = await User.findByPk(created_by_user_id, { transaction });
    if (!userExists) {
      await transaction.rollback();
      return res
        .status(404)
        .send({ message: `User with id=${created_by_user_id} not found.` });
    }

    const orderId = Date.now(); // Placeholder for a proper ID generation strategy

    const order = await Order.create(
      {
        id: orderId, // This needs to be unique for the composite PK
        GROUP_id,
        created_by_user_id,
        total_amount,
        created_at: new Date(),
      },
      { transaction }
    );

    let calculatedTotalAmount = 0;
    const orderSharesPromises = shares.map(async (share) => {
      if (!share.USER_id || share.share_amount === undefined) {
        throw new Error("Each share must have a USER_id and share_amount.");
      }
      // Optional: Validate share.USER_id exists
      const shareUserExists = await User.findByPk(share.USER_id, {
        transaction,
      });
      if (!shareUserExists) {
        throw new Error(
          `User with id=${share.USER_id} for an order share not found.`
        );
      }

      calculatedTotalAmount += parseFloat(share.share_amount);

      // Generate a unique ID for the order share.
      const orderShareId = Date.now() + Math.random(); // Placeholder, ensure uniqueness

      return OrderShare.create(
        {
          id: orderShareId, // This needs to be unique for the composite PK
          ORDER_id: order.id, // Use the ID of the newly created order
          USER_id: share.USER_id,
          share_amount: share.share_amount,
          payment_status: share.payment_status || "pending", // Default to pending if not provided
          paid_at:
            share.payment_status === "paid"
              ? share.paid_at || new Date()
              : null,
        },
        { transaction }
      );
    });

    const createdShares = await Promise.all(orderSharesPromises);

    // If total_amount was not provided, update it with the sum of shares
    if (total_amount === undefined || total_amount === null) {
      order.total_amount = calculatedTotalAmount;
      await order.save({ transaction });
    }

    await transaction.commit();
    res.status(201).send({ ...order.toJSON(), shares: createdShares });
  } catch (error) {
    if (
      transaction &&
      transaction.finished !== "commit" &&
      transaction.finished !== "rollback"
    ) {
      await transaction.rollback();
    }
    next(error); // Pass error to error handling middleware
  }
};

// List All Orders for a Group — Optional filter for completed/uncompleted orders
exports.listOrdersForGroup = async (req, res, next) => {
  try {
    const { groupId } = req.params;
    const { completed } = req.query; // completed=true for paid, completed=false for pending

    // Base query options to get orders for the specified group
    const findOptions = {
      where: { GROUP_id: groupId },
      include: [
        {
          model: OrderShare,
          as: "shares",
          attributes: [
            "id",
            "USER_id",
            "share_amount",
            "payment_status",
            "paid_at",
          ],
        },
        {
          model: User,
          as: "creator",
          attributes: ["id", "username"],
        },
      ],
      order: [["created_at", "DESC"]],
    };

    // Filter options based on the 'completed' parameter
    if (completed !== undefined) {
      const targetStatus = completed === "true" ? "paid" : "pending";

      // Modify the include to filter orders with at least one share of the target status
      const sharesInclude = findOptions.include.find(
        (inc) => inc.as === "shares"
      );
      sharesInclude.required = true; // Ensures orders must have at least one matching share
      sharesInclude.where = {
        payment_status: targetStatus,
      };
      findOptions.distinct = true; // Needed to avoid duplicate orders in the result
    }

    // Get orders with their shares (filtered or all)
    let orders = await Order.findAll(findOptions);

    // If completed parameter was specified, post-process to include only relevant shares
    if (completed !== undefined) {
      const targetStatus = completed === "true" ? "paid" : "pending";

      // Process each order to include only shares with the target status
      orders = orders.map((order) => {
        const orderJson = order.toJSON();

        // Filter to include only shares with the target status
        orderJson.shares = orderJson.shares.filter(
          (share) => share.payment_status === targetStatus
        );

        return orderJson;
      });
    }

    res.status(200).send(orders);
  } catch (error) {
    next(error);
  }
};
