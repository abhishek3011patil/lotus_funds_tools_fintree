import type { DisclaimerVersion } from "./disclaimer.types";

export const disclaimerVersions: DisclaimerVersion[] = [
  { id: "disc-platform-3", ownerType: "PLATFORM", ownerId: "platform", version: 3, text: "Investments in securities markets are subject to market risks. Read all related documents carefully before investing.", status: "ACTIVE", effectiveFrom: "2026-07-01", createdAt: "2026-06-25T10:00:00+05:30", createdBy: "Platform Governance" },
  { id: "disc-platform-2", ownerType: "PLATFORM", ownerId: "platform", version: 2, text: "Historical platform disclaimer retained for publications made during its effective period.", status: "RETIRED", effectiveFrom: "2025-10-01", createdAt: "2025-09-20T10:00:00+05:30", createdBy: "Platform Governance" },
  { id: "disc-platform-4", ownerType: "PLATFORM", ownerId: "platform", version: 4, text: "Draft platform disclaimer for preview only. Activation requires a future backend integration.", status: "DRAFT", effectiveFrom: null, createdAt: "2026-07-31T16:00:00+05:30", createdBy: "Platform Governance" },
];
