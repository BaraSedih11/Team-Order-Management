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
    if (!GROUP_id || !created_by_user_id || !shares || !Array.isArray(shares) || shares.length === 0) {
      return res.status(400).send({ message: "GROUP_id, created_by_user_id, and a non-empty array of shares are required." });
    }

    // Optional: Validate if GROUP_id and created_by_user_id exist
    const groupExists = await Group.findByPk(GROUP_id, { transaction });
    if (!groupExists) {
      await transaction.rollback();
      return res.status(404).send({ message: `Group with id=${GROUP_id} not found.` });
    }
    const userExists = await User.findByPk(created_by_user_id, { transaction });
    if (!userExists) {
      await transaction.rollback();
      return res.status(404).send({ message: `User with id=${created_by_user_id} not found.` });
    }

    // Generate a unique ID for the order. In a real app, this might be a UUID or a more robust sequence.
    // For now, using a timestamp-based approach for simplicity, but this is NOT production-ready for uniqueness.
    // The schema defines (id, GROUP_id, created_by_user_id) as PK for ORDERS.
    // We need to ensure `id` is unique for a given GROUP_id and created_by_user_id, or globally unique if that's the intent.
    // Let's assume `id` should be unique for the order itself, and the combination with GROUP_id and created_by_user_id forms the composite PK.
    // For this example, we'll use a simple approach. A better way would be a sequence or UUID.
    const orderId = Date.now(); // Placeholder for a proper ID generation strategy

    const order = await Order.create({
      id: orderId, // This needs to be unique for the composite PK
      GROUP_id,
      created_by_user_id,
      total_amount,
      created_at: new Date()
    }, { transaction });

    let calculatedTotalAmount = 0;
    const orderSharesPromises = shares.map(async (share) => {
      if (!share.USER_id || share.share_amount === undefined) {
        throw new Error("Each share must have a USER_id and share_amount.");
      }
      // Optional: Validate share.USER_id exists
      const shareUserExists = await User.findByPk(share.USER_id, { transaction });
      if (!shareUserExists) {
        throw new Error(`User with id=${share.USER_id} for an order share not found.`);
      }

      calculatedTotalAmount += parseFloat(share.share_amount);
      
      // Generate a unique ID for the order share.
      const orderShareId = Date.now() + Math.random(); // Placeholder, ensure uniqueness

      return OrderShare.create({
        id: orderShareId, // This needs to be unique for the composite PK
        ORDER_id: order.id, // Use the ID of the newly created order
        USER_id: share.USER_id,
        share_amount: share.share_amount,
        payment_status: share.payment_status || "pending", // Default to pending if not provided
        // paid_at should be null if pending, or set if paid. Schema says NOT NULL, which is problematic for "pending".
        // For now, let's make paid_at nullable in the model or handle it here.
        // Assuming model was adjusted or we set a default past date for paid if status is pending and db requires NOT NULL.
        // Let's assume paid_at can be null if status is 'pending'. The model was defined with allowNull: true for paid_at.
        paid_at: share.payment_status === "paid" ? (share.paid_at || new Date()) : null
      }, { transaction });
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
    if (transaction.finished !== 'commit' && transaction.finished !== 'rollback') {
        await transaction.rollback();
    }
    next(error); // Pass error to error handling middleware
  }
};

// List All Orders for a Group — Optional filter for uncompleted orders
exports.listOrdersForGroup = async (req, res, next) => {
  try {
    const { groupId } = req.params;
    const { uncompleted } = req.query; // uncompleted=true

    const findOptions = {
      where: { GROUP_id: groupId },
      include: [
        {
          model: OrderShare,
          as: "shares",
          attributes: ["id", "USER_id", "share_amount", "payment_status", "paid_at"]
        },
        {
          model: User,
          as: "creator",
          attributes: ["id", "username"]
        }
      ],
      order: [["created_at", "DESC"]]
    };

    if (uncompleted === "true") {
      // Find orders that have at least one orderShare with payment_status = 'pending'
      // This requires a subquery or a more complex join condition.
      // Sequelize can handle this using `include.where` but it might behave as an INNER JOIN.
      // A more robust way is to fetch orders and then filter, or use a raw query for complex conditions.
      // Alternative: Fetch all orders for the group, then filter in application logic if performance allows.
      // For now, let's try to use Sequelize's capabilities.
      
      // We need orders where at least one of its shares is 'pending'.
      // This can be achieved by finding OrderShare IDs that are pending, then finding Orders associated with them.
      // Or, more directly, by including OrderShare and filtering at that level, but that might exclude orders with no shares.
      // The requirement is "orders with unpaid order shares".

      findOptions.include.find(inc => inc.as === "shares").required = true; // Make the join required
      findOptions.include.find(inc => inc.as === "shares").where = { payment_status: "pending" };
      // This will only return orders that HAVE pending shares. If an order has ALL shares paid, it won't be returned.
      // To ensure we get distinct orders if an order has multiple pending shares:
      findOptions.distinct = true;
    }

    const orders = await Order.findAll(findOptions);
    res.status(200).send(orders);
  } catch (error) {
    next(error);
  }
};
