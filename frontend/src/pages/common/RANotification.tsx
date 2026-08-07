import React from "react";
import { Box, Typography, Paper } from "@mui/material";

const RANotification = () => {
  return (
    <Box sx={{ p: 3 }}>
      <Paper sx={{ p: 4, textAlign: "center" }} elevation={1}>
        <Typography variant="h5" fontWeight="bold" gutterBottom>
          Notifications
        </Typography>
        <Typography variant="body2" color="text.secondary">
          No new notifications available right now.
        </Typography>
      </Paper>
    </Box>
  );
};

export default RANotification;