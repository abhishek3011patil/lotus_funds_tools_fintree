import { describe, expect, it } from "vitest";
import { adminNavigation, superAdminNavigation } from "./roleNavigation";

describe("role navigation", () => {
  it("keeps governance links out of Admin navigation", () => {
    const labels = adminNavigation.map((item) => item.label);
    expect(labels).toContain("RA Verification");
    expect(labels).not.toContain("Admin Management");
    expect(labels).not.toContain("RA Governance");
  });

  it("includes platform governance in Super Admin navigation", () => {
    const labels = superAdminNavigation.map((item) => item.label);
    expect(labels).toContain("Admin Management");
    expect(labels).toContain("RA Governance");
    expect(labels).toContain("Broker Governance");
  });
});
