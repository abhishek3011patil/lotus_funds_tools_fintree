import { describe, expect, it } from "vitest";
import { getDefaultRouteForRole, normalizeRole } from "./role.utils";

describe("role routing", () => {
  it("normalizes legacy role aliases", () => {
    expect(normalizeRole("ra")).toBe("RESEARCH_ANALYST");
    expect(normalizeRole("SUPER_ADMIN")).toBe("SUPERADMIN");
  });

  it("redirects each authenticated role to its own section", () => {
    expect(getDefaultRouteForRole("BROKER")).toBe("/broker/dashboard");
    expect(getDefaultRouteForRole("ADMIN")).toBe("/admin/dashboard");
    expect(getDefaultRouteForRole("SUPERADMIN")).toBe("/super-admin/dashboard");
    expect(getDefaultRouteForRole("RESEARCH_ANALYST")).toBe("/recommendations");
    expect(getDefaultRouteForRole("CLIENT")).toBe("/client/dashboard");
  });
});
