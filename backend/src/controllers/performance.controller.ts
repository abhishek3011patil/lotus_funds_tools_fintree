import { Response } from "express";
import { pool } from "../db";
import { AuthRequest } from "../middlewares/auth.middleware";
import { calculatePerformanceMetrics } from "../services/performance.service";

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

// type EvaluatedCall = {
//   id: string;
//   closedAt: string;
//   pnl: number;
//   targetHit: boolean;
//   stopLossHit: boolean;
//   earlyExit: boolean;
// };

// const roundPercentage = (value: number): number =>
//   Number(value.toFixed(2));

export const getResearchPerformance   = async (
  req: AuthRequest,
  res: Response
) => {
   console.log("=== PERFORMANCE CONTROLLER CALLED ===");
  try {
    if (!req.user?.id) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
    }

    const month =
      typeof req.query.month === "string"
        ? req.query.month
        : new Date().toISOString().slice(0, 7);

    if (!/^\d{4}-\d{2}$/.test(month)) {
      return res.status(400).json({
        success: false,
        message: "Month must be in YYYY-MM format",
      });
    }

    const monthStart = `${month}-01`;

    const callsResult = await pool.query<PerformanceCall>(
      `
        SELECT
          id,
          action,
          entry_price,
          target_price,
          stop_loss,
          exit_price,
          status,
          created_at,
          closed_at
        FROM research_calls
        WHERE ra_user_id = $1
          AND is_latest = true
          AND (
            (
              created_at >= $2::date
              AND created_at < $2::date + INTERVAL '1 month'
            )
            OR
            (
              closed_at >= $2::date
              AND closed_at < $2::date + INTERVAL '1 month'
            )
          )
      `,
      [req.user.id, monthStart]
    );

    const rows = callsResult.rows;

    const start = new Date(`${monthStart}T00:00:00`);
    const end = new Date(start);
    end.setMonth(end.getMonth() + 1);

   const createdThisMonth = rows.filter((call) => {
  const createdAt = new Date(call.created_at);

  return createdAt >= start && createdAt < end;
});

const totalCalls = createdThisMonth.length;

// Calls created during the selected month.
// Used for total-call denominator and monthly call performance.


// Calls actually exited during the selected month.
// Used for the Exited card.
const exitedThisMonth = rows.filter((call) => {
  if (
    !call.closed_at ||
    call.exit_price === null ||
    call.exit_price === undefined
  ) {
    return false;
  }

  const closedAt = new Date(call.closed_at);

  return closedAt >= start && closedAt < end;
});



// const evaluatedCalls: EvaluatedCall[] = exitedThisMonth
//   .map((call): EvaluatedCall | null => {
//     const entryPrice = Number(call.entry_price);
//     const targetPrice = Number(call.target_price);
//     const stopLoss = Number(call.stop_loss);
//     const exitPrice = Number(call.exit_price);

//     const hasValidPrices = [
//       entryPrice,
//       targetPrice,
//       stopLoss,
//       exitPrice,
//     ].every(Number.isFinite);

//     if (!hasValidPrices || !call.closed_at) {
//       return null;
//     }

//     const action = String(call.action).trim().toUpperCase();

//     if (action !== "BUY" && action !== "SELL") {
//       return null;
//     }

//     const pnl =
//       action === "BUY"
//         ? exitPrice - entryPrice
//         : entryPrice - exitPrice;

//     // BUY: exit >= target
//     // SELL: exit <= target
//     const targetHit =
//       action === "BUY"
//         ? exitPrice >= targetPrice
//         : exitPrice <= targetPrice;

//     // BUY: exit <= stop loss
//     // SELL: exit >= stop loss
//     const stopLossHit =
//       action === "BUY"
//         ? exitPrice <= stopLoss
//         : exitPrice >= stopLoss;

//     // BUY: stop loss < exit < target
//     // SELL: target < exit < stop loss
//     const earlyExit =
//       action === "BUY"
//         ? exitPrice > stopLoss && exitPrice < targetPrice
//         : exitPrice > targetPrice && exitPrice < stopLoss;

//     return {
//       id: call.id,
//       closedAt: call.closed_at,
//       pnl,
//       targetHit,
//       stopLossHit,
//       earlyExit,
//     };
//   })
//   .filter((call): call is EvaluatedCall => call !== null);

// const profitableCalls = evaluatedCalls.filter(
//   (call) => call.pnl > 0
// );

// const adverseCalls = evaluatedCalls.filter(
//   (call) => call.pnl < 0
// );

// const targetHitCalls = evaluatedCalls.filter(
//   (call) => call.targetHit
// );

// const stopLossHitCalls = evaluatedCalls.filter(
//   (call) => call.stopLossHit
// );

// const earlyExitCalls = evaluatedCalls.filter(
//   (call) => call.earlyExit
// );

// const totalProfit = profitableCalls.reduce(
//   (sum, call) => sum + call.pnl,
//   0
// );

// const totalLoss = Math.abs(
//   adverseCalls.reduce(
//     (sum, call) => sum + call.pnl,
//     0
//   )
// );

// const percentageOfTotalCalls = (count: number): number =>
//   totalCalls > 0
//     ? roundPercentage((count / totalCalls) * 100)
//     : 0;

// // Submitted rule:
// // Risk : Reward = total loss / total profit
// const riskRewardRatio =
//   totalProfit > 0
//     ? Number((totalLoss / totalProfit).toFixed(2))
//     : null;



// const missingExitPriceCount = createdThisMonth.filter((call) => {
//   return (
//     call.closed_at !== null &&
//     (call.exit_price === null ||
//       call.exit_price === undefined)
//   );
// }).length;


const lastTenResult = await pool.query<PerformanceCall>(
  `
    SELECT
      id,
      action,
      entry_price,
      target_price,
      stop_loss,
      exit_price,
      status,
      created_at,
      closed_at
    FROM research_calls
    WHERE ra_user_id = $1
      AND is_latest = true
      AND closed_at IS NOT NULL
      AND exit_price IS NOT NULL
    ORDER BY closed_at DESC
    LIMIT 10
  `,
  [req.user.id]
);
// const lastTen = lastTenResult.rows.map((call) => {
//   const entryPrice = Number(call.entry_price);
//   const exitPrice = Number(call.exit_price);
//   const action = String(call.action).trim().toUpperCase();

//   if (
//     !Number.isFinite(entryPrice) ||
//     !Number.isFinite(exitPrice)
//   ) {
//     return "n";
//   }

// if (action !== "BUY" && action !== "SELL") {
//   return "n";
// }

// const pnl =
//   action === "BUY"
//     ? exitPrice - entryPrice
//     : entryPrice - exitPrice;

//   if (pnl > 0) return "g";
//   if (pnl < 0) return "r";
//   return "n";
// });


const activeResult = await pool.query<{ count: string }>(
  `
    SELECT COUNT(*)::text AS count
    FROM research_calls
    WHERE ra_user_id = $1
      AND is_latest = true
      AND closed_at IS NULL
      AND exit_price IS NULL
  `,
  [req.user.id]
);

const activeCount = Number(activeResult.rows[0]?.count ?? 0);

const metrics = calculatePerformanceMetrics({
  createdThisMonth,
  exitedThisMonth,
  lastTenRows: lastTenResult.rows,
  activeCount,
});

//  
return res.status(200).json({
  success: true,
  month,
  metrics,
});
  } catch (error) {
    console.error("GET PERFORMANCE ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to calculate performance metrics",
    });
  }
};