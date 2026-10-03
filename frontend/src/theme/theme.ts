import { createTheme } from "@mui/material/styles";

const theme = createTheme({
  palette: {
    primary: {
      main: "#3155D9",
      dark: "#203A9D",
      light: "#E9EEFF",
    },
    success: {
      main: "#15803D",
      light: "#DCFCE7",
    },
    warning: {
      main: "#B45309",
      light: "#FEF3C7",
    },
    error: {
      main: "#B91C1C",
      light: "#FEE2E2",
    },
    info: {
      main: "#0369A1",
      light: "#E0F2FE",
    },
    background: {
      default: "#F7F8FC",
      paper: "#FFFFFF",
    },
    text: {
      primary: "#172033",
      secondary: "#64748B",
    },
    divider: "#E2E8F0",
  },
  spacing: 8,
  shape: {
    borderRadius: 10,
  },
  typography: {
    fontFamily: 'Inter, "Segoe UI", Roboto, Arial, sans-serif',
    fontSize: 14,
    h1: { fontWeight: 800, letterSpacing: "-0.035em" },
    h2: { fontWeight: 800, letterSpacing: "-0.03em" },
    h3: { fontWeight: 800, letterSpacing: "-0.025em" },
    h4: { fontWeight: 800, letterSpacing: "-0.02em", fontSize: "clamp(1.6rem, 3vw, 2.125rem)" },
    h5: { fontWeight: 750, letterSpacing: "-0.015em" },
    h6: { fontWeight: 700, letterSpacing: "-0.01em" },
    button: { fontWeight: 700 },
    caption: { lineHeight: 1.5 },
  },
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        body: { WebkitFontSmoothing: "antialiased" },
      },
    },
    MuiButton: {
      defaultProps: { disableElevation: true },
      styleOverrides: {
        root: { textTransform: "none", minHeight: 40, padding: "8px 16px", borderRadius: 10 },
        sizeSmall: { minHeight: 32, padding: "5px 12px" },
        contained: { boxShadow: "none", "&:hover": { boxShadow: "none" } },
      },
    },
    MuiPaper: {
      styleOverrides: { root: { backgroundImage: "none" } },
    },
    MuiCard: {
      styleOverrides: { root: { borderColor: "#E2E8F0" } },
    },
    MuiTableCell: {
      styleOverrides: {
        head: { backgroundColor: "#F1F5F9", color: "#334155", fontWeight: 750, whiteSpace: "nowrap" },
        root: { borderColor: "#E2E8F0", padding: "12px 16px" },
      },
    },
    MuiTableRow: {
      styleOverrides: { root: { "&:hover": { backgroundColor: "#F8FAFC" } } },
    },
    MuiChip: {
      styleOverrides: { root: { fontWeight: 700 }, labelSmall: { paddingLeft: 9, paddingRight: 9 } },
    },
    MuiAlert: {
      styleOverrides: { root: { borderRadius: 10, alignItems: "center" } },
    },
    MuiSkeleton: {
      defaultProps: { animation: "wave" },
    },
  },
});

export default theme;
