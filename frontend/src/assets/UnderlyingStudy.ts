
export type StudyOption = {
  label: string;
  value: string;
};

export type StudyGroup = {
  group: string;
  options: StudyOption[];
};

export const UNDERLYING_STUDIES: StudyGroup[] = [

  {
    group: "Fundamental & General Analysis",
    options: [
      { label: "Sentiment analysis", value: "sentiment_analysis" },
      { label: "Techno Funda", value: "techno_funda" },
      { label: "Debt ratio", value: "debt_ratio" },
      { label: "Return on equity", value: "return_on_equity" },
      { label: "Dividend yield", value: "dividend_yield" },
      { label: "Earnings per share", value: "earnings_per_share" },
      { label: "Qualitative research", value: "qualitative_research" },
      { label: "Financial statements", value: "financial_statements" },
      { label: "Industry analysis", value: "industry_analysis" },
      { label: "Quantitative analysis", value: "quantitative_analysis" },
      { label: "Trend", value: "trend" },
      { label: "Chart patterns", value: "chart_patterns" },
      { label: "Current ratio", value: "current_ratio" },
      { label: "Financial strength", value: "financial_strength" },
      { label: "Profit margins", value: "profit_margins" },
    ],
  },

  {
    group: "Technical Indicators",
    options: [
      { label: "Accumulation Distribution", value: "accumulation_distribution" },
      { label: "Aroon Oscillator", value: "aroon_oscillator" },
      { label: "Average Directional Index (ADX)", value: "adx" },
      { label: "Average True Range (ATR)", value: "atr" },
      { label: "ATR Bands", value: "atr_bands" },
      { label: "ATR Trailing Stops", value: "atr_trailing_stops" },
      { label: "Bollinger Bands", value: "bollinger_bands" },
      { label: "Bollinger Bandwidth", value: "bollinger_bandwidth" },
      { label: "Bollinger Percentage B", value: "bollinger_percentage_b" },
      { label: "Chaikin Money Flow", value: "chaikin_money_flow" },
      { label: "Chaikin Oscillator", value: "chaikin_oscillator" },
      { label: "Chaikin Volatility", value: "chaikin_volatility" },
      { label: "Chande Momentum Oscillator", value: "cmo" },
      { label: "Chandelier Exits", value: "chandelier_exits" },
      { label: "Choppiness Index", value: "choppiness_index" },
      { label: "Commodity Channel Index", value: "cci" },
      { label: "Coppock Indicator", value: "coppock_indicator" },
      { label: "Detrended Price Oscillator", value: "dpo" },
      { label: "Directional Movement Index", value: "dmi" },
      { label: "Donchian Channels", value: "donchian_channels" },
      { label: "Ease of Movement", value: "ease_of_movement" },
      { label: "Elder Ray Index", value: "elder_ray_index" },
      { label: "Fibonacci Retracements & Extensions", value: "fibonacci_retracements" },
      { label: "Force Index", value: "force_index" },
      { label: "Heikin Ashi", value: "heikin_ashi" },
      { label: "Ichimoku Cloud", value: "ichimoku_cloud" },
      { label: "Keltner Channels", value: "keltner_channels" },
      { label: "KST Indicator", value: "kst_indicator" },
      { label: "Linear Regression Indicator", value: "linear_regression" },
      { label: "Moving Average (MA)", value: "ma" },
      { label: "Displaced MA (DMA)", value: "dma" },
      { label: "Exponential MA (EMA)", value: "ema" },
      { label: "Hull MA (HMA)", value: "hma" },
      { label: "Simple MA (SMA)", value: "sma" },
      { label: "Weighted MA (WMA)", value: "wma" },
      { label: "Wilder MA (WWMA)", value: "wwma" },
      { label: "MACD", value: "macd" },
      { label: "MACD Histogram", value: "macd_histogram" },
      { label: "Money Flow Index", value: "mfi" },
      { label: "Momentum Indicator", value: "momentum" },
      { label: "Negative Volume Index", value: "nvi" },
      { label: "On Balance Volume", value: "obv" },
      { label: "Parabolic SAR", value: "psar" },
      { label: "Pivot Points", value: "pivot_points" },
      { label: "Relative Strength Index (RSI)", value: "rsi" },
      { label: "Stochastic Oscillator", value: "stochastic" },
      { label: "Stochastic RSI", value: "stochastic_rsi" },
      { label: "Trendlines", value: "trendlines" },
      { label: "TRIX", value: "trix" },
      { label: "Volume", value: "volume" },
      { label: "Volume Oscillator", value: "volume_oscillator" },
      { label: "Williams %R", value: "williams_percent_r" },
    ],
  },

  {
    group: "Indicator Categories",
    options: [
      { label: "Momentum indicators", value: "momentum_indicators" },
      { label: "Trend indicators", value: "trend_indicators" },
      { label: "Volume indicators", value: "volume_indicators" },
      { label: "Oscillators", value: "oscillators" },
      { label: "Volatility indicators", value: "volatility_indicators" },
      { label: "Discussions about indicators", value: "indicator_discussions" },
    ],
  },
];



export const FLAT_STUDIES = UNDERLYING_STUDIES.flatMap(g => g.options);

export const getRecentStudies = (recentValues: string[]) =>
  FLAT_STUDIES.filter(o => recentValues.includes(o.value));
