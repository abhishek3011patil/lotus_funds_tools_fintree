import { useState, useEffect } from "react";
import {
  Box,
  Grid,
  Paper,
  Typography,
} from "@mui/material";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import ArrowForwardIosIcon from "@mui/icons-material/ArrowForwardIos";
import RecommendationHistory from "./common/RecommendationHistory";
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

   const res = await axios.get(
  `${import.meta.env.VITE_API_URL}/api/performance`,
  {
    params: { month: currentMonth },
    headers: {
      Authorization: `Bearer ${token}`,
    },
    signal: controller.signal,
  }
);

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
}, []);





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

  const BigCard = ({ title, value, green = false, red = false }: any) => (
    <Paper sx={cardStyle}>
      <Box display="flex" justifyContent="space-between">
        <Typography fontSize="0.875rem">{title}</Typography>
      </Box>

      <Box display="flex" justifyContent="space-between" alignItems="center" mt={2}>
        <Typography
          fontSize="3rem"
          fontWeight={700}
          color={green ? "#16a34a" : red ? "#dc2626" : "#000"}
        >
          {value}
        </Typography>
      </Box>
    </Paper>
  );

const SmallCard = ({ title, value, green = false, red = false }: any) => (
    <Paper sx={cardStyle}>
      <Box display="flex" justifyContent="space-between">
        <Typography fontSize="0.8125rem">{title}</Typography>
      </Box>

      <Box display="flex" justifyContent="space-between" alignItems="center" mt={1}>
        <Typography
          fontSize={{ xs: "1.125rem", sm: "1.625rem" }}
          fontWeight={700}
          color={green ? "#16a34a" : red ? "#dc2626" : "#000"}
          sx={{ whiteSpace: "nowrap" }}
        >
          {value}
        </Typography>
      </Box>
    </Paper>
  );

const Last10 = () => (
  <Paper sx={cardStyle}>
    <Box
      display="flex"
      justifyContent="space-between"
      alignItems="center"
    >
      <Typography fontSize="0.8125rem">
        Last 10 Exited Calls
      </Typography>
    </Box>

    <Box display="flex" gap={0.9} mt={2}>
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
                width: "0.875rem",
                height: "1.125rem",
                borderRadius: "0.04375rem",
                backgroundColor,
              }}
            />
          );
        })
      ) : (
        <Typography
          fontSize="0.75rem"
          color="text.secondary"
        >
          No exited calls
        </Typography>
      )}
    </Box>
  </Paper>
);




  

return (
  <Box>
    <Box sx={{ p: 3, backgroundColor: "#fff" }}>
      <Typography fontSize="1.625rem" fontWeight={700} mb={3}>
        Performance
      </Typography>

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
              <Grid size={{ xs: 12, md: 3 }}>
                <Grid container spacing={2}>
                  <Grid size={12}>
                    <BigCard
                      title="Total Recommendations"
                      value={metrics.total}
                    />
                  </Grid>

                  <Grid size={6}>
                    <SmallCard
                      title="Active"
                      value={metrics.active}
                      green
                    />
                  </Grid>

                  <Grid size={6}>
                    <SmallCard
                      title="Exited"
                      value={metrics.exited}
                    />
                  </Grid>
                </Grid>
              </Grid>

              {/* COLUMN 2 */}
              <Grid size={{ xs: 12, md: 3 }}>
                <Grid container spacing={2}>
                  <Grid size={12}>
                    <BigCard
                      title="Accuracy"
                      value={`${metrics.accuracy}%`}
                      green={metrics.accuracy >= 80}
                      red={metrics.accuracy < 80}
                    />
                  </Grid>

                  <Grid size={6}>
                    <SmallCard
                      title="Profitable"
                      value={metrics.profit}
                      green
                    />
                  </Grid>

                  <Grid size={6}>
                    <SmallCard
                      title="Adverse"
                      value={metrics.adverse}
                      red
                    />
                  </Grid>
                </Grid>
              </Grid>

              {/* COLUMN 3 */}
              <Grid size={{ xs: 12, md: 3 }}>
                <Grid container spacing={2}>
                  <Grid size={12}>
                    <BigCard
                      title="Target Strike Rate"
                      value={`${metrics.strike}%`}
                    />
                  </Grid>

                  <Grid size={6}>
                    <SmallCard
                      title="SL Hit Rate"
                      value={`${metrics.sl}%`}
                    />
                  </Grid>

                  <Grid size={6}>
                    <SmallCard
                      title="Early Exit"
                      value={`${metrics.early}%`}
                    />
                  </Grid>
                </Grid>
              </Grid>

              {/* COLUMN 4 */}
              <Grid size={{ xs: 12, md: 3 }}>
                <Grid container spacing={2}>
                  <Grid size={12}>
                    <BigCard
                      title="Risk : Reward Ratio"
                      value={
                        metrics.rr === null
                          ? "N/A"
                          : `${metrics.rr.toFixed(2)} : 1`
                      }
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
        <RecommendationHistory />
      </Box>
    </Box>
  </Box>
);
};

const cardStyle = {
  p: 2,
  borderRadius: "0.145rem",
  border: "1px solid #E9E9EE",
  backgroundColor: "#fff",
  boxShadow: "none",
  height: "100%",
};

export default Performance;
