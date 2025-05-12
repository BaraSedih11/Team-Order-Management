module.exports = (sequelize, DataTypes) => {
  const User = sequelize.define("User", {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      allowNull: false,
      autoIncrement: true // Assuming id is auto-incrementing, though schema doesn't specify. Common practice.
    },
    username: {
      type: DataTypes.STRING(16),
      allowNull: false
    },
    email: {
      type: DataTypes.STRING(255),
      allowNull: true,
      validate: {
        isEmail: true
      }
    }
  }, {
    tableName: "USERS",
    timestamps: false // Schema doesn't show createdAt/updatedAt for USERS table
  });

  return User;
};
