import { describe, expect, it } from "vitest";
import {
  CALL_TEMPLATE_STORAGE_KEY,
  CALL_TEMPLATE_VERSION,
  createDefaultCallTemplate,
  formatResearchCallMessage,
  formatSavedResearchCallMessage,
  isValidCallTemplate,
  parseStoredCallTemplate,
  reorderTemplateBlocks,
  type CallTemplate,
} from "./researchCallTemplate.utils";

const callData = {
  publishedAt: "29 July 2026, 10:30 AM",
  instrument: "Example Industries",
  symbol: "EXAMPLE",
  exchange: "NSE / STOCK",
  action: "BUY",
  callType: "Cash",
  entry: "100 - 105",
  targets: [120, null, null],
  stopLosses: [95, null, null],
  expiry: "N/A",
  timeHorizon: "Short Term",
  holdingPeriod: "2 weeks",
};

const raData = {
  fullName: "Sample Analyst",
  organizationName: "Lotus Funds",
  sebiRegistrationNumber: "INH000000000",
  disclaimer: "Mandatory sample disclaimer.",
  disclaimerLink:
    "https://lotusfunds.com/disclaimer&disclosure",
};

describe("research-call template utilities", () => {
  it("creates a valid default with enabled mandatory blocks", () => {
    const template = createDefaultCallTemplate();

    expect(isValidCallTemplate(template)).toBe(true);
    expect(
      template.blocks
        .filter(
          (block) =>
            block.type === "field" && block.locked
        )
        .every((block) => block.enabled)
    ).toBe(true);
  });

  it("reorders blocks without dropping fields", () => {
    const template = createDefaultCallTemplate();
    const first = template.blocks[0].id;
    const second = template.blocks[1].id;
    const reordered = reorderTemplateBlocks(
      template,
      first,
      second
    );

    expect(reordered.blocks[1].id).toBe(first);
    expect(reordered.blocks).toHaveLength(
      template.blocks.length
    );
  });

  it("renders normalized custom plain text", () => {
    const template: CallTemplate = {
      ...createDefaultCallTemplate(),
      blocks: [
        ...createDefaultCallTemplate().blocks,
        {
          id: "text:test",
          type: "text",
          text: "  Custom   plain text  ",
          enabled: true,
          locked: false,
        },
      ],
    };

    const message = formatResearchCallMessage(
      template,
      callData,
      raData
    );

    expect(message).toContain("Custom plain text");
  });

  it("rejects a disabled mandatory block", () => {
    const template = createDefaultCallTemplate();
    const corrupted = {
      ...template,
      blocks: template.blocks.map((block) =>
        block.type === "field" &&
        block.fieldKey === "entry"
          ? { ...block, enabled: false }
          : block
      ),
    };

    expect(isValidCallTemplate(corrupted)).toBe(false);
  });

  it("restores defaults for corrupt or unsupported storage", () => {
    expect(
      isValidCallTemplate(
        parseStoredCallTemplate("{not-json")
      )
    ).toBe(true);
    expect(
      parseStoredCallTemplate(
        JSON.stringify({
          version: CALL_TEMPLATE_VERSION + 1,
          blocks: [],
        })
      )
    ).toEqual(createDefaultCallTemplate());
  });

  it("uses safe placeholders and omits missing optional targets", () => {
    const message = formatResearchCallMessage(
      createDefaultCallTemplate(),
      {
        ...callData,
        instrument: undefined,
      },
      raData
    );

    expect(message).toContain("Stock Name: N/A");
    expect(message).not.toContain("T2:");
    expect(message).not.toContain("T3:");
  });

  it("falls back when storage is missing, invalid, or inaccessible", () => {
    const fallback = () => "ORIGINAL FORMATTER";
    const missingStorage = {
      getItem: () => null,
    };
    const invalidStorage = {
      getItem: (key: string) =>
        key === CALL_TEMPLATE_STORAGE_KEY
          ? JSON.stringify({ version: 99, blocks: [] })
          : null,
    };
    const throwingStorage = {
      getItem: () => {
        throw new Error("Storage unavailable");
      },
    };

    expect(
      formatSavedResearchCallMessage(
        callData,
        raData,
        fallback,
        missingStorage
      )
    ).toBe("ORIGINAL FORMATTER");
    expect(
      formatSavedResearchCallMessage(
        callData,
        raData,
        fallback,
        invalidStorage
      )
    ).toBe("ORIGINAL FORMATTER");
    expect(
      formatSavedResearchCallMessage(
        callData,
        raData,
        fallback,
        throwingStorage
      )
    ).toBe("ORIGINAL FORMATTER");
  });
});
