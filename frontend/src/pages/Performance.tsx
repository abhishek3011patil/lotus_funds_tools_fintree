import { useState, useEffect } from "react";
import {
  Box,
  Grid,
  Paper,
  Typography,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from "@mui/material";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import ArrowForwardIosIcon from "@mui/icons-material/ArrowForwardIos";
import RecommendationHistory from "./common/RecommendationHistory";
import ShowChartIcon from "@mui/icons-material/ShowChart";
import PieChartIcon from "@mui/icons-material/PieChart";
import TrackChangesIcon from "@mui/icons-material/TrackChanges";
import BalanceIcon from "@mui/icons-material/Balance";
import TrendingUpIcon from "@mui/icons-material/TrendingUp";
import TrendingDownIcon from "@mui/icons-material/TrendingDown";
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutline";
import ExitToAppIcon from "@mui/icons-material/ExitToApp";
import CancelOutlinedIcon from "@mui/icons-material/CancelOutlined";
import AccessTimeIcon from "@mui/icons-material/AccessTime";
import FormatListBulletedIcon from "@mui/icons-material/FormatListBulleted";
import HistoryIcon from "@mui/icons-material/History";
import axios from "axios";

interface PerformanceMetrics {
  total: number;
  accuracy: number;
  strike: number;
  rr: number | null;
  active: number;
  exited: number;
  profit: number;
  adverse: number;
  sl: number;
  early: number;
  last: Array<"g" | "r" | "n">;
  totalProfit?: number;
  totalLoss?: number;
}

const Performance: React.FC = () => {
  const [metrics, setMetrics] = useState<PerformanceMetrics | null>(null);

  const [loading, setLoading] = useState(true);
const [error, setError] = useState("");
const [period, setPeriod] = useState<"weekly" | "monthly" | "yearly">("monthly");

useEffect(() => {
  console.log("Selected Period:", period);
}, [period]);



useEffect(() => {
  const controller = new AbortController();


  const fetchPerformance = async () => {
    try {
      setLoading(true);
      setError("");

      const token = localStorage.getItem("token");

      if (!token) {
        setError("Please log in again.");
        return;
      }

const now = new Date();

const currentMonth = `${now.getFullYear()}-${String(
  now.getMonth() + 1
).padStart(2, "0")}`;

const currentYear = now.getFullYear();

const res = await axios.get(
  `${import.meta.env.VITE_API_URL}/api/performance`,
  {
    params: {
      period,
      month: currentMonth,
      year: currentYear,
    },
    headers: {
      Authorization: `Bearer ${token}`,
    },
    signal: controller.signal,
  }
);

console.log("Sending params:", {
  period,
  month: currentMonth,
  year: currentYear,
});

console.log("STATUS:", res.status);
console.log("FULL RESPONSE:", res.data);
console.log("METRICS:", res.data?.metrics);

      if (!res.data?.metrics) {
  throw new Error("Performance metrics are missing from the API response");
}

console.log("PERFORMANCE RESPONSE:", res.data);

const receivedMetrics = res.data?.metrics;

if (!receivedMetrics) {
  setError("Performance metrics were not returned by the server.");
  setMetrics(null);
  return;
}

console.log("Performance API response:", res.data);
console.log("Metrics:", res.data?.metrics);

setMetrics({
  total: Number(receivedMetrics.total ?? 0),
  accuracy: Number(receivedMetrics.accuracy ?? 0),
  strike: Number(receivedMetrics.strike ?? 0),
  rr:
    receivedMetrics.rr === null ||
    receivedMetrics.rr === undefined
      ? null
      : Number(receivedMetrics.rr),
  active: Number(receivedMetrics.active ?? 0),
  exited: Number(receivedMetrics.exited ?? 0),
  profit: Number(receivedMetrics.profit ?? 0),
  adverse: Number(receivedMetrics.adverse ?? 0),
  sl: Number(receivedMetrics.sl ?? 0),
  early: Number(receivedMetrics.early ?? 0),
  last: Array.isArray(receivedMetrics.last)
    ? receivedMetrics.last
    : [],
  totalProfit: Number(receivedMetrics.totalProfit ?? 0),
  totalLoss: Number(receivedMetrics.totalLoss ?? 0),
});


    } catch (err: any) {
      if (err?.code === "ERR_CANCELED") return;

      console.error("Performance API Error:", err);

      setError(
        err?.response?.data?.message ||
          "Unable to load performance metrics."
      );
    } finally {
      setLoading(false);
    }
  };

  fetchPerformance();

  return () => controller.abort();
}, [period]);



  // useEffect(() => {

  //   const fetchPerformance = async () => {
  //     try {
  //       const token = localStorage.getItem("token");

  //       if (!token) {
  //         console.log("No token found");
  //         return;
  //       }

  //       const res = await axios.get(
  //         import.meta.env.VITE_API_URL + "/api/research/performance",
  //         {
  //           headers: {
  //             Authorization: `Bearer ${token}`,
  //           },
  //         }
  //       );

  //       console.log("Performance API Response:");
  //       console.log(res.data);          // full array
  //       console.table(res.data);        // nice table view

  //     } catch (err: any) {
  //       console.error("Performance API Error:", err);
  //     }
  //   };

  //   fetchPerformance();

  // }, []); // runs once when page loads

const BigCard = ({ title, value, icon: Icon, green = false, red = false }: any) => (
  <Paper sx={cardStyle}>
    <Box display="flex" justifyContent="space-between" alignItems="flex-start" gap={1}>
      <Typography 
        fontSize={{ xs: "0.75rem", sm: "0.875rem" }} 
        sx={{ lineHeight: 1.2, wordBreak: "break-word" }}
      >
        {title}
      </Typography>
      {Icon && (
        <Icon
          sx={{
            fontSize: { xs: 18, sm: 20 },
            color: green ? "#16a34a" : red ? "#dc2626" : "text.secondary",
            flexShrink: 0,
          }}
        />
      )}
    </Box>

    <Box display="flex" justifyContent="space-between" alignItems="center" mt={1.5}>
      <Typography
        fontSize={{ xs: "1.75rem", sm: "2.5rem", md: "3rem" }}
        fontWeight={700}
        color={green ? "#16a34a" : red ? "#dc2626" : "#000"}
        sx={{ wordBreak: "break-word", lineHeight: 1 }}
      >
        {value}
      </Typography>
    </Box>
  </Paper>
);

const SmallCard = ({ title, value, icon: Icon, green = false, red = false }: any) => (
  <Paper sx={{ ...cardStyle, minHeight: { xs: "80px", sm: "95px" } }}>
    <Box display="flex" justifyContent="space-between" alignItems="flex-start" gap={0.5}>
      <Typography 
        fontSize={{ xs: "0.6875rem", sm: "0.8125rem" }} 
        sx={{ lineHeight: 1.2, wordBreak: "break-word" }}
      >
        {title}
      </Typography>
      {Icon && (
        <Icon
          sx={{
            fontSize: { xs: 14, sm: 16 },
            color: green ? "#16a34a" : red ? "#dc2626" : "text.secondary",
            flexShrink: 0,
          }}
        />
      )}
    </Box>

    <Box display="flex" justifyContent="space-between" alignItems="center" mt={1}>
      <Typography
        fontSize={{ xs: "1.125rem", sm: "1.5rem", md: "1.625rem" }}
        fontWeight={700}
        color={green ? "#16a34a" : red ? "#dc2626" : "#000"}
        sx={{ wordBreak: "break-word", lineHeight: 1 }}
      >
        {value}
      </Typography>
    </Box>
  </Paper>
);

const Last10 = () => (
  <Paper sx={{ ...cardStyle, minHeight: { xs: "85px", sm: "95px" } }}>
    <Box display="flex" justifyContent="space-between" alignItems="center" gap={1}>
      <Typography fontSize={{ xs: "0.75rem", sm: "0.8125rem" }} noWrap>
        Last 10 Exited Calls
      </Typography>
      <HistoryIcon sx={{ fontSize: { xs: 14, sm: 16 }, color: "text.secondary", flexShrink: 0 }} />
    </Box>

    <Box display="flex" gap={{ xs: 0.5, sm: 0.8 }} mt={1} alignItems="center" height="2.4rem">
      {metrics?.last.length ? (
        metrics.last.map((status, index) => {
          const backgroundColor =
            status === "g"
              ? "#22c55e"
              : status === "r"
              ? "#ef4444"
              : "#cbd5e1";

          return (
            <Box
              key={`${status}-${index}`}
              title={
                status === "g"
                  ? "Profitable"
                  : status === "r"
                  ? "Loss"
                  : "Breakeven"
              }
              sx={{
                flex: 1,
                height: { xs: "0.875rem", sm: "1.125rem" },
                borderRadius: "2px",
                backgroundColor,
              }}
            />
          );
        })
      ) : (
        <Typography fontSize="0.75rem" color="text.secondary">
          No exited calls
        </Typography>
      )}
    </Box>
  </Paper>
);

return (
  <Box>
    <Box sx={{ p: 3, backgroundColor: "#fff" }}>
      <Box
  sx={{
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    mb: 3,
    flexWrap: "wrap",
    gap: 2,
  }}
>
  <Typography
    fontSize="1.625rem"
    fontWeight={700}
  >
    Performance
  </Typography>

<FormControl size="small" sx={{ minWidth: 180 }}>
  <InputLabel id="performance-view-label">View</InputLabel>

  <Select
    labelId="performance-view-label"
    value={period}
    label="View"
    onChange={(e) =>
      setPeriod(e.target.value as "weekly" | "monthly" | "yearly")
    }
  >
    <MenuItem value="weekly">Weekly</MenuItem>
    <MenuItem value="monthly">Monthly</MenuItem>
    <MenuItem value="yearly">Yearly</MenuItem>
  </Select>
</FormControl>
</Box>
      {loading ? (
        <Paper sx={cardStyle}>
          <Typography color="text.secondary">
            Loading performance metrics...
          </Typography>
        </Paper>
      ) : error ? (
        <Paper sx={cardStyle}>
          <Typography color="error">
            {error}
          </Typography>
        </Paper>
      ) : metrics ? (
        <Box sx={{ position: "relative", width: "100%" }}>
          <Paper
            sx={{
              p: 2.5,
              borderRadius: "0.1875rem",
              border: "1px solid #eee",
              backgroundColor: "#fff",
              boxShadow: "none",
              position: "relative",
              overflow: "hidden",
            }}
          >
            <Grid container spacing={2}>
              {/* COLUMN 1 */}
              <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                <Grid container spacing={2}>
                  <Grid size={12}>
                  <BigCard
  title="Total Recommendations"
  value={metrics.total}
  icon={FormatListBulletedIcon}
/>
                  </Grid>

                  <Grid size={6}>
                    <SmallCard
  title="Active"
  value={metrics.active}
  icon={TrendingUpIcon}
  green
/>
                  </Grid>

                  <Grid size={6}>
                    <SmallCard
  title="Exited"
  value={metrics.exited}
  icon={ExitToAppIcon}
/>
                  </Grid>
                </Grid>
              </Grid>

              {/* COLUMN 2 */}
              <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                <Grid container spacing={2}>
                  <Grid size={12}>
                   <BigCard
  title="Accuracy"
  value={`${metrics.accuracy}%`}
  green={metrics.accuracy >= 80}
  red={metrics.accuracy < 80}
  icon={PieChartIcon}
/>
                  </Grid>

                  <Grid size={6}>
                   <SmallCard
  title="Profitable"
  value={metrics.profit}
  icon={CheckCircleOutlineIcon}
  green
/>
                  </Grid>

                  <Grid size={6}>
                    <SmallCard
  title="Adverse"
  value={metrics.adverse}
  icon={TrendingDownIcon}
  red
/>
                  </Grid>
                </Grid>
              </Grid>

              {/* COLUMN 3 */}
              <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                <Grid container spacing={2}>
                  <Grid size={12}>
                    <BigCard
  title="Target Strike Rate"
  value={`${metrics.strike}%`}
  icon={TrackChangesIcon}
/>
                  </Grid>

                  <Grid size={6}>
                    <SmallCard
  title="SL Hit Rate"
  value={`${metrics.sl}%`}
  icon={CancelOutlinedIcon}
/>
                  </Grid>

                  <Grid size={6}>
                    <SmallCard
  title="Early Exit"
  value={`${metrics.early}%`}
  icon={AccessTimeIcon}
/>
                  </Grid>
                </Grid>
              </Grid>

              {/* COLUMN 4 */}
              <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                <Grid container spacing={2}>
                  <Grid size={12}>
                    <BigCard
        title="Risk : Reward Ratio"
        value={
          metrics.rr === null
            ? "N/A"
            : `${metrics.rr.toFixed(2)} : 1`
        }
        icon={BalanceIcon}
      />
                  </Grid>

                  <Grid size={12}>
                    <Last10 />
                  </Grid>
                </Grid>
              </Grid>
            </Grid>
          </Paper>
        </Box>
      ) : (
        <Paper sx={cardStyle}>
          <Typography color="text.secondary">
            No performance data available.
          </Typography>
        </Paper>
      )}

      {/* This now renders even when the performance API fails */}
      <Box sx={{ mt: 3 }}>
        <RecommendationHistory
          enableExport
          exportFileBaseName="ra-performance"
        />
      </Box>
    </Box>
  </Box>
);
};

const cardStyle = {
  p: { xs: 1, sm: 2 },
  borderRadius: "0.145rem",
  border: "1px solid #E9E9EE",
  backgroundColor: "#fff",
  boxShadow: "none",
  height: "100%",
  display: "flex",
  flexDirection: "column",
  justifyContent: "space-between",
};

export default Performance;
