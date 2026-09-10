import { describe, it, expect, beforeAll, beforeEach } from "vitest";
import request from "supertest";
import { createTestApp, mockDb } from "./setup";

describe("Role-Based Access Control (RBAC) Integration Tests", () => {
  let app: any;

  beforeAll(async () => {
    app = await createTestApp();
  });

  beforeEach(() => {
    // Reset specific transfer details before each test
    mockDb.transfers.set("transfer-123", {
      id: "transfer-123",
      productId: "prod-123",
      fromUserId: "user-farmer",
      toUserId: "user-distributor", // Matches distributor UID user
      transferType: "transfer",
      notes: "Pending transfer to distributor",
      status: "pending",
    });
  });

  describe("Product Registration (POST /api/products)", () => {
    const productPayload = {
      name: "Organic Rice",
      category: "Grains",
      quantity: "50",
      unit: "kg",
      farmName: "Sunrise Farms",
      location: "Punjab",
      harvestDate: new Date().toISOString(),
      certifications: ["Organic"],
      price: "120",
      ownerId: "user-farmer",
    };

    it("should allow a farmer to register a product", async () => {
      const res = await request(app)
        .post("/api/products")
        .set("Authorization", "Bearer valid-token-farmer")
        .set("firebase-uid", "uid123")
        .send(productPayload);

      expect(res.status).toBe(201);
      expect(res.body.name).toBe("Organic Rice");
    });

    it("should forbid a distributor from registering a product", async () => {
      const res = await request(app)
        .post("/api/products")
        .set("Authorization", "Bearer valid-token-distributor")
        .set("firebase-uid", "uid-distributor")
        .send(productPayload);

      expect(res.status).toBe(403);
      expect(res.body.message).toContain("Forbidden: Only farmers can register products");
    });

    it("should forbid a retailer from registering a product", async () => {
      const res = await request(app)
        .post("/api/products")
        .set("Authorization", "Bearer valid-token-retailer")
        .set("firebase-uid", "uid-retailer")
        .send(productPayload);

      expect(res.status).toBe(403);
      expect(res.body.message).toContain("Forbidden: Only farmers can register products");
    });
  });

  describe("Accept Ownership Transfer (PUT /api/ownership-transfers/:id/accept)", () => {
    it("should allow a distributor to accept a transfer with distributor-specific fields", async () => {
      const res = await request(app)
        .put("/api/ownership-transfers/transfer-123/accept")
        .set("Authorization", "Bearer valid-token-distributor")
        .set("firebase-uid", "uid-distributor")
        .send({
          distributorName: "Fast Logistical Services",
          warehouseLocation: "Sector 5, Delhi",
          dispatchDate: new Date().toISOString(),
        });

      expect(res.status).toBe(200);
      expect(res.body.message).toBe("Ownership transfer completed successfully");
    });

    it("should forbid a non-distributor from filling distributor fields", async () => {
      // Set recipient of the transfer to the retailer for testing
      const transfer = mockDb.transfers.get("transfer-123");
      mockDb.transfers.set("transfer-123", {
        ...transfer,
        toUserId: "user-retailer",
      });

      const res = await request(app)
        .put("/api/ownership-transfers/transfer-123/accept")
        .set("Authorization", "Bearer valid-token-retailer")
        .set("firebase-uid", "uid-retailer")
        .send({
          distributorName: "Fast Logistical Services",
          warehouseLocation: "Sector 5, Delhi",
          dispatchDate: new Date().toISOString(),
        });

      expect(res.status).toBe(403);
      expect(res.body.message).toContain("Forbidden: Only distributors can register distributor details.");
    });

    it("should allow a retailer to accept a transfer with retailer-specific fields", async () => {
      // Set recipient of the transfer to the retailer
      const transfer = mockDb.transfers.get("transfer-123");
      mockDb.transfers.set("transfer-123", {
        ...transfer,
        toUserId: "user-retailer",
      });

      const res = await request(app)
        .put("/api/ownership-transfers/transfer-123/accept")
        .set("Authorization", "Bearer valid-token-retailer")
        .set("firebase-uid", "uid-retailer")
        .send({
          storeName: "City Supermarket",
          storeLocation: "Connaught Place, Delhi",
          arrivalDate: new Date().toISOString(),
        });

      expect(res.status).toBe(200);
      expect(res.body.message).toBe("Ownership transfer completed successfully");
    });

    it("should forbid a non-retailer from filling retailer fields", async () => {
      const res = await request(app)
        .put("/api/ownership-transfers/transfer-123/accept")
        .set("Authorization", "Bearer valid-token-distributor")
        .set("firebase-uid", "uid-distributor")
        .send({
          storeName: "City Supermarket",
          storeLocation: "Connaught Place, Delhi",
          arrivalDate: new Date().toISOString(),
        });

      expect(res.status).toBe(403);
      expect(res.body.message).toContain("Forbidden: Only retailers can register retailer details.");
    });
  });

  describe("AgriLink Role-Based API Permissions", () => {
    it("should allow farmer to create a produce lot via /api/produce-lots", async () => {
      const res = await request(app)
        .post("/api/produce-lots")
        .set("Authorization", "Bearer valid-token-farmer")
        .set("firebase-uid", "uid123")
        .send({
          crop: "Tomato",
          quantity: 100,
          expectedPricePerUnit: 2600,
        });

      expect(res.status).toBe(201);
      expect(res.body.crop).toBe("Tomato");
    });

    it("should forbid a buyer from creating a produce lot", async () => {
      const res = await request(app)
        .post("/api/produce-lots")
        .set("Authorization", "Bearer valid-token-buyer")
        .set("firebase-uid", "uid-buyer")
        .send({
          crop: "Tomato",
          quantity: 100,
        });

      expect(res.status).toBe(403);
      expect(res.body.message).toContain("Access denied. Role 'buyer' is not authorized");
    });

    it("should allow buyer to create a buyer demand via /api/buyer-demands", async () => {
      const res = await request(app)
        .post("/api/buyer-demands")
        .set("Authorization", "Bearer valid-token-buyer")
        .set("firebase-uid", "uid-buyer")
        .send({
          crop: "Rice",
          requiredQuantity: 200,
          targetPricePerUnit: 2800,
        });

      expect(res.status).toBe(201);
    });

    it("should forbid a farmer from creating a buyer demand", async () => {
      const res = await request(app)
        .post("/api/buyer-demands")
        .set("Authorization", "Bearer valid-token-farmer")
        .set("firebase-uid", "uid123")
        .send({
          crop: "Rice",
          requiredQuantity: 200,
        });

      expect(res.status).toBe(403);
      expect(res.body.message).toContain("Access denied. Role 'farmer' is not authorized");
    });

    it("should allow FPO to fetch member roster via /api/fpo-members", async () => {
      const res = await request(app)
        .get("/api/fpo-members")
        .set("Authorization", "Bearer valid-token-fpo")
        .set("firebase-uid", "uid-fpo");

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
    });

    it("should forbid non-FPO / non-admin from fetching FPO roster", async () => {
      const res = await request(app)
        .get("/api/fpo-members")
        .set("Authorization", "Bearer valid-token-buyer")
        .set("firebase-uid", "uid-buyer");

      expect(res.status).toBe(403);
      expect(res.body.message).toContain("Access denied. Role 'buyer' is not authorized");
    });

    it("should convert offer to transaction when accepted via PATCH /api/agri-offers/:id/status", async () => {
      const res = await request(app)
        .patch("/api/agri-offers/off-123/status")
        .set("Authorization", "Bearer valid-token-farmer")
        .set("firebase-uid", "uid123")
        .send({ status: "Accepted" });

      expect(res.status).toBe(200);
      expect(res.body.status).toBe("Accepted");
      expect(res.body.transaction).toBeDefined();
    });

    it("should allow admin to resolve dispute via PATCH /api/disputes/:id/resolve", async () => {
      const res = await request(app)
        .patch("/api/disputes/disp-1/resolve")
        .set("Authorization", "Bearer valid-token-admin")
        .set("firebase-uid", "uid-admin")
        .send({ status: "Resolved", resolution: "Refund 10% to buyer" });

      expect(res.status).toBe(200);
      expect(res.body.status).toBe("Resolved");
    });

    it("should forbid non-admin from resolving dispute", async () => {
      const res = await request(app)
        .patch("/api/disputes/disp-1/resolve")
        .set("Authorization", "Bearer valid-token-farmer")
        .set("firebase-uid", "uid123")
        .send({ status: "Resolved" });

      expect(res.status).toBe(403);
    });
  });

  describe("Admin View User Passwords (GET /api/admin/users)", () => {
    it("should allow admin to view registered user passwords", async () => {
      // First, register a new user
      const registerRes = await request(app)
        .post("/api/auth/register")
        .send({
          name: "Test Pass User",
          email: "testpass@farm.com",
          username: "testpass",
          password: "SecretPassword123!",
          role: "farmer",
        });

      expect(registerRes.status).toBe(201);
      // Ensure regular response does not leak plain or hashed password
      expect(registerRes.body.user.password).toBeUndefined();
      expect(registerRes.body.user.plainPassword).toBeUndefined();

      // Now fetch as admin
      const adminRes = await request(app)
        .get("/api/admin/users")
        .set("Authorization", "Bearer valid-token-admin")
        .set("firebase-uid", "uid-admin");

      expect(adminRes.status).toBe(200);
      expect(Array.isArray(adminRes.body)).toBe(true);

      const targetUser = adminRes.body.find((u: any) => u.email === "testpass@farm.com");
      expect(targetUser).toBeDefined();
      expect(targetUser.plainPassword).toBe("SecretPassword123!");
      expect(targetUser.password).toBe("SecretPassword123!");
    });

    it("should reject non-admin users from viewing registered user passwords", async () => {
      const nonAdminRes = await request(app)
        .get("/api/admin/users")
        .set("Authorization", "Bearer valid-token-farmer")
        .set("firebase-uid", "uid123");

      expect(nonAdminRes.status).toBe(403);
    });
  });

  describe("Logistics & Storage User Role Registration and Updates", () => {
    it("should register a user with logistics role and not default to farmer", async () => {
      const regRes = await request(app)
        .post("/api/auth/register")
        .send({
          name: "Express Transporter",
          email: "transport@kisanlogistics.com",
          username: "expresstransport",
          password: "LogisticsPass123!",
          role: "logistics",
        });

      expect(regRes.status).toBe(201);
      expect(regRes.body.user).toBeDefined();
      expect(regRes.body.user.role).toBe("logistics");
    });

    it("should allow a user to update their role to logistics via PUT /api/user/role", async () => {
      const updateRes = await request(app)
        .put("/api/user/role")
        .set("Authorization", "Bearer valid-token-farmer")
        .set("firebase-uid", "uid123")
        .send({ role: "logistics" });

      expect(updateRes.status).toBe(200);
      expect(updateRes.body.role).toBe("logistics");
    });
  });
});

