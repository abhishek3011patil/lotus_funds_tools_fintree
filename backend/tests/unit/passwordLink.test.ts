import { describe, expect, it } from "vitest";
import { getPasswordLinkMode } from "../../src/utils/passwordLink";

describe("getPasswordLinkMode", () => {
  it("uses setup for a newly approved inactive account", () => {
    expect(
      getPasswordLinkMode({
        role: "RESEARCH_ANALYST",
        status: "inactive",
        is_active: false,
        password_hash: null,
      })
    ).toBe("setup");
  });

  it("uses reset for an active account", () => {
    expect(
      getPasswordLinkMode({
        role: "CLIENT",
        status: "active",
        is_active: true,
        password_hash: "stored-hash",
      })
    ).toBe("reset");
  });

  it("supports an approved RA created by the legacy approval flow", () => {
    expect(
      getPasswordLinkMode({
        role: "RESEARCH_ANALYST",
        status: "inactive",
        is_active: false,
        password_hash: "temporary-hash",
        legacy_approved_ra: true,
      })
    ).toBe("reset");
  });

  it("does not activate an unrelated legacy inactive account", () => {
    expect(
      getPasswordLinkMode({
        role: "RESEARCH_ANALYST",
        status: "inactive",
        is_active: false,
        password_hash: "temporary-hash",
        legacy_approved_ra: false,
      })
    ).toBeNull();
  });

  it("does not issue links for suspended or unsupported accounts", () => {
    expect(
      getPasswordLinkMode({
        role: "RESEARCH_ANALYST",
        status: "suspended",
        is_active: true,
        password_hash: "stored-hash",
      })
    ).toBeNull();
    expect(
      getPasswordLinkMode({
        role: "ADMIN",
        status: "active",
        is_active: true,
        password_hash: "stored-hash",
      })
    ).toBeNull();
  });
});
