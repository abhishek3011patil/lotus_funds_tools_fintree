import { describe, expect, it } from "vitest";
import { brokerSidebarItems } from "./brokerNavigation";

describe("Broker navigation", () => {
  it("contains only the permitted Broker sections", () => {
    expect(brokerSidebarItems.map((item) => item.label)).toEqual([
      "Dashboard", "Research Calls", "Research Analysts", "Clients", "Performance",
      "Announcements", "Branding", "Subscription", "Notifications", "Settings",
    ]);
  });

  it("does not expose research or governance mutations", () => {
    const labels = brokerSidebarItems.map((item) => item.label).join(" ");
    expect(labels).not.toMatch(/create|approve|suspend|delete/i);
  });
});
