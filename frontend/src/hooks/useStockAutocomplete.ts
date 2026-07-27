import {
  startTransition,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import axios from "axios";
import { STOCK_DATA } from "../assets/stocks";

type ExchangeType = "NSE" | "BSE";

export type StockOption = {
  exchange: ExchangeType;
  name: string;
  symbol: string;
};

const LOCAL_OPTIONS: Record<ExchangeType, StockOption[]> = {
  NSE: (STOCK_DATA.NSE || []).map((name) => ({
    exchange: "NSE",
    name,
    symbol: name,
  })),
  BSE: (STOCK_DATA.BSE || []).map((name) => ({
    exchange: "BSE",
    name,
    symbol: name,
  })),
};

type PreparedStockOption = StockOption & {
  normalizedName: string;
  normalizedSymbol: string;
};

const buildLocalIndex = (exchange: ExchangeType) => {
  const buckets = new Map<string, PreparedStockOption[]>();

  for (const option of LOCAL_OPTIONS[exchange]) {
    const prepared: PreparedStockOption = {
      ...option,
      normalizedName: option.name.toLowerCase(),
      normalizedSymbol: option.symbol.toLowerCase(),
    };

    for (const key of new Set([
      prepared.normalizedName.slice(0, 1),
      prepared.normalizedName.slice(0, 2),
      prepared.normalizedSymbol.slice(0, 1),
      prepared.normalizedSymbol.slice(0, 2),
    ])) {
      if (!key) continue;
      const bucket = buckets.get(key);
      if (bucket) bucket.push(prepared);
      else buckets.set(key, [prepared]);
    }
  }

  return buckets;
};

const LOCAL_INDEX: Record<
  ExchangeType,
  Map<string, PreparedStockOption[]>
> = {
  NSE: buildLocalIndex("NSE"),
  BSE: buildLocalIndex("BSE"),
};

export function useStockAutocomplete(exchangeType: ExchangeType) {
  const [inputValue, setInputValue] = useState("");
  const [remoteResult, setRemoteResult] = useState<{
    key: string;
    matches: StockOption[];
  }>({ key: "", matches: [] });
  const [loadingKey, setLoadingKey] = useState<string | null>(null);
  const resultCache = useRef(new Map<string, StockOption[]>());

  const localMatches = useMemo(() => {
    const query = inputValue.trim().toLowerCase();
    if (!query) return [];

    const prefix = query.slice(0, Math.min(2, query.length));
    const candidates = LOCAL_INDEX[exchangeType].get(prefix) || [];

    return candidates
      .filter(
        (option) =>
          option.normalizedName.startsWith(query) ||
          option.normalizedSymbol.startsWith(query)
      )
      .slice(0, 20);
  }, [exchangeType, inputValue]);

  useEffect(() => {
    const query = inputValue.trim();

    if (query.length < 2) {
      return;
    }

    const requestKey = `${exchangeType}:${query.toLowerCase()}`;
    const cached = resultCache.current.get(requestKey);
    if (cached) {
      queueMicrotask(() => {
        setRemoteResult({ key: requestKey, matches: cached });
      });
      return;
    }

    const controller = new AbortController();
    const timer = window.setTimeout(async () => {
      setLoadingKey(requestKey);
      try {
        const token = localStorage.getItem("token");
        const response = await axios.get(
          `${import.meta.env.VITE_API_URL}/api/research/instruments`,
          {
            params: { exchange: exchangeType, search: query },
            headers: token ? { Authorization: `Bearer ${token}` } : {},
            signal: controller.signal,
          }
        );
        const nextMatches = Array.isArray(response.data?.data)
          ? response.data.data
          : [];
        resultCache.current.set(requestKey, nextMatches);
        startTransition(() => {
          setRemoteResult({ key: requestKey, matches: nextMatches });
        });
      } catch (error) {
        if (!axios.isCancel(error)) {
          startTransition(() => {
            setRemoteResult({ key: requestKey, matches: [] });
          });
        }
      } finally {
        if (!controller.signal.aborted) {
          setLoadingKey((current) =>
            current === requestKey ? null : current
          );
        }
      }
    }, 300);

    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [exchangeType, inputValue]);

  const currentKey = `${exchangeType}:${inputValue.trim().toLowerCase()}`;
  const isLoading = loadingKey === currentKey;
  const remoteMatches =
    remoteResult.key === currentKey ? remoteResult.matches : [];
  const matches = remoteMatches.length > 0 ? remoteMatches : localMatches;
  const suggestion = matches[0]?.name || "";

  const handleInputChange = useCallback((_: unknown, value: string) => {
    setInputValue(value);
  }, []);

  const setDirectValue = useCallback((value: string) => {
    setInputValue(value);
  }, []);

  const handleKeyDown = useCallback((event: React.KeyboardEvent) => {
    if (event.key === "Tab" && matches[0]) {
      setInputValue(matches[0].name);
      event.preventDefault();
    }
  }, [matches]);

  return {
    inputValue,
    suggestion,
    setDirectValue,
    matches,
    isLoading,
    handleInputChange,
    handleKeyDown,
  };
}
