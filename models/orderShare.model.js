module.exports = (sequelize, DataTypes) => {
  const OrderShare = sequelize.define("OrderShare", {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      allowNull: false
      // Not auto-incrementing as part of a composite key
    },
    ORDER_id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      allowNull: false,
      references: {
        model: 'ORDERS',
        key: 'id' // This should reference the composite PK of ORDERS, or a single PK if ORDERS has one for Sequelize.
                 // Assuming ORDERS.id is the primary reference point for simplicity in Sequelize associations.
                 // If ORDERS composite key (id, GROUP_id, created_by_user_id) must be fully referenced,
                 // Sequelize associations become more complex and might require careful setup in index.js.
                 // For now, linking to ORDERS.id. This might need adjustment based on how ORDERS PK is handled by Sequelize.
      }
    },
    USER_id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      allowNull: false,
      references: {
        model: 'USERS',
        key: 'id'
      }
    },
    share_amount: {
      type: DataTypes.DECIMAL(10, 2), // Assuming precision and scale
      allowNull: true
    },
    payment_status: {
      type: DataTypes.ENUM("pending", "paid"),
      allowNull: true,
      defaultValue: "pending"
    },
    paid_at: {
      type: DataTypes.DATE,
      allowNull: true // Schema says NOT NULL, but practically this should be NULL if status is pending.
    }
  }, {
    tableName: "Order_SHARES",
    timestamps: false // Schema doesn't show createdAt/updatedAt for Order_SHARES table, only paid_at
  });

  return OrderShare;
};
