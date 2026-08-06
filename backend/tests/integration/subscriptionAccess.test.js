"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const supertest_1 = __importDefault(require("supertest"));
const vitest_1 = require("vitest");
vitest_1.vi.mock("../../src/db", () => ({
    pool: {
        query: vitest_1.vi.fn(),
        connect: vitest_1.vi.fn(),
    },
}));
vitest_1.vi.mock("../../src/services/subscriptionAccess.service", async () => {
    const actual = await vitest_1.vi.importActual("../../src/services/subscriptionAccess.service");
    return {
        ...actual,
        expireDueSubscriptions: vitest_1.vi.fn().mockResolvedValue(0),
    };
});
const db_1 = require("../../src/db");
const subscriptionAccess_middleware_1 = require("../../src/middlewares/subscriptionAccess.middleware");
const queryMock = vitest_1.vi.mocked(db_1.pool.query);
const connectMock = vitest_1.vi.mocked(db_1.pool.connect);
const createApp = ({ authenticated = true, role = "RA", } = {}) => {
    const app = (0, express_1.default)();
    app.post("/protected", (req, _res, next) => {
        if (authenticated) {
            req.user = {
                id: "user-1",
                role,
            };
        }
        next();
    }, subscriptionAccess_middleware_1.requireActiveSubscription, (0, subscriptionAccess_middleware_1.requireSubscriptionFeature)("RA_RESEARCH_CALLS"), (_req, res) => {
        res.status(201).json({ success: true });
    });
    return app;
};
const activeSubscription = {
    id: "subscription-1",
    user_id: "user-1",
    plan_id: "plan-1",
    status: "ACTIVE",
    starts_at: "2026-07-01T00:00:00.000Z",
    expires_at: "2026-08-01T00:00:00.000Z",
    plan_code_snapshot: "RA_TEST",
    plan_name_snapshot: "RA Test Plan",
    tier_code_snapshot: "TEST",
    audience_type: "RA",
};
const createLimitApp = () => {
    const app = (0, express_1.default)();
    app.post("/limited", (req, _res, next) => {
        req.subscription = {
            id: "subscription-1",
            userId: "user-1",
            planId: "plan-1",
            status: "ACTIVE",
            audienceType: "RA",
            planCode: "RA_TEST",
            planName: "RA Test Plan",
            tierCode: "TEST",
            startsAt: "2026-07-01T00:00:00.000Z",
            expiresAt: "2026-08-01T00:00:00.000Z",
            featureValues: {},
        };
        next();
    }, (0, subscriptionAccess_middleware_1.reserveSubscriptionEventLimit)({
        limitKey: "RA_RESEARCH_CALLS_PER_MONTH",
    }), (_req, res) => {
        res.status(201).json({ success: true });
    });
    return app;
};
(0, vitest_1.describe)("subscription access middleware", () => {
    (0, vitest_1.beforeEach)(() => {
        queryMock.mockReset();
        connectMock.mockReset();
    });
    (0, vitest_1.it)("rejects an unauthenticated request", async () => {
        const response = await (0, supertest_1.default)(createApp({ authenticated: false })).post("/protected");
        (0, vitest_1.expect)(response.status).toBe(401);
        (0, vitest_1.expect)(response.body.code).toBe("AUTH_REQUIRED");
        (0, vitest_1.expect)(queryMock).not.toHaveBeenCalled();
    });
    (0, vitest_1.it)("rejects a role that cannot own a subscription", async () => {
        const response = await (0, supertest_1.default)(createApp({ role: "ADMIN" })).post("/protected");
        (0, vitest_1.expect)(response.status).toBe(403);
        (0, vitest_1.expect)(response.body.code).toBe("SUBSCRIPTION_ROLE_NOT_SUPPORTED");
        (0, vitest_1.expect)(queryMock).not.toHaveBeenCalled();
    });
    (0, vitest_1.it)("rejects a user without an active subscription", async () => {
        queryMock
            .mockResolvedValueOnce({ rows: [] })
            .mockResolvedValueOnce({ rows: [] });
        const response = await (0, supertest_1.default)(createApp()).post("/protected");
        (0, vitest_1.expect)(response.status).toBe(403);
        (0, vitest_1.expect)(response.body.code).toBe("ACTIVE_SUBSCRIPTION_REQUIRED");
        (0, vitest_1.expect)(response.body.nextStep).toBe("PURCHASE_SUBSCRIPTION");
    });
    (0, vitest_1.it)("returns the renewal response for an expired subscription", async () => {
        queryMock
            .mockResolvedValueOnce({ rows: [] })
            .mockResolvedValueOnce({
            rows: [
                {
                    status: "EXPIRED",
                    starts_at: "2026-06-01T00:00:00.000Z",
                    expires_at: "2026-07-01T00:00:00.000Z",
                    plan_name_snapshot: "Expired Plan",
                    tier_code_snapshot: "BASIC",
                },
            ],
        });
        const response = await (0, supertest_1.default)(createApp()).post("/protected");
        (0, vitest_1.expect)(response.status).toBe(403);
        (0, vitest_1.expect)(response.body.message).toBe("Your subscription has expired.");
        (0, vitest_1.expect)(response.body.nextStep).toBe("RENEW_SUBSCRIPTION");
    });
    (0, vitest_1.it)("rejects a plan that does not include research calls", async () => {
        queryMock
            .mockResolvedValueOnce({ rows: [activeSubscription] })
            .mockResolvedValueOnce({ rows: [] });
        const response = await (0, supertest_1.default)(createApp()).post("/protected");
        (0, vitest_1.expect)(response.status).toBe(403);
        (0, vitest_1.expect)(response.body.code).toBe("SUBSCRIPTION_FEATURE_NOT_INCLUDED");
        (0, vitest_1.expect)(response.body.featureKey).toBe("RA_RESEARCH_CALLS");
    });
    (0, vitest_1.it)("allows an active RA plan with research-call access", async () => {
        queryMock
            .mockResolvedValueOnce({ rows: [activeSubscription] })
            .mockResolvedValueOnce({
            rows: [
                {
                    feature_key: "RA_RESEARCH_CALLS",
                    value_type: "BOOLEAN",
                    is_enabled: true,
                    numeric_value: null,
                    text_value: null,
                },
            ],
        });
        const response = await (0, supertest_1.default)(createApp()).post("/protected");
        (0, vitest_1.expect)(response.status).toBe(201);
        (0, vitest_1.expect)(response.body).toEqual({ success: true });
    });
    (0, vitest_1.it)("allows an unlimited research-call plan", async () => {
        const clientQuery = vitest_1.vi
            .fn()
            .mockResolvedValueOnce({ rows: [] })
            .mockResolvedValueOnce({
            rows: [
                {
                    id: "subscription-1",
                    starts_at: "2026-07-01T00:00:00.000Z",
                    expires_at: "2026-08-01T00:00:00.000Z",
                    display_name: "Monthly research calls",
                    limit_value: null,
                    is_unlimited: true,
                    enforcement_mode: "EVENT_COUNT",
                    reset_period: "MONTH",
                },
            ],
        })
            .mockResolvedValueOnce({ rows: [] });
        connectMock.mockResolvedValue({
            query: clientQuery,
            release: vitest_1.vi.fn(),
        });
        const response = await (0, supertest_1.default)(createLimitApp()).post("/limited");
        (0, vitest_1.expect)(response.status).toBe(201);
        (0, vitest_1.expect)(response.body).toEqual({ success: true });
        (0, vitest_1.expect)(clientQuery).toHaveBeenCalledWith("COMMIT");
    });
    (0, vitest_1.it)("rejects a request after the monthly limit is reached", async () => {
        const clientQuery = vitest_1.vi
            .fn()
            .mockResolvedValueOnce({ rows: [] })
            .mockResolvedValueOnce({
            rows: [
                {
                    id: "subscription-1",
                    starts_at: "2026-07-01T00:00:00.000Z",
                    expires_at: "2026-08-01T00:00:00.000Z",
                    display_name: "Monthly research calls",
                    limit_value: 25,
                    is_unlimited: false,
                    enforcement_mode: "EVENT_COUNT",
                    reset_period: "MONTH",
                },
            ],
        })
            .mockResolvedValueOnce({ rows: [] })
            .mockResolvedValueOnce({ rows: [] })
            .mockResolvedValueOnce({ rows: [{ used: "25" }] })
            .mockResolvedValueOnce({ rows: [] });
        connectMock.mockResolvedValue({
            query: clientQuery,
            release: vitest_1.vi.fn(),
        });
        const response = await (0, supertest_1.default)(createLimitApp()).post("/limited");
        (0, vitest_1.expect)(response.status).toBe(429);
        (0, vitest_1.expect)(response.body.code).toBe("SUBSCRIPTION_LIMIT_REACHED");
        (0, vitest_1.expect)(response.body.limit).toMatchObject({
            maximum: 25,
            used: 25,
            remaining: 0,
        });
    });
});
