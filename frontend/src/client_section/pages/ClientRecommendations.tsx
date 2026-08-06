import { useEffect, useState } from "react";
import axios from "axios";
import {
  Box,
  Typography,
  Button,
  Chip,
  Card,
  CardContent,
  Tabs,
  Tab,
  Stack,
  Grid,
  Paper,
  CircularProgress,
} from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";

// Single Dummy Recommendation Data
const dummyData = {
  id: 1,
  stockName: "TATASTEEL",
  type: "BUY",
  riskLevel: "Medium Risk",
  status: "Active",
  author: "Rohan Mehta",
  dateAgo: "15d ago",
  publishedDate: "14 Jul, 08:45 am",
  entry: "148.5",
  target: "158",
  stopLoss: "144",
  summary:
    "Momentum building above the 20-day average with strong volume support. Expecting a move towards recent swing highs.",
  analystNotes:
    "Keep a close eye on the 145 support zone. Book partial profits near target and trail stop loss once 1:1 risk-reward is achieved.",
};

const formatDate = (dateString) => {
  if (!dateString) return "";
  
  const date = new Date(dateString);
  return date.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
};

const ClientRecommendation = () => {
  const [recommendations, setRecommendations] = useState<any[]>([]);
  const [selectedRec, setSelectedRec] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [tabValue, setTabValue] = useState(0);

  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  useEffect(() => {
    fetchRecommendations();
  }, []);

  const fetchRecommendations = async () => {
    try {
      const token = localStorage.getItem("token");

      const res = await axios.get(
        "http://localhost:3000/api/client/recommendations",
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      setRecommendations(res.data.recommendations || []);
    } catch (err) {
      console.error("Failed to fetch recommendations", err);
    } finally {
      setLoading(false);
    }
  };

  // -------------------------------------------------------------
  // DETAIL VIEW
  // -------------------------------------------------------------
  if (loading) {
    return (
      <Box
        sx={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          minHeight: "60vh",
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

  if (selectedRec) {
    return (
      <Box
        sx={{
          p: { xs: 2, sm: 3, md: 4 },
          backgroundColor: "#f8fafc",
          minHeight: "100vh",
        }}
      >
        {/* Back Button */}
        <Button
          startIcon={<ArrowBackIcon />}
          onClick={() => setSelectedRec(null)}
          sx={{
            color: "#64748b",
            textTransform: "none",
            fontWeight: 600,
            fontSize: "0.9rem",
            mb: { xs: 2, md: 3 },
            "&:hover": { backgroundColor: "transparent", color: "#2563eb" },
          }}
        >
          Back to Recommendations
        </Button>

        {/* Details Container */}
        <Paper
          elevation={0}
          sx={{
            backgroundColor: "#ffffff",
            borderRadius: 3,
            p: { xs: 2, sm: 3, md: 4 },
            border: "1px solid #e2e8f0",
            boxShadow: "0px 1px 3px rgba(0, 0, 0, 0.05)",
          }}
        >
          {/* Detail View Header */}
          <Box
            sx={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: { xs: "flex-start", sm: "center" },
              flexDirection: { xs: "column", sm: "row" },
              gap: 2,
              mb: 1,
            }}
          >
            <Stack direction="row" spacing={1.5} alignItems="center" flexWrap="wrap">
              <Typography variant="h4" fontWeight="800" color="#0f172a" sx={{ fontSize: { xs: "1.5rem", sm: "2rem" } }}>
                {selectedRec.stock_name}
              </Typography>

              <Chip
                label={selectedRec.recommendation_type}
                sx={{
                  backgroundColor: "#22c55e",
                  color: "#ffffff",
                  fontWeight: 700,
                  fontSize: "0.75rem",
                  height: 24,
                }}
              />

              <Chip
                label={selectedRec.riskLevel || "Medium Risk"}
                sx={{
                  backgroundColor: "#fef3c7",
                  color: "#d97706",
                  fontWeight: 600,
                  fontSize: "0.75rem",
                  height: 24,
                }}
              />
            </Stack>

            <Button
              variant="contained"
              fullWidth={{ xs: true, sm: false }}
              sx={{
                backgroundColor: "#4f46e5",
                borderRadius: "20px",
                textTransform: "none",
                fontWeight: 600,
                px: 3,
                py: 1,
                boxShadow: "none",
                "&:hover": { backgroundColor: "#4338ca", boxShadow: "none" },
              }}
            >
              Mark Trade Taken
            </Button>
          </Box>

          {/* Subtitle */}
          <Typography variant="body2" color="#64748b" sx={{ mb: 4 }}>
           {selectedRec.ra_name} • Published {formatDate(selectedRec.publishedDate || selectedRec.created_at)}
          </Typography>

          {/* Metrics Row (Entry, Target, Stop Loss) */}
          <Grid container spacing={2} sx={{ mb: 4 }}>
            <Grid item xs={12} sm={4}>
              <Box
                sx={{
                  border: "1px solid #e2e8f0",
                  backgroundColor: "#f8fafc",
                  borderRadius: 2,
                  p: 2.5,
                  textAlign: "center",
                }}
              >
                <Typography variant="caption" color="#64748b" fontWeight={500}>
                  Entry
                </Typography>
                <Typography variant="h6" fontWeight="bold" color="#0f172a" mt={0.5}>
                  ₹{selectedRec.entry_price}
                </Typography>
              </Box>
            </Grid>

            <Grid item xs={12} sm={4}>
              <Box
                sx={{
                  border: "1px solid #e2e8f0",
                  backgroundColor: "#f8fafc",
                  borderRadius: 2,
                  p: 2.5,
                  textAlign: "center",
                }}
              >
                <Typography variant="caption" color="#64748b" fontWeight={500}>
                  Target
                </Typography>
                <Typography variant="h6" fontWeight="bold" color="#16a34a" mt={0.5}>
                  ₹{selectedRec.target_price}
                </Typography>
              </Box>
            </Grid>

            <Grid item xs={12} sm={4}>
              <Box
                sx={{
                  border: "1px solid #e2e8f0",
                  backgroundColor: "#f8fafc",
                  borderRadius: 2,
                  p: 2.5,
                  textAlign: "center",
                }}
              >
                <Typography variant="caption" color="#64748b" fontWeight={500}>
                  Stop Loss
                </Typography>
                <Typography variant="h6" fontWeight="bold" color="#dc2626" mt={0.5}>
                  ₹{selectedRec.stop_loss}
                </Typography>
              </Box>
            </Grid>
          </Grid>

          {/* Summary */}
          <Box sx={{ mb: 4 }}>
            <Typography variant="subtitle1" fontWeight="700" color="#0f172a" mb={1}>
              Recommendation Summary
            </Typography>
            <Typography variant="body2" color="#334155" lineHeight={1.6}>
              {selectedRec.summary}
            </Typography>
          </Box>

          {/* Chart Placeholder Box */}
          <Box
            sx={{
              height: { xs: 200, sm: 280 },
              border: "1px dashed #cbd5e1",
              borderRadius: 2,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              backgroundColor: "#f8fafc",
              color: "#94a3b8",
              fontWeight: 500,
              fontSize: "0.95rem",
              mb: 4,
            }}
          >
            Chart placeholder
          </Box>

          {/* Analyst Notes */}
          <Box>
            <Typography variant="subtitle1" fontWeight="700" color="#0f172a" mb={1}>
              Analyst Notes
            </Typography>
            <Typography variant="body2" color="#334155" lineHeight={1.6}>
              {selectedRec.analystNotes}
            </Typography>
          </Box>
        </Paper>
      </Box>
    );
  }

  // -------------------------------------------------------------
  // CARDS LIST VIEW
  // -------------------------------------------------------------
  return (
    <Box sx={{ p: { xs: 2, sm: 3, md: 4 }, backgroundColor: "#f8fafc", minHeight: "100vh" }}>
      {/* Main Title */}
      <Typography variant="h5" fontWeight="800" color="#0f172a" mb={3}>
        Recommendations
      </Typography>

      {/* Tabs */}
      <Box sx={{ borderBottom: 1, borderColor: "#e2e8f0", mb: 3 }}>
        <Tabs
          value={tabValue}
          onChange={handleTabChange}
          textColor="primary"
          indicatorColor="primary"
          variant="scrollable"
          scrollButtons="auto"
          allowScrollButtonsMobile
          sx={{
            "& .MuiTab-root": {
              textTransform: "none",
              fontWeight: 600,
              fontSize: "0.95rem",
              minWidth: { xs: 70, sm: 90 },
              px: 2,
            },
          }}
        >
          <Tab label="All" />
          <Tab label="Active" />
          <Tab label="Target Hit" />
          <Tab label="SL Hit" />
        </Tabs>
      </Box>

      {/* Grid List */}
      <Grid container spacing={{ xs: 2, sm: 3 }}>
        {recommendations.map((item) => (
          <Grid item xs={12} sm={6} md={6} lg={4} xl={3} key={item.id} sx={{ display: "flex" }}>
            <Card
              elevation={0}
              sx={{
                width: "100%",
                display: "flex",
                flexDirection: "column",
                borderRadius: 3,
                border: "1px solid #e2e8f0",
                backgroundColor: "#ffffff",
                boxShadow: "0px 2px 8px rgba(0, 0, 0, 0.04)",
                transition: "transform 0.2s ease, box-shadow 0.2s ease",
                "&:hover": {
                  transform: "translateY(-2px)",
                  boxShadow: "0px 6px 16px rgba(0, 0, 0, 0.08)",
                },
              }}
            >
              <CardContent
                sx={{
                  p: { xs: 2, sm: 2.5 },
                  display: "flex",
                  flexDirection: "column",
                  height: "100%",
                  "&:last-child": {
                    pb: { xs: 2, sm: 2.5 },
                  },
                }}
              >
                {/* ------------------------------------------------------------- */}
                {/* UPDATED HEADER SECTION: 2 LINES ON MOBILE, 1 LINE ON DESKTOP  */}
                {/* ------------------------------------------------------------- */}
                <Box
                  sx={{
                    display: "flex",
                    flexDirection: { xs: "column", sm: "row" },
                    alignItems: { xs: "flex-start", sm: "center" },
                    justifyContent: "space-between",
                    gap: { xs: 0.75, sm: 1 },
                    mb: 1.5,
                    width: "100%",
                  }}
                >
                  {/* Stock Name */}
                  <Typography
                    variant="h6"
                    fontWeight="700"
                    color="#0f172a"
                    sx={{
                      fontSize: { xs: "1rem", sm: "1.05rem" },
                      lineHeight: 1.2,
                      wordBreak: "break-word",
                    }}
                  >
                    {item.stock_name}
                  </Typography>

                  {/* Badges Container */}
                  <Stack
                    direction="row"
                    spacing={0.75}
                    alignItems="center"
                    sx={{ flexShrink: 0 }}
                  >
                    <Chip
                      label={item.recommendation_type}
                      sx={{
                        backgroundColor: "#22c55e",
                        color: "#ffffff",
                        fontWeight: 700,
                        fontSize: "0.65rem",
                        height: 20,
                        px: 0.5,
                      }}
                    />

                    <Chip
                      label={item.status}
                      sx={{
                        backgroundColor: "#eff6ff",
                        color: "#2563eb",
                        fontWeight: 600,
                        fontSize: "0.7rem",
                        height: 20,
                        px: 0.5,
                      }}
                    />
                  </Stack>
                </Box>

                {/* Author & Timestamp */}
                <Typography
                  variant="caption"
                  color="#64748b"
                  display="block"
                  mb={2.5}
                  sx={{
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                >
                  {item.ra_name} • {formatDate(item.created_at)}
                </Typography>

                {/* Price Indicators Box */}
                <Box
                  sx={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    backgroundColor: "#f8fafc",
                    borderRadius: 2,
                    p: 1.5,
                    mb: 2.5,
                    border: "1px solid #f1f5f9",
                  }}
                >
                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Typography variant="caption" color="#94a3b8" fontWeight={500} display="block" noWrap>
                      Entry
                    </Typography>
                    <Typography variant="body2" fontWeight="700" color="#0f172a" mt={0.25} noWrap>
                      ₹{item.entry_price}
                    </Typography>
                  </Box>
                  <Box sx={{ flex: 1, textAlign: "center", minWidth: 0 }}>
                    <Typography variant="caption" color="#94a3b8" fontWeight={500} display="block" noWrap>
                      Target
                    </Typography>
                    <Typography variant="body2" fontWeight="700" color="#16a34a" mt={0.25} noWrap>
                      ₹{item.target_price}
                    </Typography>
                  </Box>
                  <Box sx={{ flex: 1, textAlign: "right", minWidth: 0 }}>
                    <Typography variant="caption" color="#94a3b8" fontWeight={500} display="block" noWrap>
                      Stop Loss
                    </Typography>
                    <Typography variant="body2" fontWeight="700" color="#dc2626" mt={0.25} noWrap>
                      ₹{item.stop_loss}
                    </Typography>
                  </Box>
                </Box>

                {/* Action Buttons */}
                <Box
                  sx={{
                    display: "flex",
                    flexDirection: { xs: "column", sm: "row" },
                    gap: 1,
                    mt: "auto",
                  }}
                >
                  <Button
                    variant="outlined"
                    onClick={() => setSelectedRec(item)}
                    sx={{
                      flex: 1,
                      minWidth: 0,
                      borderRadius: "20px",
                      borderColor: "#cbd5e1",
                      color: "#334155",
                      textTransform: "none",
                      fontWeight: 600,
                      fontSize: { xs: "0.75rem", md: "0.68rem", lg: "0.73rem" },
                      py: 0.8,
                      px: 0.5,
                      lineHeight: 1.15,
                      minHeight: "36px",
                      "&:hover": {
                        borderColor: "#94a3b8",
                        backgroundColor: "#f8fafc",
                      },
                    }}
                  >
                    View Recommendation
                  </Button>
                  <Button
                    variant="contained"
                    sx={{
                      flex: 1,
                      minWidth: 0,
                      borderRadius: "20px",
                      backgroundColor: "#4f46e5",
                      textTransform: "none",
                      fontWeight: 600,
                      fontSize: { xs: "0.75rem", md: "0.68rem", lg: "0.73rem" },
                      py: 0.8,
                      px: 0.5,
                      lineHeight: 1.15,
                      minHeight: "36px",
                      boxShadow: "none",
                      "&:hover": {
                        backgroundColor: "#4338ca",
                        boxShadow: "none",
                      },
                    }}
                  >
                    Mark Trade Taken
                  </Button>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Box>
  );
};

export default ClientRecommendation;