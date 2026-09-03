import { describe, expect, it } from "vitest";
import { isValidEmail } from "../../src/utils/validation";

describe("isValidEmail", () => {
  it.each([
    "admin@example.com",
    "first.last+tag@example.co.in",
    " USER@EXAMPLE.COM ",
  ])("accepts a valid email: %s", (email) => {
    expect(isValidEmail(email)).toBe(true);
  });

  it.each([
    "",
    "admin",
    "admin@",
    "admin@example",
    "admin @example.com",
    "admin@example .com",
    null,
    undefined,
  ])("rejects an invalid email: %s", (email) => {
    expect(isValidEmail(email)).toBe(false);
  });
});
