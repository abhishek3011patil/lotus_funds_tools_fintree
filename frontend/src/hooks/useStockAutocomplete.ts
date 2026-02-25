import { useMemo, useState } from "react";
import { STOCK_DATA } from "../assets/stocks";

type ExchangeType = "NSE" | "BSE";

// 🔥 PRECOMPUTE LOWERCASE ONCE (outside hook)
const PREPARED_STOCK_DATA: Record<
    ExchangeType,
    { original: string; lower: string }[]
> = {
    NSE: (STOCK_DATA.NSE || []).map((s) => ({
        original: s,
        lower: s.toLowerCase(),
    })),
    BSE: (STOCK_DATA.BSE || []).map((s) => ({
        original: s,
        lower: s.toLowerCase(),
    })),
};

export function useStockAutocomplete(exchangeType: ExchangeType) {
    const [inputValue, setInputValue] = useState("");
    const [suggestion, setSuggestion] = useState("");

    // 🔥 No more mapping on every render
    const options = PREPARED_STOCK_DATA[exchangeType];

    const matches = useMemo(() => {
        if (!inputValue) return [];

        const lowerInput = inputValue.toLowerCase();

        const results: string[] = [];

        for (let i = 0; i < options.length; i++) {
            if (options[i].lower.startsWith(lowerInput)) {
                results.push(options[i].original);
                if (results.length === 20) break; // 🔥 stop early
            }
        }

        return results;
    }, [inputValue, options]);

    const handleInputChange = (_: any, value: string) => {
        setInputValue(value);

        if (value.length > 0) {
            const lowerValue = value.toLowerCase();

            for (let i = 0; i < options.length; i++) {
                if (options[i].lower.startsWith(lowerValue)) {
                    setSuggestion(options[i].original);
                    return;
                }
            }

            setSuggestion("");
        } else {
            setSuggestion("");
        }
    };

    const setDirectValue = (value: string) => {
        setInputValue(value);
        setSuggestion("");
    };

    const handleKeyDown = (event: React.KeyboardEvent) => {
        if (event.key === "Tab" && suggestion) {
            setInputValue(suggestion);
            setSuggestion("");
            event.preventDefault();
        }
    };

    return {
        inputValue,
        suggestion,
        setDirectValue,
        matches,
        handleInputChange,
        handleKeyDown,
    };
}