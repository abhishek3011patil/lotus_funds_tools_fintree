import * as XLSX from "xlsx";

export type ExportCellValue =
  | string
  | number
  | boolean
  | null
  | undefined;

export interface TableExportColumn<Row> {
  header: string;
  getValue: (row: Row) => ExportCellValue;
}

const FORMULA_PREFIX_PATTERN = /^[=+\-@]/;

export const sanitizeSpreadsheetValue = (
  value: ExportCellValue
): string | number | boolean => {
  if (value === null || value === undefined) {
    return "";
  }

  if (typeof value !== "string") {
    return value;
  }

  return FORMULA_PREFIX_PATTERN.test(value)
    ? `'${value}`
    : value;
};

export const buildExportMatrix = <Row>(
  rows: Row[],
  columns: TableExportColumn<Row>[]
): Array<Array<string | number | boolean>> => [
  columns.map((column) => column.header),
  ...rows.map((row) =>
    columns.map((column) =>
      sanitizeSpreadsheetValue(column.getValue(row))
    )
  ),
];

const escapeCsvCell = (
  value: string | number | boolean
): string => {
  const text = String(value);
  return /[",\r\n]/.test(text)
    ? `"${text.replace(/"/g, '""')}"`
    : text;
};

export const buildCsvContent = <Row>(
  rows: Row[],
  columns: TableExportColumn<Row>[]
): string =>
  buildExportMatrix(rows, columns)
    .map((row) => row.map(escapeCsvCell).join(","))
    .join("\r\n");

const triggerDownload = (
  contents: BlobPart,
  mimeType: string,
  fileName: string
) => {
  const blob = new Blob([contents], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");

  anchor.href = url;
  anchor.download = fileName;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
};

export const exportTableToCsv = <Row>(
  rows: Row[],
  columns: TableExportColumn<Row>[],
  fileName: string
) => {
  const csv = buildCsvContent(rows, columns);
  triggerDownload(
    `\uFEFF${csv}`,
    "text/csv;charset=utf-8",
    fileName
  );
};

export const exportTableToExcel = <Row>(
  rows: Row[],
  columns: TableExportColumn<Row>[],
  fileName: string
) => {
  const worksheet = XLSX.utils.aoa_to_sheet(
    buildExportMatrix(rows, columns)
  );
  const workbook = XLSX.utils.book_new();

  XLSX.utils.book_append_sheet(
    workbook,
    worksheet,
    "Recommendations"
  );
  XLSX.writeFile(workbook, fileName);
};

export const printTable = <Row>(
  rows: Row[],
  columns: TableExportColumn<Row>[],
  title: string
) => {
  const printWindow = window.open(
    "",
    "_blank",
    "noopener,noreferrer"
  );

  if (!printWindow) {
    throw new Error("Unable to open the print window.");
  }

  const documentTitle =
    printWindow.document.createElement("title");
  documentTitle.textContent = title;
  printWindow.document.head.appendChild(documentTitle);

  const style = printWindow.document.createElement("style");
  style.textContent = `
    body { font-family: Arial, sans-serif; margin: 24px; }
    h1 { font-size: 18px; margin-bottom: 16px; }
    table { border-collapse: collapse; width: 100%; }
    th, td { border: 1px solid #d1d5db; padding: 6px; text-align: left; font-size: 11px; }
    th { background: #f3f4f6; }
  `;
  printWindow.document.head.appendChild(style);

  const heading = printWindow.document.createElement("h1");
  heading.textContent = title;
  printWindow.document.body.appendChild(heading);

  const table = printWindow.document.createElement("table");
  const tableHead =
    printWindow.document.createElement("thead");
  const headingRow =
    printWindow.document.createElement("tr");

  columns.forEach((column) => {
    const cell = printWindow.document.createElement("th");
    cell.textContent = column.header;
    headingRow.appendChild(cell);
  });

  tableHead.appendChild(headingRow);
  table.appendChild(tableHead);

  const tableBody =
    printWindow.document.createElement("tbody");
  rows.forEach((row) => {
    const tableRow =
      printWindow.document.createElement("tr");

    columns.forEach((column) => {
      const cell = printWindow.document.createElement("td");
      const value = column.getValue(row);
      cell.textContent =
        value === null || value === undefined
          ? ""
          : String(value);
      tableRow.appendChild(cell);
    });

    tableBody.appendChild(tableRow);
  });

  table.appendChild(tableBody);
  printWindow.document.body.appendChild(table);
  printWindow.focus();
  printWindow.print();
};

export const formatExportDate = (
  value: string | null | undefined
): string => {
  if (!value) {
    return "";
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  const pad = (part: number) =>
    String(part).padStart(2, "0");

  return [
    date.getFullYear(),
    pad(date.getMonth() + 1),
    pad(date.getDate()),
  ].join("-") + ` ${pad(date.getHours())}:${pad(date.getMinutes())}`;
};

export const createDatedExportFileName = (
  baseName: string,
  extension: "csv" | "xlsx"
): string => {
  const date = new Date();
  const day = [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, "0"),
    String(date.getDate()).padStart(2, "0"),
  ].join("-");

  return `${baseName}-${day}.${extension}`;
};
