module.exports = (sequelize, DataTypes) => {
  const Order = sequelize.define("Order", {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      allowNull: false
      // Not auto-incrementing as part of a composite key
    },
    GROUP_id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      allowNull: false,
      references: {
        model: 'GROUPS',
        key: 'id'
      }
    },
    created_by_user_id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      allowNull: false,
      references: {
        model: 'USERS',
        key: 'id'
      }
    },
    total_amount: {
      type: DataTypes.DECIMAL(10, 2), // Assuming precision and scale, adjust if needed
      allowNull: true
    },
    created_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW
    }
  }, {
    tableName: "ORDERS",
    timestamps: true, // Enables createdAt and updatedAt
    updatedAt: false, // Schema only has created_at, so disable updatedAt
    createdAt: 'created_at' // Map Sequelize's createdAt to the 'created_at' column
  });

  return Order;
};
