import type { SxProps, Theme } from "@mui/material";

// Mirrors the established Admin dashboard and RA settings visual language.
export const roleContentSx: SxProps<Theme> = {
  "& .MuiCard-root, & .MuiPaper-root": { borderRadius: "12px", boxShadow: "none", borderColor: "#e2e8f0" },
  "& .MuiTableContainer-root": { border: "1px solid #e2e8f0", overflowX: "auto" },
  "& .MuiTableHead-root": { backgroundColor: "#f6f6f6" },
  "& .MuiTableCell-head": { color: "#334155", fontWeight: 700, whiteSpace: "nowrap" },
  "& .MuiTableCell-root": { borderColor: "#e2e8f0", py: 1.5 },
  "& .MuiTableRow-root:last-of-type .MuiTableCell-body": { borderBottom: 0 },
  "& .MuiButton-root": { borderRadius: "10px", boxShadow: "none", fontWeight: 600, textTransform: "none" },
  "& .MuiButton-root:hover": { boxShadow: "none" },
  "& .MuiOutlinedInput-root": { borderRadius: "10px" },
  "& .MuiChip-root": { fontWeight: 600 },
  "& .MuiTabs-root": { borderBottom: "1px solid #e2e8f0" },
  "& .MuiTab-root": { minHeight: 48, fontWeight: 600, textTransform: "none" },
};

export const roleDialogPaperSx: SxProps<Theme> = {
  borderRadius: "14px",
  border: "1px solid #e2e8f0",
  boxShadow: "0 18px 45px rgba(15, 23, 42, 0.16)",
};
