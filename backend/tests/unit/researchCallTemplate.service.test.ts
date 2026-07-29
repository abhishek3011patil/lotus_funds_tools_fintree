import { describe, expect, it } from "vitest";
import {
  isResearchCallMessageType,
  isValidResearchCallTemplate,
  parseResearchCallTemplateSnapshot,
} from "../../src/services/researchCallTemplate.service";

const fieldBlock = (key: string, locked: boolean) => ({
  id: `field:${key}`,
  type: "field",
  fieldKey: key,
  enabled: true,
  locked,
});

const newCallTemplate = {
  version: 1,
  blocks: [
    fieldBlock("recommendationHeading", false),
    fieldBlock("publishedAt", false),
    fieldBlock("instrument", true),
    fieldBlock("symbol", true),
    fieldBlock("exchange", false),
    fieldBlock("action", true),
    fieldBlock("callType", false),
    fieldBlock("entry", true),
    fieldBlock("target1", true),
    fieldBlock("target2", false),
    fieldBlock("target3", false),
    fieldBlock("stopLoss1", true),
    fieldBlock("stopLoss2", false),
    fieldBlock("stopLoss3", false),
    fieldBlock("expiry", false),
    fieldBlock("timeHorizon", true),
    fieldBlock("rationale", false),
    fieldBlock("underlyingStudy", false),
    fieldBlock("remarks", false),
    fieldBlock("raAttribution", true),
    fieldBlock("sebiRegistration", true),
    fieldBlock("contact", false),
    fieldBlock("email", false),
    fieldBlock("disclaimer", true),
  ],
};

const errataTemplate = {
  version: 1,
  blocks: [
    fieldBlock("errataHeading", true),
    fieldBlock("publishedAt", true),
    fieldBlock("instrument", true),
    fieldBlock("symbol", true),
    fieldBlock("exchange", false),
    fieldBlock("action", true),
    fieldBlock("callType", false),
    fieldBlock("entry", true),
    fieldBlock("target1", true),
    fieldBlock("target2", false),
    fieldBlock("target3", false),
    fieldBlock("stopLoss1", true),
    fieldBlock("stopLoss2", false),
    fieldBlock("stopLoss3", false),
    fieldBlock("expiry", false),
    fieldBlock("timeHorizon", true),
    fieldBlock("errataReason", true),
    fieldBlock("raAttribution", true),
    fieldBlock("sebiRegistration", true),
    fieldBlock("contact", false),
    fieldBlock("email", false),
    fieldBlock("disclaimer", true),
  ],
};

describe("research-call template validation", () => {
  it("recognizes only supported message types", () => {
    expect(isResearchCallMessageType("NEW_CALL")).toBe(
      true
    );
    expect(isResearchCallMessageType("ERRATA")).toBe(true);
    expect(isResearchCallMessageType("EXIT")).toBe(false);
  });

  it("accepts separate New Call and Errata templates", () => {
    expect(
      isValidResearchCallTemplate(
        newCallTemplate,
        "NEW_CALL"
      )
    ).toBe(true);
    expect(
      isValidResearchCallTemplate(
        errataTemplate,
        "ERRATA"
      )
    ).toBe(true);
  });

  it("does not allow a New Call template to replace Errata requirements", () => {
    expect(
      isValidResearchCallTemplate(
        newCallTemplate,
        "ERRATA"
      )
    ).toBe(false);
  });

  it("rejects disabled or altered required fields", () => {
    const corrupted = {
      ...errataTemplate,
      blocks: errataTemplate.blocks.map((block) =>
        block.fieldKey === "errataReason"
          ? { ...block, enabled: false }
          : block
      ),
    };

    expect(
      isValidResearchCallTemplate(
        corrupted,
        "ERRATA"
      )
    ).toBe(false);
  });

  it("rejects oversized custom text", () => {
    const corrupted = {
      ...newCallTemplate,
      blocks: [
        ...newCallTemplate.blocks,
        {
          id: "text:oversized",
          type: "text",
          text: "x".repeat(501),
          enabled: true,
          locked: false,
        },
      ],
    };

    expect(
      isValidResearchCallTemplate(
        corrupted,
        "NEW_CALL"
      )
    ).toBe(false);
  });

  it("parses only a valid snapshot for the matching message type", () => {
    expect(
      parseResearchCallTemplateSnapshot(
        JSON.stringify(errataTemplate),
        "ERRATA"
      )
    ).toEqual(errataTemplate);
    expect(
      parseResearchCallTemplateSnapshot(
        JSON.stringify(newCallTemplate),
        "ERRATA"
      )
    ).toBeNull();
    expect(
      parseResearchCallTemplateSnapshot(
        "{invalid-json",
        "NEW_CALL"
      )
    ).toBeNull();
  });
});
