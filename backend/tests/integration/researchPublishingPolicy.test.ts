import express from "express";
import request from "supertest";
import {
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from "vitest";

vi.mock("../../src/db", () => ({
  pool: {
    query: vi.fn(),
  },
}));

import { pool } from "../../src/db";
import { requireResearchPublishingAuthorization } from "../../src/middlewares/researchPublishingPolicy.middleware";

const queryMock = vi.mocked(pool.query);

const eligibleActor = {
  role: "RESEARCH_ANALYST",
  user_status: "active",
  is_active: true,
  ra_status: "approved",
  sebi_reg_no: "INH000000001",
  sebi_expiry_date: "2027-08-06",
  sebi_is_valid: true,
  nism_reg_no: "NISM-RA-000001",
  nism_valid_till: "2027-08-06",
  nism_certificate: "/uploads/nism.pdf",
  nism_is_valid: true,
  has_publish_entitlement: true,
};

const createApp = ({
  authenticated = true,
  jwtRole = "RESEARCH_ANALYST",
}: {
  authenticated?: boolean;
  jwtRole?: string;
} = {}) => {
  const app = express();
  app.use(express.json());

  app.post(
    "/publish",
    (req, _res, next) => {
      if (authenticated) {
        (req as any).user = {
          id: "user-1",
          role: jwtRole,
        };
      }
      next();
    },
    requireResearchPublishingAuthorization,
    (req, res) => {
      res.status(201).json({
        success: true,
        role: (req as any).user.role,
      });
    }
  );

  return app;
};

const mockActor = (
  overrides: Partial<typeof eligibleActor>
) => {
  queryMock.mockResolvedValueOnce({
    rows: [
      {
        ...eligibleActor,
        ...overrides,
      },
    ],
  } as any);
};

describe("research publishing policy", () => {
  beforeEach(() => {
    queryMock.mockReset();
  });

  it("rejects an unauthenticated request", async () => {
    const response = await request(
      createApp({ authenticated: false })
    ).post("/publish");

    expect(response.status).toBe(401);
    expect(response.body.code).toBe(
      "AUTH_REQUIRED"
    );
    expect(queryMock).not.toHaveBeenCalled();
  });

  it.each(["CLIENT", "BROKER"])(
    "rejects the database role %s",
    async (role) => {
      mockActor({ role });

      const response = await request(
        createApp()
      ).post("/publish");

      expect(response.status).toBe(403);
      expect(response.body.code).toBe(
        "RA_ROLE_REQUIRED"
      );
    }
  );

  it("rejects a suspended account", async () => {
    mockActor({
      user_status: "suspended",
      is_active: false,
    });

    const response = await request(
      createApp()
    ).post("/publish");

    expect(response.status).toBe(403);
    expect(response.body.code).toBe(
      "ACCOUNT_NOT_ACTIVE"
    );
  });

  it("rejects a suspended RA profile", async () => {
    mockActor({ ra_status: "suspended" });

    const response = await request(
      createApp()
    ).post("/publish");

    expect(response.status).toBe(403);
    expect(response.body.code).toBe(
      "RA_NOT_APPROVED"
    );
  });

  it("rejects an expired SEBI registration", async () => {
    mockActor({
      sebi_expiry_date: "2026-08-05",
      sebi_is_valid: false,
    });

    const response = await request(
      createApp()
    ).post("/publish");

    expect(response.status).toBe(403);
    expect(response.body.code).toBe(
      "SEBI_REGISTRATION_EXPIRED"
    );
  });

  it("rejects an unverified SEBI registration", async () => {
    mockActor({ sebi_reg_no: "" });

    const response = await request(
      createApp()
    ).post("/publish");

    expect(response.status).toBe(403);
    expect(response.body.code).toBe(
      "SEBI_VERIFICATION_REQUIRED"
    );
  });

  it("rejects a missing NISM registration", async () => {
    mockActor({ nism_reg_no: "" });

    const response = await request(
      createApp()
    ).post("/publish");

    expect(response.status).toBe(403);
    expect(response.body.code).toBe(
      "NISM_VERIFICATION_REQUIRED"
    );
  });

  it("rejects a missing NISM certificate", async () => {
    mockActor({ nism_certificate: "" });

    const response = await request(
      createApp()
    ).post("/publish");

    expect(response.status).toBe(403);
    expect(response.body.code).toBe(
      "NISM_VERIFICATION_REQUIRED"
    );
  });

  it("rejects an expired NISM certification", async () => {
    mockActor({
      nism_valid_till: "2026-08-05",
      nism_is_valid: false,
    });

    const response = await request(
      createApp()
    ).post("/publish");

    expect(response.status).toBe(403);
    expect(response.body.code).toBe(
      "NISM_CERTIFICATION_EXPIRED"
    );
  });

  it("ignores forged JWT and request plan claims", async () => {
    mockActor({
      has_publish_entitlement: false,
    });

    const response = await request(
      createApp({ jwtRole: "RESEARCH_ANALYST" })
    )
      .post("/publish")
      .send({
        planId: "forged-ra-plan",
        planCode: "RA_UNLIMITED",
      });

    expect(response.status).toBe(403);
    expect(response.body.code).toBe(
      "PUBLISH_ENTITLEMENT_REQUIRED"
    );
    expect(queryMock).toHaveBeenCalledWith(
      expect.stringContaining(
        "subscription.user_id = account.id"
      ),
      ["user-1"]
    );
  });

  it("uses the database role and allows an eligible RA", async () => {
    mockActor({});

    const response = await request(
      createApp({ jwtRole: "CLIENT" })
    ).post("/publish");

    expect(response.status).toBe(201);
    expect(response.body).toEqual({
      success: true,
      role: "RESEARCH_ANALYST",
    });
  });

  it("denies by default when the database check fails", async () => {
    queryMock.mockRejectedValueOnce(
      new Error("database unavailable")
    );

    const response = await request(
      createApp()
    ).post("/publish");

    expect(response.status).toBe(503);
    expect(response.body.code).toBe(
      "PUBLISH_AUTHORIZATION_UNAVAILABLE"
    );
  });
});
