import { disclaimerVersions } from "./disclaimer.mock";
import type { DisclaimerDraftInput, DisclaimerVersion } from "./disclaimer.types";

export interface DisclaimerService {
  getDisclaimerVersions(): Promise<DisclaimerVersion[]>;
  getDisclaimerVersionById(id: string): Promise<DisclaimerVersion | null>;
  createDisclaimerDraft(input: DisclaimerDraftInput): Promise<DisclaimerVersion>;
  activateDisclaimerVersion(id: string): Promise<never>;
}

export const disclaimerService: DisclaimerService = {
  getDisclaimerVersions: async () => disclaimerVersions,
  getDisclaimerVersionById: async (id) => disclaimerVersions.find((item) => item.id === id) ?? null,
  createDisclaimerDraft: async (input) => ({ id: `preview-${Date.now()}`, ...input, version: Math.max(...disclaimerVersions.map((item) => item.version)) + 1, status: "DRAFT", effectiveFrom: null, createdAt: new Date().toISOString(), createdBy: "Current user (preview)" }),
  activateDisclaimerVersion: async () => { throw new Error("Disclaimer activation API is not connected."); },
};
