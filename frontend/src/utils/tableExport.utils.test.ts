import { describe, expect, it } from "vitest";
import {
  buildCsvContent,
  buildExportMatrix,
  formatExportDate,
  sanitizeSpreadsheetValue,
  type TableExportColumn,
} from "./tableExport.utils";

type Row = {
  name: string | null;
  amount: number | null;
  note: string | null;
};

const columns: TableExportColumn<Row>[] = [
  {
    header: "Display Name",
    getValue: (row) => row.name,
  },
  {
    header: "Amount",
    getValue: (row) => row.amount,
  },
  {
    header: "Note",
    getValue: (row) => row.note,
  },
];

describe("table export utilities", () => {
  it("preserves selected column order and numeric cells", () => {
    const matrix = buildExportMatrix(
      [{ name: "Alpha", amount: 42.5, note: null }],
      columns
    );

    expect(matrix[0]).toEqual([
      "Display Name",
      "Amount",
      "Note",
    ]);
    expect(matrix[1]).toEqual(["Alpha", 42.5, ""]);
    expect(typeof matrix[1][1]).toBe("number");
  });

  it("returns only headers for empty rows", () => {
    expect(buildExportMatrix([], columns)).toEqual([
      ["Display Name", "Amount", "Note"],
    ]);
  });

  it("escapes CSV quotes, commas, and line breaks", () => {
    const csv = buildCsvContent(
      [
        {
          name: 'Alpha, "Growth"',
          amount: null,
          note: "Line one\nLine two",
        },
      ],
      columns
    );

    expect(csv).toContain('"Alpha, ""Growth"""');
    expect(csv).toContain('"Line one\nLine two"');
  });

  it.each(["=SUM(A1:A2)", "+cmd", "-cmd", "@cmd"])(
    "prevents spreadsheet formula injection for %s",
    (value) => {
      expect(sanitizeSpreadsheetValue(value)).toBe(
        `'${value}`
      );
    }
  );

  it("does not convert numeric values to text", () => {
    expect(sanitizeSpreadsheetValue(-25)).toBe(-25);
  });

  it("formats dates consistently and preserves invalid input", () => {
    expect(
      formatExportDate("2026-07-29T10:15:00")
    ).toBe("2026-07-29 10:15");
    expect(formatExportDate("not-a-date")).toBe(
      "not-a-date"
    );
    expect(formatExportDate(null)).toBe("");
  });
});
