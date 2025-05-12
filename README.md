# Node.js Express Sequelize MySQL Backend Application

This project is a backend application built with Node.js, Express.js, Sequelize ORM, and a MySQL database. It provides APIs for managing orders and order shares within groups.

## Features

- **Create Order**: Allows creating a new order and its associated shares for users within a group.
- **List Order Shares for a Group**: Retrieves all order shares for a specific group, with an optional filter for `payment_status = "pending"`.
- **List All Orders for a Group**: Retrieves all orders for a specific group, with an optional filter for uncompleted orders (orders with any unpaid shares).
- No authentication is required; `user_id` is expected in request bodies where necessary.
- Mock data seeding for easy testing.
- Centralized error handling.

## Project Structure

```
project-root/
│
├── config/
│   └── db.config.js              # Sequelize DB config
│
├── models/
│   └── index.js                  # Sequelize instance and associations
│   └── user.model.js
│   └── group.model.js
│   └── groupUser.model.js
│   └── order.model.js
│   └── orderShare.model.js
│
├── controllers/
│   └── order.controller.js
│   └── orderShare.controller.js
│
├── routes/
│   └── order.routes.js
│   └── orderShare.routes.js
│
├── seeders/
│   └── mockData.js               # Seed mock data for Postman testing
│
├── middleware/
│   └── errorHandler.js           # Error handling middleware
│
├── utils/
│   └── helpers.js                # Any helper functions
│
├── .env                        # Environment variables (create from .env.example)
├── .env.example                # Example environment variables
├── app.js                      # Express application entry point
├── package.json                # Project dependencies and scripts
└── README.md                   # This file
```

## Prerequisites

- Node.js (v14 or later recommended)
- npm (usually comes with Node.js)
- MySQL Server

## Setup Guide

Follow these steps to set up and run the project locally:

### 1. Get the Project Files

Ensure you have all the project files in a local directory (e.g., `project-root`).

### 2. Install Dependencies

Navigate to the project root directory in your terminal and run:

```bash
npm install
```

This will install all the necessary dependencies listed in `package.json`.

### 3. Create and Configure `.env` File

Create a `.env` file in the project root directory by copying the `.env.example` file:

```bash
cp .env.example .env
```

Open the `.env` file and update the database connection details and other configurations as needed:

```env
DB_HOST=localhost
DB_USER=your_mysql_user        # Replace with your MySQL username
DB_PASSWORD=your_mysql_password  # Replace with your MySQL password
DB_NAME=mydb                   # The database name (schema)
DB_PORT=3306                   # MySQL port, usually 3306

PORT=8080                      # Port the application will run on

NODE_ENV=development           # Set to "production" for production
SEED_DB=true                   # Set to true to seed DB on startup in dev mode
```

### 4. Set Up MySQL Database

- Ensure your MySQL server is running.
- Create the database (schema) specified in your `.env` file (e.g., `mydb`) if it doesn't already exist. You can use a MySQL client like MySQL Workbench or the command line:
  ```sql
  CREATE DATABASE IF NOT EXISTS mydb CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
  ```
- The application uses Sequelize's `sync()` method (`db.sequelize.sync()`) in `app.js`. When the application starts, Sequelize will automatically create the tables based on the model definitions if they don't already exist in the `mydb` database. The provided SQL schema in `pasted_content.txt` defines the table structure that Sequelize will aim to create/match.

### 5. Run Migrations (Table Creation)

As mentioned above, Sequelize's `sync()` method handles table creation based on models. When you start the application for the first time, it will attempt to create the tables.

```bash
npm start 
# or for development with nodemon
npm run dev
```

Check the console output for messages like "Synced db.". If there are errors, ensure your MySQL connection details in `.env` are correct and the database user has permissions to create tables.

### 6. Seed Mock Data

The project includes a seeder script to populate the database with mock data for testing.

To run the seeder independently:

```bash
npm run seed
```

Alternatively, if `NODE_ENV=development` and `SEED_DB=true` are set in your `.env` file, the `app.js` is configured to attempt seeding when the server starts.

### 7. Start the Application

To start the server:

```bash
npm start
```

For development, using `nodemon` for automatic restarts on file changes:

```bash
npm run dev
```

The application should now be running on the port specified in your `.env` file (default is `8080`). You'll see a message like `Server is running on port 8080.`

## API Documentation (for Postman Testing)

**Base URL**: `http://localhost:8080/api` (assuming PORT is 8080)

--- 

### 1. Create Order

- **Description**: Creates a new order along with its shares.
- **Method**: `POST`
- **URL**: `/orders`
- **Headers**:
  - `Content-Type: application/json`
- **Request Body** (Example JSON):

  ```json
  {
    "GROUP_id": 101,
    "created_by_user_id": 1,
    "total_amount": 90.00, // Optional, will be calculated from shares if not provided
    "shares": [
      {
        "USER_id": 2,
        "share_amount": 45.00,
        "payment_status": "pending" 
      },
      {
        "USER_id": 3,
        "share_amount": 45.00,
        "payment_status": "pending"
      }
    ]
  }
  ```

- **Success Response (201 Created)** (Example JSON):

  ```json
  {
    "id": 1678886400000, // Example Order ID (timestamp-based in current controller)
    "GROUP_id": 101,
    "created_by_user_id": 1,
    "total_amount": "90.00",
    "created_at": "2025-05-12T08:55:00.000Z",
    "shares": [
      {
        "id": 1678886400001, // Example OrderShare ID
        "ORDER_id": 1678886400000,
        "USER_id": 2,
        "share_amount": "45.00",
        "payment_status": "pending",
        "paid_at": null
      },
      {
        "id": 1678886400002,
        "ORDER_id": 1678886400000,
        "USER_id": 3,
        "share_amount": "45.00",
        "payment_status": "pending",
        "paid_at": null
      }
    ]
  }
  ```

- **Error Responses**:
  - `400 Bad Request`: If required fields are missing or invalid (e.g., `GROUP_id`, `created_by_user_id`, `shares` array).
    ```json
    {
        "success": false,
        "status": 400,
        "message": "GROUP_id, created_by_user_id, and a non-empty array of shares are required."
    }
    ```
  - `404 Not Found`: If `GROUP_id` or `created_by_user_id` (or a `USER_id` in a share) does not exist.
    ```json
    {
        "success": false,
        "status": 404,
        "message": "Group with id=999 not found."
    }
    ```
  - `500 Internal Server Error`: For other server-side issues.

--- 

### 2. List Order Shares for a Group

- **Description**: Retrieves all order shares for a specific group. Can be filtered by payment status.
- **Method**: `GET`
- **URL**: `/order-shares/group/:groupId`
- **Path Parameters**:
  - `groupId` (integer, required): The ID of the group.
- **Query Parameters**:
  - `payment_status` (string, optional): Filter by payment status. Example: `pending`.
- **Example URL**: `http://localhost:8080/api/order-shares/group/101?payment_status=pending`
- **Success Response (200 OK)** (Example JSON - shares for group 101 with status 'pending'):

  ```json
  [
    {
      "id": 3002,
      "ORDER_id": 2001,
      "USER_id": 2,
      "share_amount": "50.00",
      "payment_status": "pending",
      "paid_at": null,
      "user": {
        "id": 2,
        "username": "bob"
      }
    },
    {
      "id": 3003,
      "ORDER_id": 2001,
      "USER_id": 3,
      "share_amount": "50.00",
      "payment_status": "pending",
      "paid_at": null,
      "user": {
        "id": 3,
        "username": "charlie"
      }
    },
    {
      "id": 3004,
      "ORDER_id": 2002,
      "USER_id": 1,
      "share_amount": "25.00",
      "payment_status": "pending",
      "paid_at": null,
      "user": {
        "id": 1,
        "username": "alice"
      }
    },
    {
      "id": 3006,
      "ORDER_id": 2002,
      "USER_id": 3,
      "share_amount": "25.00",
      "payment_status": "pending",
      "paid_at": null,
      "user": {
        "id": 3,
        "username": "charlie"
      }
    }
  ]
  ```

- **Error Responses**:
  - `500 Internal Server Error`: If an issue occurs during data retrieval.

--- 

### 3. List All Orders for a Group

- **Description**: Retrieves all orders associated with a specific group. Can be filtered to show only uncompleted orders (orders with at least one 'pending' share).
- **Method**: `GET`
- **URL**: `/orders/group/:groupId`
- **Path Parameters**:
  - `groupId` (integer, required): The ID of the group.
- **Query Parameters**:
  - `uncompleted` (boolean, optional): If `true`, returns only orders that have one or more unpaid order shares. Example: `?uncompleted=true`.
- **Example URL (all orders for group 101)**: `http://localhost:8080/api/orders/group/101`
- **Example URL (uncompleted orders for group 101)**: `http://localhost:8080/api/orders/group/101?uncompleted=true`
- **Success Response (200 OK)** (Example JSON - uncompleted orders for group 101):

  ```json
  [
    {
      "id": 2001,
      "GROUP_id": 101,
      "created_by_user_id": 1,
      "total_amount": "150.00",
      "created_at": "2025-05-10T10:00:00.000Z",
      "shares": [
        // Note: The controller logic for uncompleted orders might filter shares here
        // or return all shares for the uncompleted order.
        // Current controller returns orders that HAVE pending shares, including all their shares.
        {
          "id": 3001,
          "USER_id": 1,
          "share_amount": "50.00",
          "payment_status": "paid",
          "paid_at": "2025-05-10T11:00:00.000Z"
        },
        {
          "id": 3002,
          "USER_id": 2,
          "share_amount": "50.00",
          "payment_status": "pending",
          "paid_at": null
        },
        {
          "id": 3003,
          "USER_id": 3,
          "share_amount": "50.00",
          "payment_status": "pending",
          "paid_at": null
        }
      ],
      "creator": {
        "id": 1,
        "username": "alice"
      }
    },
    {
      "id": 2002,
      "GROUP_id": 101,
      "created_by_user_id": 2,
      "total_amount": "75.50",
      "created_at": "2025-05-11T12:30:00.000Z",
      "shares": [
        {
          "id": 3004,
          "USER_id": 1,
          "share_amount": "25.00",
          "payment_status": "pending",
          "paid_at": null
        },
        {
          "id": 3005,
          "USER_id": 2,
          "share_amount": "25.50",
          "payment_status": "paid",
          "paid_at": "2025-05-11T13:00:00.000Z"
        },
        {
          "id": 3006,
          "USER_id": 3,
          "share_amount": "25.00",
          "payment_status": "pending",
          "paid_at": null
        }
      ],
      "creator": {
        "id": 2,
        "username": "bob"
      }
    }
  ]
  ```

- **Error Responses**:
  - `500 Internal Server Error`: If an issue occurs during data retrieval.

## Further Development (Optional)

- Implement full CRUD operations for Users and Groups if needed.
- Add authentication (e.g., JWT).
- Implement more robust ID generation (e.g., UUIDs) for primary keys, especially for `Order` and `OrderShare` if `Date.now()` is not sufficiently unique for concurrent requests.
- Add input validation using a library like Joi or express-validator.
- Enhance error handling for more specific error types.
- Write unit and integration tests.
- Implement proper database migration management instead of relying solely on `sync()` for production environments.

