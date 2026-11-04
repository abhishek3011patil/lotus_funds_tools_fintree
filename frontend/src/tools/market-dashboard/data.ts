export type DashboardRow = {
  label: string;
  values: string[];
};

export type DashboardSection = {
  id: string;
  title: string;
  headers?: string[];
  rows: DashboardRow[];
};

export type MarketDashboardData = {
  date: string;
  source: string;
  preparedBy: string;
  sebiNumber: string;
  email: string;
  sections: Record<string, DashboardSection>;
  foBan: string;
  chartCaption: string;
  chartDataUrl: string;
  disclaimer: string;
  analystDisclosure: string;
  disclosureUrl: string;
};

const chartSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="1050" height="405" viewBox="0 0 1050 405">
  <rect width="1050" height="405" fill="#fff"/>
  <g stroke="#edf0f2" stroke-width="1">${Array.from({ length: 8 }, (_, i) => `<path d="M0 ${40 + i * 44}H1050"/>`).join("")}</g>
  <g stroke="#d8dde1" stroke-width="1">${Array.from({ length: 12 }, (_, i) => `<path d="M${45 + i * 86} 0V350"/>`).join("")}</g>
  <path d="M20 270 C95 250 120 286 180 247 S276 258 330 218 S420 205 470 140 S555 86 610 170 S682 273 750 250 S850 238 900 190 S982 180 1030 118" fill="none" stroke="#1c8d4f" stroke-width="5"/>
  <g fill="#1c8d4f">${Array.from({ length: 28 }, (_, i) => `<rect x="${20 + i * 37}" y="${330 - ((i * 17) % 74)}" width="9" height="${20 + ((i * 17) % 74)}" opacity=".55"/>`).join("")}</g>
  <text x="525" y="200" text-anchor="middle" font-family="Arial" font-size="34" font-weight="700" fill="#aab3b9">UPLOAD CHART OF THE DAY</text>
</svg>`;

export const defaultChartDataUrl = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(chartSvg)}`;

const section = (id: string, title: string, labels: string[], values: string[][], headers?: string[]): DashboardSection => ({
  id,
  title,
  headers,
  rows: labels.map((label, index) => ({ label, values: values[index] || [""] })),
});

export const createMarketDashboardData = (): MarketDashboardData => ({
  date: (() => {
    const today = new Date();
    return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;
  })(),
  source: "Exchange Data",
  preparedBy: "Research Team",
  sebiNumber: "",
  email: "",
  sections: {
    indian: section("indian", "INDIAN INDICES", ["Gift Nifty", "Nifty", "Nifty Future", "India VIX"], [
      ["23330", "-0.78%", "", ""], ["23440", "+0.41%", "+2.71%", "+8.06%"], ["23515", "+0.56%", "", ""], ["14.91", "-0.20%", "", ""],
    ], ["CMP/LTP", "PREV. DAY", "MTD", "YTD"]),
    global: section("global", "GLOBAL INDICES", ["US VIX", "DOW", "NASDAQ", "S&P 500", "HANG SENG", "NIKKEI", "BOVESPA"], [
      ["", "", "", ""], ["", "", "", ""], ["", "", "", ""], ["", "", "", ""], ["", "", "", ""], ["", "", "", ""], ["", "", "", ""],
    ], ["CMP/LTP", "PREV. DAY", "MTD", "YTD"]),
    institutional: section("institutional", "INSTITUTIONAL ACTIVITY PREVIOUS TRADING DAY", ["FII Cash", "DII Cash"], [["-2255 crores"], ["+3962 crores"]]),
    energy: section("energy", "ENERGY", ["WTI Crude Oil", "Coal", "Natural Gas"], [["61.44 (-1.77%)"], ["104.75 (-0.05%)"], ["3.2394 (-2.81%)"]]),
    bonds: section("bonds", "10 YEAR BOND", ["US 10yr", "UK 10yr", "Germany 10yr", "Japan 10yr", "India 10yr"], [["4.763 (+0.082)"], ["4.8350 (-0.004)"], ["2.5675 (-0.0005)"], ["1.198 (+0.003)"], ["6.770 (+0.0001)"]]),
    metals: section("metals", "INDUSTRIAL METALS", ["Copper", "Iron-ore", "Aluminium", "Zinc", "Nickel", "Tin"], [["5.1397 (+0.89%)"], ["104.86 (+0.55%)"], ["2786 (+0.98%)"], ["3018 (+0.47%)"], ["15485 (+0.62%)"], ["36396 (-0.39%)"]]),
    forex: section("forex", "FOREX", ["DXY Index", "Euro/USD", "USD/JPY", "GBP/USD", "USD/INR", "USD/CNY"], [["109.49 (+0.45%)"], ["1.0244 (-0.97%)"], ["157.69 (-0.24%)"], ["1.2204 (-0.81%)"], ["86.17 (+0.15%)"], ["7.3326 (0.00%)"]]),
  },
  foBan: "BANDHANBNK, HINDCOPPER, LTF, MANAPPURAM, RBLBANK.",
  chartCaption: "COPPER PRICES BACK IN POSITIVE ACTION",
  chartDataUrl: defaultChartDataUrl,
  disclaimer: "Investment in securities market are subject to market risks. Read all the related documents carefully before investing. Registration granted by SEBI, enlistment with RAASB and certification from NISM in no way guarantee performance of the intermediary or provide any assurance of returns to investors.",
  analystDisclosure: "Research Analyst details, registration number, office address, contact number and email address.",
  disclosureUrl: "",
});

export const SECTION_ORDER = ["indian", "global", "institutional", "energy", "bonds", "metals", "forex"] as const;
