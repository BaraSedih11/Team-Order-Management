const db = require("../models");
const User = db.User;
const Group = db.Group;
const GroupUser = db.GroupUser;
const Order = db.Order;
const OrderShare = db.OrderShare;

const seedMockData = async () => {
  try {
    // Clean up existing data (optional, good for repeatable seeding)
    // Order of deletion matters due to foreign key constraints
    await OrderShare.destroy({ where: {}, truncate: { cascade: true } });
    await Order.destroy({ where: {}, truncate: { cascade: true } });
    await GroupUser.destroy({ where: {}, truncate: { cascade: true } });
    await Group.destroy({ where: {}, truncate: { cascade: true } });
    await User.destroy({ where: {}, truncate: { cascade: true } });

    console.log("Mock data: Seeding users...");
    const users = await User.bulkCreate([
      { id: 1, username: "alice", email: "alice@example.com" },
      { id: 2, username: "bob", email: "bob@example.com" },
      { id: 3, username: "charlie", email: "charlie@example.com" },
      { id: 4, username: "diana", email: "diana@example.com" }
    ], { returning: true });

    console.log("Mock data: Seeding groups...");
    const groups = await Group.bulkCreate([
      { id: 101, admin_user_id: 1, name: "Weekend Trip" }, // Alice is admin
      { id: 102, admin_user_id: 2, name: "Office Lunch" }  // Bob is admin
    ], { returning: true });

    console.log("Mock data: Seeding group users (memberships)...");
    // Group 101: Alice (admin), Bob, Charlie
    // Group 102: Bob (admin), Diana
    // Note: GroupUser PK is (id, GROUP_id, USER_id). We need to provide unique `id` for each entry.
    await GroupUser.bulkCreate([
      // Group 101 members
      { id: 1001, GROUP_id: 101, USER_id: 1 }, // Alice (admin is also a member)
      { id: 1002, GROUP_id: 101, USER_id: 2 }, // Bob
      { id: 1003, GROUP_id: 101, USER_id: 3 }, // Charlie
      // Group 102 members
      { id: 1004, GROUP_id: 102, USER_id: 2 }, // Bob (admin is also a member)
      { id: 1005, GROUP_id: 102, USER_id: 4 }  // Diana
    ]);

    console.log("Mock data: Seeding orders...");
    // Order PK is (id, GROUP_id, created_by_user_id)
    const orders = await Order.bulkCreate([
      {
        id: 2001, // Order ID
        GROUP_id: 101, // Weekend Trip group
        created_by_user_id: 1, // Alice created this order
        total_amount: 150.00,
        created_at: new Date("2025-05-10T10:00:00Z")
      },
      {
        id: 2002, // Order ID
        GROUP_id: 101, // Weekend Trip group
        created_by_user_id: 2, // Bob created this order
        total_amount: 75.50,
        created_at: new Date("2025-05-11T12:30:00Z")
      },
      {
        id: 2003, // Order ID
        GROUP_id: 102, // Office Lunch group
        created_by_user_id: 2, // Bob created this order
        total_amount: 40.00,
        created_at: new Date("2025-05-12T13:00:00Z")
      }
    ], { returning: true });

    console.log("Mock data: Seeding order shares...");
    // OrderShare PK is (id, ORDER_id, USER_id)
    await OrderShare.bulkCreate([
      // Shares for Order 2001 (Weekend Trip, total 150.00, created by Alice)
      // Alice, Bob, Charlie are in Group 101
      { id: 3001, ORDER_id: 2001, USER_id: 1, share_amount: 50.00, payment_status: "paid", paid_at: new Date("2025-05-10T11:00:00Z") },
      { id: 3002, ORDER_id: 2001, USER_id: 2, share_amount: 50.00, payment_status: "pending", paid_at: null },
      { id: 3003, ORDER_id: 2001, USER_id: 3, share_amount: 50.00, payment_status: "pending", paid_at: null },

      // Shares for Order 2002 (Weekend Trip, total 75.50, created by Bob)
      // Alice, Bob, Charlie are in Group 101
      { id: 3004, ORDER_id: 2002, USER_id: 1, share_amount: 25.00, payment_status: "pending", paid_at: null },
      { id: 3005, ORDER_id: 2002, USER_id: 2, share_amount: 25.50, payment_status: "paid", paid_at: new Date("2025-05-11T13:00:00Z") },
      { id: 3006, ORDER_id: 2002, USER_id: 3, share_amount: 25.00, payment_status: "pending", paid_at: null },
      
      // Shares for Order 2003 (Office Lunch, total 40.00, created by Bob)
      // Bob, Diana are in Group 102
      { id: 3007, ORDER_id: 2003, USER_id: 2, share_amount: 20.00, payment_status: "paid", paid_at: new Date("2025-05-12T13:30:00Z") },
      { id: 3008, ORDER_id: 2003, USER_id: 4, share_amount: 20.00, payment_status: "paid", paid_at: new Date("2025-05-12T13:35:00Z") }
    ]);

    console.log("Mock data seeded successfully!");
  } catch (error) {
    console.error("Error seeding mock data:", error);
    // process.exit(1); // Optionally exit if seeding fails
  }
};

// If this file is run directly (e.g., `node seeders/mockData.js`)
// then connect to DB and run the seeder.
// This part is for standalone execution, might need to adjust db connection setup if run this way.
if (require.main === module) {
  console.log("Connecting to database to seed mock data...");
  db.sequelize.sync({ alter: true }) // Use {force: true} to drop and recreate tables, {alter: true} to attempt to alter them.
                                  // Be cautious with force: true in a real environment.
                                  // For seeding, alter:true or just sync() might be enough if tables exist.
    .then(() => {
      console.log("Database synced. Running seeder...");
      return seedMockData();
    })
    .then(() => {
      console.log("Seeding complete. Closing DB connection.");
      return db.sequelize.close();
    })
    .catch(err => {
      console.error("Unable to connect to the database or seed data:", err);
      process.exit(1);
    });
}

module.exports = seedMockData;

