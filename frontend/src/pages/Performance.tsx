import React from "react";
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

const Performance: React.FC = () => {
  const metrics = {
    total: 12,
    accuracy: 91,
    strike: 27,
    rr: 138.7,
    active: 1,
    exited: 11,
    profit: 10,
    adverse: 1,
    sl: 0,
    early: 38,
    last: ["l", "l", "g", "r", "g", "g", "g", "g", "g", "g"],
  };

  const BigCard = ({ title, value, green = false }: any) => (
    <Paper sx={cardStyle}>
      <Box display="flex" justifyContent="space-between">
        <Typography fontSize="0.875rem">{title}</Typography>
        <InfoOutlinedIcon sx={{ fontSize: "1.125rem", color: "#999" }} />
      </Box>

      <Box display="flex" justifyContent="space-between" alignItems="center" mt={2}>
        <Typography
          fontSize="3rem"
          fontWeight={700}
          color={green ? "#16a34a" : "#000"}
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
        {metrics.last.map((s, i) => {
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
                <BigCard title="Accuracy" value={`${metrics.accuracy}%`} green />
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
