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

  it("creates a separate valid Errata layout with locked correction fields", () => {
    const template =
      createDefaultCallTemplate("ERRATA");

    expect(
      isValidCallTemplate(template, "ERRATA")
    ).toBe(true);
    expect(
      template.blocks.some(
        (block) =>
          block.type === "field" &&
          block.fieldKey === "errataHeading" &&
          block.locked
      )
    ).toBe(true);
    expect(
      template.blocks.some(
        (block) =>
          block.type === "field" &&
          block.fieldKey === "errataReason" &&
          block.locked
      )
    ).toBe(true);
    expect(
      isValidCallTemplate(template, "NEW_CALL")
    ).toBe(false);
  });

  it("formats Errata with its locked heading and reason", () => {
    const message = formatResearchCallMessage(
      createDefaultCallTemplate("ERRATA"),
      {
        ...callData,
        errataReason: "Corrected entry range.",
      },
      raData,
      "ERRATA"
    );

    expect(message).toContain("ERRATA / CORRECTION");
    expect(message).toContain(
      "Reason:\nCorrected entry range."
    );
    expect(message).toContain(
      "SEBI Registration No: INH000000000"
    );
    expect(message).toContain(
      "DISCLAIMER CUM DISCLOSURE:"
    );
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

  it("falls back safely for an invalid Errata template", () => {
    const fallback = () => "ORIGINAL ERRATA FORMAT";
    const invalidStorage = {
      getItem: () =>
        JSON.stringify(
          createDefaultCallTemplate("NEW_CALL")
        ),
    };

    expect(
      formatSavedResearchCallMessage(
        {
          ...callData,
          errataReason: "Correction reason",
        },
        raData,
        fallback,
        invalidStorage,
        "ERRATA"
      )
    ).toBe("ORIGINAL ERRATA FORMAT");
  });
});
