export const isErrataVersion = (versionType: unknown) =>
  String(versionType || "").toUpperCase() === "ERRATA";

export const errataRowSx = {
  backgroundColor: "#FFF8E1",
  "& > td:first-of-type": {
    boxShadow: "inset 4px 0 0 #F59E0B",
  },
  "&:hover": {
    backgroundColor: "#FFF1C2 !important",
  },
} as const;

export const errataBadgeSx = {
  display: "inline-flex",
  alignItems: "center",
  px: 1,
  py: 0.25,
  borderRadius: "999px",
  fontSize: "0.65rem",
  lineHeight: 1.4,
  fontWeight: 800,
  letterSpacing: "0.03em",
  backgroundColor: "#FEF3C7",
  color: "#92400E",
  border: "1px solid #F59E0B",
} as const;
