import { Box, Typography } from "@mui/material";

const BrokerDashboard = () => {
  return (
    <Box sx={{ p: 2 }}>
      <Typography variant="h4" fontWeight="bold">
        Welcome to Broker Dashboard
      </Typography>
      <Typography variant="body1" color="text.secondary" sx={{ mt: 1 }}>
        Broker specific content goes here.
      </Typography>
    </Box>
  );
};

export default BrokerDashboard;