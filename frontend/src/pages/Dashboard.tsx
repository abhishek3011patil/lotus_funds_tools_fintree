import { Typography, Paper } from "@mui/material";

const Dashboard = () => {
  return (
    <Paper sx={{ p: 3 }}>
      <Typography variant="h5">
        Welcome to Fintree
      </Typography>
      <Typography sx={{ mt: 1 }}>
        This is your dashboard.
      </Typography>
    </Paper>
  );
};

export default Dashboard;
