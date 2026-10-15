import type { CompanyBrand } from "../../services/companyBrands.service";

export const DATA_FIELDS = [
  { key: "todayFiiCash", label: "FII Cash", group: "today" },
  { key: "todayDiiCash", label: "DII Cash", group: "today" },
  { key: "todayFiiIdxFut", label: "FII IDX FUT", group: "today" },
  { key: "todayFiiIdxOpt", label: "FII IDX OPT", group: "today" },
  { key: "todayFiiStxFut", label: "FII STX FUT", group: "today" },
  { key: "todayFiiStxOpt", label: "FII STX OPT", group: "today" },
  { key: "weekFiiCash", label: "FII Cash", group: "week" },
  { key: "weekDiiCash", label: "DII Cash", group: "week" },
  { key: "monthFiiCash", label: "FII Cash", group: "month" },
  { key: "monthDiiCash", label: "DII Cash", group: "month" },
  { key: "fyFiiCash", label: "FII Cash", group: "fy" },
  { key: "fyDiiCash", label: "DII Cash", group: "fy" },
] as const;

export type DataKey = typeof DATA_FIELDS[number]["key"];
export type FiiDiiData = {
  date: string;
  values: Record<DataKey, string>;
  giftTime: string;
  giftLevel: string;
  giftChange: string;
};

export const emptyFiiDiiData = (): FiiDiiData => ({
  date: (() => { const today = new Date(); return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`; })(),
  values: Object.fromEntries(DATA_FIELDS.map(field => [field.key, ""])) as Record<DataKey, string>,
  giftTime: "",
  giftLevel: "",
  giftChange: "",
});

const escapeXml = (value: string) => value.replace(/[&<>"']/g, char => ({
  "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&apos;",
})[char]!);

export const formatAmount = (raw: string) => {
  if (raw.trim() === "") return "—";
  const number = Number(raw.replace(/,/g, ""));
  if (!Number.isFinite(number)) return "—";
  const text = new Intl.NumberFormat("en-IN", { minimumFractionDigits: 1, maximumFractionDigits: 1 }).format(Math.abs(number));
  return `${number < 0 ? "−" : number > 0 ? "+" : ""}${text}`;
};

const formatDate = (raw: string) => {
  const date = new Date(`${raw}T12:00:00`);
  if (!Number.isFinite(date.getTime())) return "SELECT A DATE";
  const day = date.getDate();
  const suffix = day % 100 >= 11 && day % 100 <= 13 ? "TH" : ({ 1: "ST", 2: "ND", 3: "RD" } as Record<number, string>)[day % 10] || "TH";
  const weekday = new Intl.DateTimeFormat("en-US", { weekday: "long" }).format(date).toUpperCase();
  const month = new Intl.DateTimeFormat("en-US", { month: "long" }).format(date).toUpperCase();
  return `${weekday}, ${month} ${day}${suffix} ${date.getFullYear()}`;
};

const readableText = (color: string) => {
  const channels = [1, 3, 5].map(offset => parseInt(color.slice(offset, offset + 2), 16) / 255);
  const [r, g, b] = channels.map(value => value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4);
  return 0.2126 * r + 0.7152 * g + 0.0722 * b > 0.42 ? "#163249" : "#ffffff";
};

const table = (heading: string, x: number, y: number, width: number, rows: Array<[string, string]>, color: string, textColor: string, rowHeight: number) => {
  const split = x + width * 0.51;
  const headingHeight = 90;
  const bodyTop = y + headingHeight;
  const bodyBottom = bodyTop + rows.length * rowHeight;
  return `<g>
    <rect x="${x}" y="${y}" width="${width}" height="${headingHeight}" fill="${color}" />
    <text x="${x + width / 2}" y="${y + 59}" fill="${textColor}" text-anchor="middle" class="section">${escapeXml(heading)}</text>
    <rect x="${x}" y="${bodyTop}" width="${width}" height="${rows.length * rowHeight}" fill="#fff" stroke="#17374c" stroke-width="2.5" />
    <line x1="${split}" y1="${bodyTop}" x2="${split}" y2="${bodyBottom}" stroke="#17374c" stroke-width="2.5" />
    ${rows.map(([label, value], index) => {
      const rowY = bodyTop + index * rowHeight;
      return `<g>${index ? `<line x1="${x}" y1="${rowY}" x2="${x + width}" y2="${rowY}" stroke="#17374c" stroke-width="2.5" />` : ""}
        <text x="${x + (split - x) / 2}" y="${rowY + rowHeight / 2 + 13}" text-anchor="middle" class="cell-label">${escapeXml(label)}</text>
        <text x="${split + (x + width - split) / 2}" y="${rowY + rowHeight / 2 + 13}" text-anchor="middle" class="cell-value">${escapeXml(value)}</text>
      </g>`;
    }).join("")}
  </g>`;
};

export const createFiiDiiSvg = (data: FiiDiiData, company: CompanyBrand): string => {
  const color = company.color;
  const textColor = readableText(color);
  const values = (group: string): Array<[string, string]> => DATA_FIELDS.filter(field => field.group === group)
    .map(field => [field.label, formatAmount(data.values[field.key])]);
  const waves = Array.from({ length: 10 }, (_, index) => {
    const offset = index * 13;
    return `<path d="M ${-120 + offset} ${80 + offset} C ${250 + offset} ${120 + offset}, ${80 + offset} ${430 + offset}, ${-170 + offset} ${560 + offset}
      M ${880 + offset} ${-160 + offset} C ${630 + offset} ${300 + offset}, ${1140 + offset} ${180 + offset}, ${1320 + offset} ${490 + offset}
      M ${-150 + offset} ${1180 + offset} C ${500 + offset} ${1320 + offset}, ${370 + offset} ${1450 + offset}, ${30 + offset} ${1790 + offset}
      M ${890 + offset} ${1720 + offset} C ${640 + offset} ${1390 + offset}, ${1030 + offset} ${1380 + offset}, ${1390 + offset} ${1260 + offset}" />`;
  }).join("");
  return `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="1200" height="1697" viewBox="0 0 1200 1697">
    <style>
      text { font-family: Arial, Helvetica, sans-serif; }
      .title { font-size: 55px; font-weight: 800; }
      .date { font-size: 31px; font-weight: 700; }
      .section { font-size: 38px; font-weight: 800; letter-spacing: 1px; }
      .cell-label { font-size: 34px; font-weight: 700; fill: #101820; }
      .cell-value { font-size: 35px; font-weight: 700; fill: #101820; font-variant-numeric: tabular-nums; }
    </style>
    <rect width="1200" height="1697" fill="#fff" />
    <g fill="none" stroke="#e5e7e9" stroke-width="2.4" opacity="0.9">${waves}</g>
    <rect x="25" y="22" width="480" height="190" fill="#fff" fill-opacity="0.82" />
    <image x="32" y="28" width="466" height="180" preserveAspectRatio="xMidYMid meet" xlink:href="${company.logoDataUrl}" />
    <text x="1160" y="91" text-anchor="end" class="title" fill="#050505">FII/DII ACTIVITY</text>
    <text x="1160" y="164" text-anchor="end" class="date" fill="#080808">${escapeXml(formatDate(data.date))}</text>
    <line x1="40" y1="224" x2="1165" y2="224" stroke="${color}" stroke-width="8" />
    <text x="1160" y="257" text-anchor="end" font-size="23" font-weight="700" fill="#17374c">ALL VALUES IN CR</text>
    ${table("TODAY'S ACTIVITY", 38, 280, 545, values("today"), color, textColor, 110)}
    ${table("WEEK TILL DATE", 618, 280, 545, values("week"), color, textColor, 122)}
    ${table("MONTH TILL DATE", 618, 724, 545, values("month"), color, textColor, 122)}
    ${table("FY TILL DATE", 38, 1125, 1125, values("fy"), color, textColor, 110)}
    <rect x="245" y="1490" width="710" height="170" rx="16" fill="${color}" />
    <g fill="none" stroke="${textColor}" stroke-width="6" stroke-linecap="round">
      <circle cx="326" cy="1556" r="26" /><path d="M310 1578 L315 1593 L337 1593 L342 1578 M316 1603 L337 1603 M326 1513 L326 1503 M287 1530 L279 1522 M365 1530 L373 1522 M278 1557 L267 1557 M375 1557 L386 1557" />
    </g>
    <text x="665" y="1559" text-anchor="middle" font-size="45" font-weight="800" fill="${textColor}">Gift Nifty at ${escapeXml(data.giftTime || "—")}</text>
    <text x="665" y="1620" text-anchor="middle" font-size="43" font-weight="700" fill="${textColor}">${escapeXml(data.giftLevel || "—")} (${escapeXml(data.giftChange || "—")})</text>
  </svg>`;
};

export const svgToPng = async (svg: string): Promise<Blob> => {
  const image = new Image();
  const url = URL.createObjectURL(new Blob([svg], { type: "image/svg+xml;charset=utf-8" }));
  try {
    await new Promise<void>((resolve, reject) => {
      image.onload = () => resolve();
      image.onerror = () => reject(new Error("Could not render report"));
      image.src = url;
    });
    const canvas = document.createElement("canvas");
    canvas.width = 1200;
    canvas.height = 1697;
    const context = canvas.getContext("2d");
    if (!context) throw new Error("Could not create image");
    context.drawImage(image, 0, 0);
    return await new Promise<Blob>((resolve, reject) => canvas.toBlob(blob => blob ? resolve(blob) : reject(new Error("Could not export image")), "image/png"));
  } finally {
    URL.revokeObjectURL(url);
  }
};
