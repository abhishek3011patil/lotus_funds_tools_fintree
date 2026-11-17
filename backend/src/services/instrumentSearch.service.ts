import axios from "axios";

export type Exchange = "NSE" | "BSE";

export type InstrumentSearchResult = {
  exchange: Exchange;
  name: string;
  symbol: string;
  lotSize?: number;
};

type SearchIndex = Record<Exchange, Map<string, InstrumentSearchResult[]>>;
type LotSizeIndex = Record<Exchange, Map<string, number | null>>;

const DEFAULT_DHAN_MASTER_URL =
  "https://images.dhan.co/api-data/api-scrip-master.csv";
const CACHE_TTL_MS = 24 * 60 * 60 * 1000;
const RESULT_LIMIT = 20;

let index: SearchIndex = {
  NSE: new Map(),
  BSE: new Map(),
};
let lotSizes: LotSizeIndex = { NSE: new Map(), BSE: new Map() };
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

const buildIndex = (csv: string): { instruments: SearchIndex; lots: LotSizeIndex } => {
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
  const instrumentTypeColumn = column("SEM_INSTRUMENT_NAME");
  const lotColumn = column("SEM_LOT_UNITS");
  const expiryColumn = column("SEM_EXPIRY_DATE");
  const optionTypeColumn = column("SEM_OPTION_TYPE");

  if (exchangeColumn < 0 || symbolColumn < 0) {
    throw new Error("DHAN_INSTRUMENT_COLUMNS_MISSING");
  }

  const nextIndex: SearchIndex = {
    NSE: new Map(),
    BSE: new Map(),
  };
  const nextLots: LotSizeIndex = { NSE: new Map(), BSE: new Map() };
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
    if (segment === "D" && instrumentTypeColumn >= 0 && lotColumn >= 0 && expiryColumn >= 0) {
      const contractType = normalize(row[instrumentTypeColumn] || "");
      const kind = contractType.startsWith("FUT") ? "FUTURES"
        : contractType.startsWith("OPT") ? normalize(row[optionTypeColumn] || "") : "";
      const contractSymbol = (row[symbolColumn] || "").match(/^(.+)-[A-Za-z]{3}\d{4}-/)?.[1];
      const expiry = (row[expiryColumn] || "").slice(0, 10);
      const lot = Number(row[lotColumn]);
      if (contractSymbol && /^\d{4}-\d{2}-\d{2}$/.test(expiry) &&
          ["FUTURES", "CE", "PE"].includes(kind) && Number.isSafeInteger(lot) && lot > 0) {
        const key = `${normalize(contractSymbol)}|${expiry}|${kind}`;
        const lots = nextLots[exchange as Exchange];
        if (!lots.has(key)) lots.set(key, lot);
        else if (lots.get(key) !== lot) lots.set(key, null);
      }
      continue;
    }
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

    const cashLot = lotColumn >= 0 ? Number(row[lotColumn]) : NaN;
    if (Number.isSafeInteger(cashLot) && cashLot > 0) {
      nextLots[typedExchange].set(`${normalize(symbol)}||CASH`, cashLot);
    }
    const instrument = {
      exchange: typedExchange, name, symbol,
      ...(Number.isSafeInteger(cashLot) && cashLot > 0 ? { lotSize: cashLot } : {}),
    };
    addToBucket(nextIndex[typedExchange], symbol, instrument);
    addToBucket(nextIndex[typedExchange], name, instrument);
  }

  return { instruments: nextIndex, lots: nextLots };
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
    index = nextIndex.instruments;
    lotSizes = nextIndex.lots;
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

  const query = normalize(search).replace(/\s+(LIMITED|LTD\.?)$/, "");
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

export const findContractLotSize = async (
  exchange: Exchange, symbol: string, expiry: string, callType: "CASH" | "FUTURES" | "CE" | "PE"
): Promise<number | null> => {
  if (cacheUpdatedAt === 0) await refreshInstrumentCache();
  else if (Date.now() - cacheUpdatedAt >= CACHE_TTL_MS) warmInstrumentCache();
  return lotSizes[exchange].get(`${normalize(symbol)}|${expiry}|${callType}`) ?? null;
};

export const findContractExpiries = async (
  exchange: Exchange, symbol: string, callType: "FUTURES" | "CE" | "PE"
): Promise<string[]> => {
  if (cacheUpdatedAt === 0) await refreshInstrumentCache();
  else if (Date.now() - cacheUpdatedAt >= CACHE_TTL_MS) warmInstrumentCache();
  const prefix = `${normalize(symbol)}|`;
  const suffix = `|${callType}`;
  const today = new Date().toISOString().slice(0, 10);
  return [...lotSizes[exchange].keys()]
    .filter(key => key.startsWith(prefix) && key.endsWith(suffix))
    .map(key => key.slice(prefix.length, -suffix.length))
    .filter(expiry => expiry >= today)
    .sort();
};
