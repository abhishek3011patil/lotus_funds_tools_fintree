import { createTheme } from "@mui/material/styles";

const theme = createTheme({
  palette: {
    primary: {
      main: "#1e40af", // calm blue
    },
    background: {
      default: "#f8fafc",
    },
  },
  typography: {
    fontFamily: "Inter, Roboto, sans-serif",
    fontSize: 14,
    h6: {
      fontWeight: 600,
    },
  },
  shape: {
    borderRadius: 8,
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: "none",
          padding: "8px 16px",
        },
      },
    },
  },
});

export default theme;
