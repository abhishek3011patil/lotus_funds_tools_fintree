import axios from "axios";

export type Exchange = "NSE" | "BSE";

export type InstrumentSearchResult = {
  exchange: Exchange;
  name: string;
  symbol: string;
};

type SearchIndex = Record<Exchange, Map<string, InstrumentSearchResult[]>>;

const DEFAULT_DHAN_MASTER_URL =
  "https://images.dhan.co/api-data/api-scrip-master.csv";
const CACHE_TTL_MS = 24 * 60 * 60 * 1000;
const RESULT_LIMIT = 20;

let index: SearchIndex = {
  NSE: new Map(),
  BSE: new Map(),
};
let cacheUpdatedAt = 0;
let refreshPromise: Promise<void> | null = null;

const normalize = (value: string) =>
  value.trim().toUpperCase().replace(/\s+/g, " ");

const parseCsvLine = (line: string): string[] => {
  const values: string[] = [];
  let value = "";
  let quoted = false;

  for (let i = 0; i < line.length; i += 1) {
    const character = line[i];

    if (character === '"') {
      if (quoted && line[i + 1] === '"') {
        value += '"';
        i += 1;
      } else {
        quoted = !quoted;
      }
    } else if (character === "," && !quoted) {
      values.push(value.trim());
      value = "";
    } else {
      value += character;
    }
  }

  values.push(value.trim());
  return values;
};

const addToBucket = (
  target: Map<string, InstrumentSearchResult[]>,
  key: string,
  instrument: InstrumentSearchResult
) => {
  const prefix = normalize(key).slice(0, 2);
  if (prefix.length < 2) return;

  const bucket = target.get(prefix);
  if (bucket) bucket.push(instrument);
  else target.set(prefix, [instrument]);
};

const buildIndex = (csv: string): SearchIndex => {
  const lines = csv.split(/\r?\n/);
  const headers = parseCsvLine(lines[0] || "").map((header) =>
    header.replace(/^\uFEFF/, "")
  );
  const column = (name: string) => headers.indexOf(name);

  const exchangeColumn = column("SEM_EXM_EXCH_ID");
  const segmentColumn = column("SEM_SEGMENT");
  const symbolColumn = column("SEM_TRADING_SYMBOL");
  const nameColumn = column("SM_SYMBOL_NAME");
  const displayColumn = column("SEM_CUSTOM_SYMBOL");

  if (exchangeColumn < 0 || symbolColumn < 0) {
    throw new Error("DHAN_INSTRUMENT_COLUMNS_MISSING");
  }

  const nextIndex: SearchIndex = {
    NSE: new Map(),
    BSE: new Map(),
  };
  const seen = {
    NSE: new Set<string>(),
    BSE: new Set<string>(),
  };

  for (let i = 1; i < lines.length; i += 1) {
    if (!lines[i]) continue;
    const row = parseCsvLine(lines[i]);
    const exchange = normalize(row[exchangeColumn] || "");

    if (exchange !== "NSE" && exchange !== "BSE") continue;

    const segment = normalize(row[segmentColumn] || "");
    if (segment && segment !== "E") continue;

    const symbol = (row[symbolColumn] || "").trim();
    const name = (
      row[displayColumn] ||
      row[nameColumn] ||
      symbol
    ).trim();

    if (!symbol || !name) continue;

    const typedExchange = exchange as Exchange;
    const uniqueKey = normalize(symbol);
    if (seen[typedExchange].has(uniqueKey)) continue;
    seen[typedExchange].add(uniqueKey);

    const instrument = { exchange: typedExchange, name, symbol };
    addToBucket(nextIndex[typedExchange], symbol, instrument);
    addToBucket(nextIndex[typedExchange], name, instrument);
  }

  return nextIndex;
};

const refreshInstrumentCache = async () => {
  if (refreshPromise) return refreshPromise;

  refreshPromise = (async () => {
    const url =
      process.env.DHAN_INSTRUMENT_MASTER_URL?.trim() ||
      DEFAULT_DHAN_MASTER_URL;
    const response = await axios.get<string>(url, {
      responseType: "text",
      timeout: 30000,
    });

    const nextIndex = buildIndex(response.data);
    index = nextIndex;
    cacheUpdatedAt = Date.now();
    console.log("Dhan NSE/BSE instrument cache refreshed");
  })().finally(() => {
    refreshPromise = null;
  });

  return refreshPromise;
};

export const warmInstrumentCache = () => {
  void refreshInstrumentCache().catch((error) => {
    console.error("Unable to warm Dhan instrument cache:", error?.message || error);
  });
};

export const searchInstruments = async (
  exchange: Exchange,
  search: string
): Promise<InstrumentSearchResult[]> => {
  const cacheExpired = Date.now() - cacheUpdatedAt >= CACHE_TTL_MS;

  if (cacheUpdatedAt === 0) {
    await refreshInstrumentCache();
  } else if (cacheExpired) {
    warmInstrumentCache();
  }

  const query = normalize(search);
  const bucket = index[exchange].get(query.slice(0, 2)) || [];
  const symbolMatches: InstrumentSearchResult[] = [];
  const nameMatches: InstrumentSearchResult[] = [];
  const seen = new Set<string>();

  for (const instrument of bucket) {
    const symbol = normalize(instrument.symbol);
    const name = normalize(instrument.name);

    if (!symbol.startsWith(query) && !name.startsWith(query)) continue;

    const uniqueKey = symbol;
    if (seen.has(uniqueKey)) continue;
    seen.add(uniqueKey);
    if (symbol.startsWith(query)) symbolMatches.push(instrument);
    else nameMatches.push(instrument);
  }

  return [...symbolMatches, ...nameMatches].slice(0, RESULT_LIMIT);
};
