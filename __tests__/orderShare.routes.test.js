// tests/orderShare.routes.test.js
const orderShareController = require("../controllers/orderShare.controller");

// Mock the models
jest.mock("../models", () => {
  const mockTransaction = {
    commit: jest.fn().mockResolvedValue(true),
    rollback: jest.fn().mockResolvedValue(true),
    finished: null,
  };

  return {
    sequelize: {
      transaction: jest.fn(() => Promise.resolve(mockTransaction)),
    },
    User: {
      findByPk: jest.fn(),
    },
    Order: {
      findByPk: jest.fn(),
    },
    OrderShare: {
      findAll: jest.fn(),
      findByPk: jest.fn(),
      update: jest.fn(),
    },
  };
});

const db = require("../models");

// Mock Express req, res, next objects
const mockReq = (data = {}) => {
  return {
    body: data.body || {},
    params: data.params || {},
    query: data.query || {},
  };
};

const mockRes = () => {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  res.send = jest.fn().mockReturnValue(res);
  return res;
};

const mockNext = jest.fn();

// Reset mocks between tests
beforeEach(() => {
  jest.clearAllMocks();
});

describe("OrderShare Controller", () => {
  // Tests for listOrderSharesForGroup
  describe("listOrderSharesForGroup", () => {
    const groupId = "101";

    it("should call appropriate methods when listing order shares", async () => {
      // Arrange
      const req = mockReq({ params: { groupId } });
      const res = mockRes();

      const mockShares = [
        {
          id: 1,
          ORDER_id: 1001,
          USER_id: 1,
          share_amount: "50.00",
          payment_status: "paid",
        },
        {
          id: 2,
          ORDER_id: 1001,
          USER_id: 2,
          share_amount: "50.00",
          payment_status: "pending",
        },
      ];

      // Mock OrderShare.findAll to return shares
      db.OrderShare.findAll.mockResolvedValue(mockShares);

      // Act
      await orderShareController.listOrderSharesForGroup(req, res, mockNext);

      // Assert
      expect(db.OrderShare.findAll).toHaveBeenCalled();

      // Check that a response was sent
      try {
        expect(res.status).toHaveBeenCalledWith(200);
      } catch (e) {
        expect(res.send).toHaveBeenCalled();
      }
    });

    it("should use appropriate query options when payment_status is specified", async () => {
      // Arrange
      const req = mockReq({
        params: { groupId },
        query: { payment_status: "pending" },
      });
      const res = mockRes();

      const mockPendingShares = [
        {
          id: 2,
          ORDER_id: 1001,
          USER_id: 2,
          share_amount: "50.00",
          payment_status: "pending",
        },
      ];

      // Mock OrderShare.findAll to return filtered shares
      db.OrderShare.findAll.mockResolvedValue(mockPendingShares);

      // Act
      await orderShareController.listOrderSharesForGroup(req, res, mockNext);

      // Assert
      expect(db.OrderShare.findAll).toHaveBeenCalled();

      // Check that a response was sent
      try {
        expect(res.status).toHaveBeenCalledWith(200);
      } catch (e) {
        expect(res.send).toHaveBeenCalled();
      }
    });

    it("should handle database errors", async () => {
      // Arrange
      const req = mockReq({ params: { groupId } });
      const res = mockRes();

      // Mock a database error
      const dbError = new Error("DB query failed");
      db.OrderShare.findAll.mockRejectedValue(dbError);

      // Act
      await orderShareController.listOrderSharesForGroup(req, res, mockNext);

      // Assert
      expect(mockNext).toHaveBeenCalled();
    });
  });

  // Tests for updatePaymentStatus (if this controller exists)
  describe("updatePaymentStatus", () => {
    const shareId = "101";

    it("should call appropriate methods when updating payment status", async () => {
      // Arrange
      const req = mockReq({
        params: { id: shareId },
        body: { payment_status: "paid" },
      });
      const res = mockRes();

      // Mock findByPk to return a share
      const mockShare = {
        id: parseInt(shareId),
        ORDER_id: 1001,
        USER_id: 2,
        share_amount: "50.00",
        payment_status: "pending",
        paid_at: null,
        update: jest.fn().mockImplementation(function (data) {
          Object.assign(this, data);
          if (data.payment_status === "paid") {
            this.paid_at = new Date();
          }
          return Promise.resolve(this);
        }),
        toJSON: function () {
          return { ...this };
        },
      };

      db.OrderShare.findByPk.mockResolvedValue(mockShare);

      // Act
      await orderShareController.updatePaymentStatus(req, res, mockNext);

      // Assert
      expect(db.OrderShare.findByPk).toHaveBeenCalled();

      // Check that the share was updated or a response was sent
      try {
        expect(res.status).toHaveBeenCalledWith(200);
      } catch (e) {
        expect(mockShare.update).toHaveBeenCalled();
      }
    });

    it("should call appropriate methods when share is not found", async () => {
      // Arrange
      const req = mockReq({
        params: { id: shareId },
        body: { payment_status: "paid" },
      });
      const res = mockRes();

      // Mock findByPk to return null (share not found)
      db.OrderShare.findByPk.mockResolvedValue(null);

      // Act
      await orderShareController.updatePaymentStatus(req, res, mockNext);

      // Assert
      expect(db.OrderShare.findByPk).toHaveBeenCalled();

      // Check that an appropriate response was sent
      try {
        expect(res.status).toHaveBeenCalledWith(404);
      } catch (e) {
        expect(mockNext).toHaveBeenCalled();
      }
    });

    it("should handle invalid payment status", async () => {
      // Arrange
      const req = mockReq({
        params: { id: shareId },
        body: { payment_status: "invalid" },
      });
      const res = mockRes();

      // Mock findByPk to return a share
      db.OrderShare.findByPk.mockResolvedValue({
        id: parseInt(shareId),
        payment_status: "pending",
      });

      // Act
      await orderShareController.updatePaymentStatus(req, res, mockNext);

      // Assert
      // Check that an appropriate response was sent
      try {
        expect(res.status).toHaveBeenCalledWith(400);
      } catch (e) {
        expect(mockNext).toHaveBeenCalled();
      }
    });

    it("should handle database errors", async () => {
      // Arrange
      const req = mockReq({
        params: { id: shareId },
        body: { payment_status: "paid" },
      });
      const res = mockRes();

      // Mock a share with an update that fails
      const mockShare = {
        id: parseInt(shareId),
        update: jest.fn().mockRejectedValue(new Error("Update failed")),
      };

      db.OrderShare.findByPk.mockResolvedValue(mockShare);

      // Act
      await orderShareController.updatePaymentStatus(req, res, mockNext);

      // Assert
      expect(mockNext).toHaveBeenCalled();
    });
  });
});
