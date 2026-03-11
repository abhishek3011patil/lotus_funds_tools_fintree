import React, { useState, useEffect } from "react";
import {
  Box,
  Grid,
  Paper,
  Typography,
  Button,
  IconButton,
} from "@mui/material";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import ArrowForwardIosIcon from "@mui/icons-material/ArrowForwardIos";
import RecommendationHistory from "../pages/common/RecommendationHistory";

interface PerformanceMetrics {
  total: number;
  accuracy: number;
  strike: number;
  rr: number;
  active: number;
  exited: number;
  profit: number;
  adverse: number;
  sl: number;
  early: number;
  last: string[];
}

const Performance: React.FC = () => {
  const [metrics, setMetrics] = useState<PerformanceMetrics | null>(null);

  useEffect(() => {
    fetch("/PerformanceData.json")
      .then((res) => res.json())
      .then((json) => {
        const incoming = json.metrics ?? json;
        setMetrics(incoming);
      })
      .catch((err) => console.error("Error fetching performance data:", err));
  }, []);

  const BigCard = ({ title, value, green = false, red = false }: any) => (
    <Paper sx={cardStyle}>
      <Box display="flex" justifyContent="space-between">
        <Typography fontSize="0.875rem">{title}</Typography>
        <InfoOutlinedIcon sx={{ fontSize: "1.125rem", color: "#999" }} />
      </Box>

      <Box display="flex" justifyContent="space-between" alignItems="center" mt={2}>
        <Typography
          fontSize="3rem"
          fontWeight={700}
          color={green ? "#16a34a" : red ? "#dc2626" : "#000"}
        >
          {value}
        </Typography>
        <Button
          variant="contained"
          size="small"
          sx={{
            borderRadius: "1.125rem",
            textTransform: "none",
            fontWeight: 600,
            px: 2.25,
            minWidth: 0,
            boxShadow: "none",
            backgroundColor: "#4F6EF7",
            "&:hover": { backgroundColor: "#3E5BE6", boxShadow: "none" },
          }}
        >
          View
        </Button>
      </Box>
    </Paper>
  );

  const SmallCard = ({ title, value, green = false, red = false }: any) => (
    <Paper sx={cardStyle}>
      <Box display="flex" justifyContent="space-between">
        <Typography fontSize="0.8125rem">{title}</Typography>
        <InfoOutlinedIcon sx={{ fontSize: "1rem", color: "#999" }} />
      </Box>

      <Box display="flex" justifyContent="space-between" alignItems="center" mt={1}>
        <Typography
          fontSize="1.625rem"
          fontWeight={700}
          color={green ? "#16a34a" : red ? "#dc2626" : "#000"}
        >
          {value}
        </Typography>
        <IconButton
          size="small"
          sx={{
            width: "1.875rem",
            height: "1.875rem",
            borderRadius: "999px",
            backgroundColor: "#4F6EF7",
            color: "#fff",
            "&:hover": { backgroundColor: "#3E5BE6" },
          }}
        >
          <ArrowForwardIosIcon sx={{ fontSize: "0.8125rem" }} />
        </IconButton>
      </Box>
    </Paper>
  );

  const Last10 = () => (
    <Paper sx={cardStyle}>
      <Box display="flex" justifyContent="space-between" alignItems="center">
        <Typography fontSize="0.8125rem">Last 10 Exited Calls</Typography>
        <InfoOutlinedIcon sx={{ fontSize: "1rem", color: "#999" }} />
      </Box>
      <Box display="flex" gap={0.9} mt={2}>
        {metrics?.last.map((s, i) => {
          let bg = "#22c55e";
          if (s === "r") bg = "#ef4444";
          if (s === "l") bg = "#86efac";

          return (
            <Box
              key={i}
              sx={{
                width: "0.875rem",
                height: "1.125rem",
                borderRadius: "0.04375rem",
                background: bg,
              }}
            />
          );
        })}
      </Box>
    </Paper>
  );

  if (!metrics) {
    return (
      <Box sx={{ p: 3, backgroundColor: "#fff" }}>
        <Typography fontSize="1.625rem" fontWeight={700} mb={3}>
          Performance
        </Typography>
        <Paper
          sx={{
            p: 2.5,
            borderRadius: "0.1875rem",
            border: "1px solid #eee",
            backgroundColor: "#fff",
            boxShadow: "none",
          }}
        >
          <Typography fontSize="0.875rem" color="text.secondary">
            Loading performance metrics...
          </Typography>
        </Paper>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3, backgroundColor: "#fff" }}>
      <Typography fontSize="1.625rem" fontWeight={700} mb={3}>
        Performance
      </Typography>

      <Paper
        sx={{
          p: 2.5,
          borderRadius: "0.1875rem",
          border: "1px solid #eee",
          backgroundColor: "#fff",
          boxShadow: "none",
        }}
      >
        <Grid container spacing={2}>
          {/* ===== COLUMN 1 ===== */}
          <Grid size={{ xs: 12, md: 3 }}>
            <Grid container spacing={2}>
              <Grid size={12}>
                <BigCard title="Total Recommendations" value={metrics.total} />
              </Grid>
              <Grid size={6}>
                <SmallCard title="Active" value={metrics.active} green />
              </Grid>
              <Grid size={6}>
                <SmallCard title="Exited" value={metrics.exited} />
              </Grid>
            </Grid>
          </Grid>

          {/* ===== COLUMN 2 ===== */}
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
                <SmallCard title="Profitable" value={metrics.profit} green />
              </Grid>
              <Grid size={6}>
                <SmallCard title="Adverse" value={metrics.adverse} red />
              </Grid>
            </Grid>
          </Grid>

          {/* ===== COLUMN 3 ===== */}
          <Grid size={{ xs: 12, md: 3 }}>
            <Grid container spacing={2}>
              <Grid size={12}>
                <BigCard title="Target Strike Rate" value={`${metrics.strike}%`} />
              </Grid>
              <Grid size={6}>
                <SmallCard title="SL Hit Rate" value={`${metrics.sl}%`} />
              </Grid>
              <Grid size={6}>
                <SmallCard title="Early Exit" value={`${metrics.early}%`} />
              </Grid>
            </Grid>
          </Grid>

          {/* ===== COLUMN 4 ===== */}
          <Grid size={{ xs: 12, md: 3 }}>
            <Grid container spacing={2}>
              <Grid size={12}>
                <BigCard title="Risk : Reward Ratio" value={metrics.rr} />
              </Grid>
              <Grid size={12}>
                <Last10 />
              </Grid>
            </Grid>
          </Grid>
        </Grid>
      </Paper>

      <RecommendationHistory />
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
