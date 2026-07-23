type PerformanceCall = {
  id: string;
  action: string;
  entry_price: number | string;
  target_price: number | string;
  stop_loss: number | string;
  exit_price: number | string | null;
  status: string;
  created_at: string;
  closed_at: string | null;
};

type EvaluatedCall = {
  id: string;
  closedAt: string;
  pnl: number;
  targetHit: boolean;
  stopLossHit: boolean;
  earlyExit: boolean;
};

const roundPercentage = (value: number): number =>
  Number(value.toFixed(2));

interface PerformanceServiceParams {
  createdThisMonth: PerformanceCall[];
  exitedThisMonth: PerformanceCall[];
  lastTenRows: PerformanceCall[];
  activeCount: number;
}

export const calculatePerformanceMetrics = ({
  createdThisMonth,
  exitedThisMonth,
  lastTenRows,
  activeCount,
}: PerformanceServiceParams) => {
  const totalCalls = createdThisMonth.length;

  const evaluatedCalls: EvaluatedCall[] = exitedThisMonth
    .map((call): EvaluatedCall | null => {
      const entryPrice = Number(call.entry_price);
      const targetPrice = Number(call.target_price);
      const stopLoss = Number(call.stop_loss);
      const exitPrice = Number(call.exit_price);

      const hasValidPrices = [
        entryPrice,
        targetPrice,
        stopLoss,
        exitPrice,
      ].every(Number.isFinite);

      if (!hasValidPrices || !call.closed_at) {
        return null;
      }

      const action = String(call.action)
        .trim()
        .toUpperCase();

      if (action !== "BUY" && action !== "SELL") {
        return null;
      }

      const pnl =
        action === "BUY"
          ? exitPrice - entryPrice
          : entryPrice - exitPrice;

      const targetHit =
        action === "BUY"
          ? exitPrice >= targetPrice
          : exitPrice <= targetPrice;

      const stopLossHit =
        action === "BUY"
          ? exitPrice <= stopLoss
          : exitPrice >= stopLoss;

      const earlyExit =
        action === "BUY"
          ? exitPrice > stopLoss &&
            exitPrice < targetPrice
          : exitPrice > targetPrice &&
            exitPrice < stopLoss;

      return {
        id: call.id,
        closedAt: call.closed_at,
        pnl,
        targetHit,
        stopLossHit,
        earlyExit,
      };
    })
    .filter(
      (call): call is EvaluatedCall =>
        call !== null
    );
      const profitableCalls = evaluatedCalls.filter(
    (call) => call.pnl > 0
  );

  const adverseCalls = evaluatedCalls.filter(
    (call) => call.pnl < 0
  );

  const targetHitCalls = evaluatedCalls.filter(
    (call) => call.targetHit
  );

  const stopLossHitCalls = evaluatedCalls.filter(
    (call) => call.stopLossHit
  );

  const earlyExitCalls = evaluatedCalls.filter(
    (call) => call.earlyExit
  );

  const totalProfit = profitableCalls.reduce(
    (sum, call) => sum + call.pnl,
    0
  );

  const totalLoss = Math.abs(
    adverseCalls.reduce(
      (sum, call) => sum + call.pnl,
      0
    )
  );

  const percentageOfTotalCalls = (
    count: number
  ): number =>
    totalCalls > 0
      ? roundPercentage((count / totalCalls) * 100)
      : 0;

  // Risk : Reward = Total Loss / Total Profit
  const riskRewardRatio =
    totalProfit > 0
      ? Number((totalLoss / totalProfit).toFixed(2))
      : null;

  const missingExitPriceCount =
    createdThisMonth.filter((call) => {
      return (
        call.closed_at !== null &&
        (call.exit_price === null ||
          call.exit_price === undefined)
      );
    }).length;
      const lastTen = lastTenRows.map((call) => {
    const entryPrice = Number(call.entry_price);
    const exitPrice = Number(call.exit_price);
    const action = String(call.action).trim().toUpperCase();

    if (
      !Number.isFinite(entryPrice) ||
      !Number.isFinite(exitPrice)
    ) {
      return "n";
    }

    if (action !== "BUY" && action !== "SELL") {
      return "n";
    }

    const pnl =
      action === "BUY"
        ? exitPrice - entryPrice
        : entryPrice - exitPrice;

    if (pnl > 0) return "g";
    if (pnl < 0) return "r";
    return "n";
  });

  return {
    total: totalCalls,

    // Profitable calls / total calls × 100
    accuracy: percentageOfTotalCalls(
      profitableCalls.length
    ),

    // Target-hit calls / total calls × 100
    strike: percentageOfTotalCalls(
      targetHitCalls.length
    ),

    // Total loss / total profit
    rr: riskRewardRatio,

    active: activeCount,
    exited: exitedThisMonth.length,
    profit: profitableCalls.length,
    adverse: adverseCalls.length,

    // Stop-loss-hit calls / total calls × 100
    sl: percentageOfTotalCalls(
      stopLossHitCalls.length
    ),

    // Early-exit calls / total calls × 100
    early: percentageOfTotalCalls(
      earlyExitCalls.length
    ),

    last: lastTen,

    totalProfit: Number(totalProfit.toFixed(2)),
    totalLoss: Number(totalLoss.toFixed(2)),
    missingExitPrice: missingExitPriceCount,
  };
};