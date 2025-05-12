const dbConfig = require("../config/db.config.js");
const Sequelize = require("sequelize");

const sequelize = new Sequelize(dbConfig.DB, dbConfig.USER, dbConfig.PASSWORD, {
  host: dbConfig.HOST,
  dialect: dbConfig.dialect,
  operatorsAliases: 0, // 0 instead of false for Sequelize v5+
  pool: {
    max: dbConfig.pool.max,
    min: dbConfig.pool.min,
    acquire: dbConfig.pool.acquire,
    idle: dbConfig.pool.idle
  },
  logging: false // Disable logging or use console.log for debugging
});

const db = {};

db.Sequelize = Sequelize;
db.sequelize = sequelize;

// Import models
db.User = require("./user.model.js")(sequelize, Sequelize.DataTypes);
db.Group = require("./group.model.js")(sequelize, Sequelize.DataTypes);
db.GroupUser = require("./groupUser.model.js")(sequelize, Sequelize.DataTypes);
db.Order = require("./order.model.js")(sequelize, Sequelize.DataTypes);
db.OrderShare = require("./orderShare.model.js")(sequelize, Sequelize.DataTypes);

// --- Define Associations --- 

// User and Group (Admin)
// A User (as an admin) can manage multiple Groups
db.User.hasMany(db.Group, {
  foreignKey: "admin_user_id",
  as: "administeredGroups"
});
// A Group has one Admin User
db.Group.belongsTo(db.User, {
  foreignKey: "admin_user_id",
  as: "admin"
});

// User and Group (Many-to-Many through GroupUser)
db.User.belongsToMany(db.Group, {
  through: db.GroupUser,
  foreignKey: "USER_id", // Corresponds to USER_id in GROUP_USERS table
  otherKey: "GROUP_id",
  as: "memberOfGroups"
});
db.Group.belongsToMany(db.User, {
  through: db.GroupUser,
  foreignKey: "GROUP_id", // Corresponds to GROUP_id in GROUP_USERS table
  otherKey: "USER_id",
  as: "groupMembers"
});
// Direct associations for GroupUser if needed for querying the join table directly
db.GroupUser.belongsTo(db.User, { foreignKey: "USER_id" });
db.GroupUser.belongsTo(db.Group, { foreignKey: "GROUP_id" });
db.User.hasMany(db.GroupUser, { foreignKey: "USER_id" });
db.Group.hasMany(db.GroupUser, { foreignKey: "GROUP_id" });


// User and Order (Creator)
// A User can create multiple Orders
db.User.hasMany(db.Order, {
  foreignKey: "created_by_user_id",
  as: "createdOrders"
});
// An Order is created by one User
db.Order.belongsTo(db.User, {
  foreignKey: "created_by_user_id",
  as: "creator"
});

// Group and Order
// A Group can have multiple Orders
db.Group.hasMany(db.Order, {
  foreignKey: "GROUP_id",
  as: "orders"
});
// An Order belongs to one Group
db.Order.belongsTo(db.Group, {
  foreignKey: "GROUP_id",
  as: "group"
});

// Order and OrderShare
// An Order can have multiple OrderShares
db.Order.hasMany(db.OrderShare, {
  foreignKey: "ORDER_id", // This refers to ORDERS.id
  sourceKey: "id", // Explicitly state that ORDER_id in OrderShare refers to Order.id
  as: "shares"
});
// An OrderShare belongs to one Order
db.OrderShare.belongsTo(db.Order, {
  foreignKey: "ORDER_id", // This refers to ORDERS.id
  targetKey: "id", // Explicitly state that ORDER_id in OrderShare refers to Order.id
  as: "order"
});

// User and OrderShare
// A User can have multiple OrderShares
db.User.hasMany(db.OrderShare, {
  foreignKey: "USER_id",
  as: "orderShares"
});
// An OrderShare belongs to one User
db.OrderShare.belongsTo(db.User, {
  foreignKey: "USER_id",
  as: "user"
});

module.exports = db;
