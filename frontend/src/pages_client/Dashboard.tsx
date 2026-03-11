import { Typography, Paper } from "@mui/material";
import RecommendationHistory from "../pages/common/RecommendationHistory";

const Dashboard = () => {
  return (
    <Paper sx={{ p: 3 }}>
      <Typography variant="h5">
        Welcome to Fintree
      </Typography>
      <Typography sx={{ mt: 1 }}>
        This is your dashboard.
      </Typography>
      <RecommendationHistory statusFilter="active" />
    </Paper>
  );
};

export default Dashboard;
