export type DisclaimerOwnerType = "RA" | "BROKER" | "PLATFORM";
export type DisclaimerStatus = "DRAFT" | "ACTIVE" | "RETIRED";

export type DisclaimerVersion = {
  id: string;
  ownerType: DisclaimerOwnerType;
  ownerId: string;
  version: number;
  text: string;
  status: DisclaimerStatus;
  effectiveFrom: string | null;
  createdAt: string;
  createdBy: string;
};

export type DisclaimerDraftInput = Pick<DisclaimerVersion, "ownerType" | "ownerId" | "text">;
