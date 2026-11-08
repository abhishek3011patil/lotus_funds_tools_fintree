import crypto from "crypto";
import express from "express";
import request from "supertest";
import { beforeEach, describe, expect, it, vi } from "vitest";

const provider = vi.hoisted(() => ({ create: vi.fn(), order: vi.fn(), payment: vi.fn() }));
vi.mock("razorpay", () => ({ default: class { orders = { create: provider.create, fetch: provider.order }; payments = { fetch: provider.payment }; } }));
vi.mock("../../src/db", () => ({ pool: { query: vi.fn() } }));
vi.mock("../../src/utils/auditLogger", () => ({ createAuditLog: vi.fn() }));
import { pool } from "../../src/db";
import { createOrder, verifyPayment, activateFreePlan } from "../../src/controllers/payment.controller";
const app = express(); app.use(express.json());
app.post("/order", createOrder); app.post("/verify", verifyPayment); app.post("/free", activateFreePlan);
const token = "a-valid-reset-token-long-enough";
const session = { id: "user-one", role: "RESEARCH_ANALYST", payment_status: "pending", razorpay_order_id: "order-one", plan_selected: "RA Starter" };

describe("legacy payment session security", () => {
  beforeEach(() => { vi.resetAllMocks(); vi.stubEnv("RAZORPAY_KEY_ID", "rzp_test_key"); vi.stubEnv("RAZORPAY_KEY_SECRET", "test-secret"); });
  it("rejects order creation for an already paid account", async () => {
    vi.mocked(pool.query).mockResolvedValueOnce({ rows: [{ ...session, payment_status: "completed" }] } as any);
    await request(app).post("/order").send({ resetToken: token, planName: "RA Starter" }).expect(409);
    expect(provider.create).not.toHaveBeenCalled();
  });
  it("rejects verification for an order belonging to another session", async () => {
    vi.mocked(pool.query).mockResolvedValueOnce({ rows: [session] } as any);
    await request(app).post("/verify").send({ resetToken: token, razorpay_order_id: "other-order", razorpay_payment_id: "pay-one", razorpay_signature: "00" }).expect(403);
    expect(provider.payment).not.toHaveBeenCalled();
  });
  it("rejects captured payments with the wrong amount", async () => {
    vi.mocked(pool.query).mockResolvedValueOnce({ rows: [session] } as any);
    provider.order.mockResolvedValue({ amount: 149900, currency: "INR" });
    provider.payment.mockResolvedValue({ order_id: "order-one", amount: 1, currency: "INR", status: "captured" });
    const signature = crypto.createHmac("sha256", "test-secret").update("order-one|pay-one").digest("hex");
    await request(app).post("/verify").send({ resetToken: token, razorpay_order_id: "order-one", razorpay_payment_id: "pay-one", razorpay_signature: signature }).expect(409);
    expect(pool.query).toHaveBeenCalledTimes(1);
  });
  it("does not let an RA activate the client free plan", async () => {
    vi.mocked(pool.query).mockResolvedValueOnce({ rows: [session] } as any);
    await request(app).post("/free").send({ resetToken: token }).expect(403);
  });
});
