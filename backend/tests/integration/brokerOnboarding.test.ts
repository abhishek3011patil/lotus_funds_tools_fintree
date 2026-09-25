import express from "express";
import request from "supertest";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../../src/db", () => ({ pool: { query: vi.fn(), connect: vi.fn() } }));
vi.mock("../../src/services/email", () => ({ emailService: { send: vi.fn() } }));
import { pool } from "../../src/db";
import { emailService } from "../../src/services/email";
import { requireBroker, addExistingAnalyst, removeBrokerAnalyst, createBrokerInvitation, listBrokerCalls, getBrokerInvitation } from "../../src/controllers/brokerOnboarding.controller";
import { hashBrokerInvitation, InvalidBrokerInvitation, registerRAWithBrokerInvitation } from "../../src/services/brokerOnboarding.service";

const app = express();
app.use(express.json());
app.use((req, _res, next) => { (req as any).user = { id: "broker-user", role: req.headers["x-test-role"] || "BROKER" }; next(); });
app.get("/invite/:token", getBrokerInvitation);
app.use(requireBroker);
app.post("/analysts", addExistingAnalyst);
app.delete("/analysts/:raId", removeBrokerAnalyst);
app.post("/invitations", createBrokerInvitation);
app.get("/calls", listBrokerCalls);

beforeEach(() => {
  vi.resetAllMocks();
  vi.mocked(pool.query).mockResolvedValue({ rows: [{ id: "broker-one", legal_name: "Broker One" }] } as any);
});

describe("broker onboarding boundaries", () => {
  it("rejects non-brokers without querying or mutating data", async () => {
    expect((await request(app).post("/analysts").set("x-test-role", "RESEARCH_ANALYST").send({ raId: "anything" })).status).toBe(403);
    expect(pool.query).not.toHaveBeenCalled();
  });
  it("rejects inactive broker accounts", async () => {
    vi.mocked(pool.query).mockResolvedValue({ rows: [] } as any);
    expect((await request(app).get("/calls")).status).toBe(403);
  });
  it("scopes calls to the authenticated broker and excludes drafts and superseded versions", async () => {
    await request(app).get("/calls").query({ brokerId: "other-broker" }).expect(200);
    const [sql, values] = vi.mocked(pool.query).mock.calls[1] as any;
    expect(values).toEqual(["broker-one"]);
    expect(sql).toContain("link.broker_id = $1");
    expect(sql).toContain("rc.status IN ('PUBLISHED', 'CLOSED')");
    expect(sql).toContain("rc.is_latest IS TRUE");
  });
  it("makes existing associations idempotent and validates RA eligibility", async () => {
    const raId = "00000000-0000-4000-8000-000000000001";
    await request(app).post("/analysts").send({ raId, brokerId: "other-broker" }).expect(201);
    const [sql, values] = vi.mocked(pool.query).mock.calls[1] as any;
    expect(values).toEqual(["broker-one", raId]);
    expect(sql).toContain("ON CONFLICT (broker_id, ra_id)");
    expect(sql).toContain("lower(ra.status) = 'approved' AND u.is_active = true");
  });
  it("stores only a hashed invitation token and reports email failure truthfully", async () => {
    vi.stubEnv("FRONTEND_URL", "https://example.test");
    vi.mocked(emailService.send).mockResolvedValue({ sent: false, skipped: true });
    const response = await request(app).post("/invitations").send({ method: "LINK", email: "RA@example.test", sendEmail: true }).expect(201);
    const token = response.body.registrationPath.split("=")[1];
    expect(token).toMatch(/^[a-f0-9]{64}$/);
    expect(response.body.emailSent).toBe(false);
    const values = vi.mocked(pool.query).mock.calls[1][1];
    expect(values).toEqual(["broker-one", hashBrokerInvitation(token), "ra@example.test", "LINK"]);
    vi.unstubAllEnvs();
  });
  it("rejects expired or consumed invitations", async () => {
    vi.mocked(pool.query).mockResolvedValue({ rows: [] } as any);
    await request(app).get(`/invite/${"a".repeat(64)}`).expect(410);
  });
});

describe("removing broker RA associations", () => {
  const raId = "00000000-0000-4000-8000-000000000001";
  it("requires broker access for removal", async () => {
    await request(app).delete(`/analysts/${raId}`).set("x-test-role", "RESEARCH_ANALYST").expect(403);
    expect(pool.query).not.toHaveBeenCalled();
  });
  it("rejects invalid RA IDs before updating data", async () => {
    await request(app).delete("/analysts/not-a-uuid").expect(400);
    expect(pool.query).toHaveBeenCalledTimes(1);
  });
  it("deactivates only the signed-in broker association, including on repeat requests", async () => {
    for (let attempt = 0; attempt < 2; attempt++) {
      await request(app).delete(`/analysts/${raId}`).send({ brokerId: "other-broker" }).expect(204);
    }
    const updates = vi.mocked(pool.query).mock.calls.filter(([sql]) => String(sql).includes("UPDATE"));
    expect(updates).toHaveLength(2);
    for (const [sql, values] of updates as any) {
      expect(values).toEqual(["broker-one", raId]);
      expect(sql).toContain("UPDATE broker_research_analysts SET status = 'INACTIVE'");
      expect(sql).toContain("WHERE broker_id = $1 AND ra_id = $2");
      expect(sql).not.toMatch(/DELETE|UPDATE\s+(users|ra_details|research_calls)\b/i);
    }
  });
  it("returns not found for an RA not associated with this broker", async () => {
    vi.mocked(pool.query).mockResolvedValueOnce({ rows: [{ id: "broker-one" }] } as any)
      .mockResolvedValueOnce({ rows: [] } as any);
    await request(app).delete(`/analysts/${raId}`).expect(404);
  });
});

describe("atomic invited registration", () => {
  const token = "b".repeat(64);
  const setup = (invite: unknown) => {
    const query = vi.fn().mockImplementation(async (sql: string) => ({ rows: sql.includes("FOR UPDATE") ? (invite ? [invite] : []) : [{ ra_id: "new-ra" }] }));
    const release = vi.fn();
    vi.mocked(pool.connect).mockResolvedValue({ query, release } as any);
    return { query, release };
  };
  it("creates registration, links the correct broker and consumes the token in one transaction", async () => {
    const { query, release } = setup({ id: "invite", broker_id: "broker-two", email: "ra@example.test", onboarding_method: "LINK" });
    await registerRAWithBrokerInvitation("INSERT RA", [], token, "ra@example.test");
    expect(query).toHaveBeenCalledWith(expect.stringContaining("broker_research_analysts"), ["broker-two", "new-ra", "LINK"]);
    expect(query).toHaveBeenCalledWith(expect.stringContaining("SET used_at"), ["invite", "new-ra"]);
    expect(query).toHaveBeenLastCalledWith("COMMIT");
    expect(release).toHaveBeenCalledOnce();
  });
  it.each([null, { email: "someone-else@example.test" }])("rolls back an invalid, reused or email-mismatched invitation", async invite => {
    const { query, release } = setup(invite);
    await expect(registerRAWithBrokerInvitation("INSERT RA", [], token, "ra@example.test")).rejects.toBeInstanceOf(InvalidBrokerInvitation);
    expect(query).not.toHaveBeenCalledWith("INSERT RA", []);
    expect(query).toHaveBeenLastCalledWith("ROLLBACK");
    expect(release).toHaveBeenCalledOnce();
  });
  it("rolls back registration if association fails", async () => {
    const { query } = setup({ id: "invite", broker_id: "broker-two", onboarding_method: "DIRECT" });
    query.mockImplementation(async (sql: string) => {
      if (sql.includes("INSERT INTO broker_research_analysts")) throw new Error("association failed");
      return { rows: sql.includes("FOR UPDATE") ? [{ id: "invite", broker_id: "broker-two", onboarding_method: "DIRECT" }] : [{ ra_id: "new-ra" }] };
    });
    await expect(registerRAWithBrokerInvitation("INSERT RA", [], token, "ra@example.test")).rejects.toThrow("association failed");
    expect(query).toHaveBeenLastCalledWith("ROLLBACK");
  });
  it("leaves standalone registration independent of broker tables", async () => {
    await registerRAWithBrokerInvitation("INSERT RA", ["ra"], undefined, "ra@example.test");
    expect(pool.query).toHaveBeenCalledWith("INSERT RA", ["ra"]);
    expect(pool.connect).not.toHaveBeenCalled();
  });
});
