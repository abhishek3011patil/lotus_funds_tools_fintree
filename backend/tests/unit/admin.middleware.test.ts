import { describe, expect, it, vi } from "vitest";
import { requireAdmin } from "../../src/middlewares/admin.middleware";

const response = () => {
  const res = { status: vi.fn(), json: vi.fn() };
  res.status.mockReturnValue(res);
  return res;
};

describe("requireAdmin", () => {
  it.each(["ADMIN", "admin", "SUPERADMIN", "SUPER_ADMIN"])("allows %s", role => {
    const next = vi.fn();
    requireAdmin({ user: { role } } as never, response() as never, next);
    expect(next).toHaveBeenCalledOnce();
  });

  it("rejects an authenticated non-admin", () => {
    const res = response();
    const next = vi.fn();
    requireAdmin({ user: { role: "RA" } } as never, res as never, next);
    expect(res.status).toHaveBeenCalledWith(403);
    expect(next).not.toHaveBeenCalled();
  });

  it("rejects a request without an authenticated user", () => {
    const res = response();
    requireAdmin({} as never, res as never, vi.fn());
    expect(res.status).toHaveBeenCalledWith(401);
  });
});
