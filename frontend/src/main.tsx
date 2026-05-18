import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";

import {
  ThemeProvider,
  CssBaseline,
} from "@mui/material";

import theme from "./theme/theme";

// ✅ IMPORT PROVIDER
import {
  TelegramNotificationProvider,
} from "./hooks/useTelegramNotification";

ReactDOM.createRoot(
  document.getElementById("root")!
).render(
  <React.StrictMode>

    <ThemeProvider theme={theme}>

      <CssBaseline />

      {/* ✅ WRAP APP HERE */}
      <TelegramNotificationProvider>
        <App />
      </TelegramNotificationProvider>

    </ThemeProvider>

  </React.StrictMode>
);