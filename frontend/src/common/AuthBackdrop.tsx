import { Box, Typography } from "@mui/material";
import { Link as RouterLink } from "react-router-dom";

type AuthBackdropProps = {
  portal: string;
  accent?: string;
  message: string;
};

const AuthBackdrop = ({
  portal,
  accent = "#4F6CF8",
  message,
}: AuthBackdropProps) => (
  <>
    <Box
      component={RouterLink}
      to="/"
      aria-label="Go to Tarkashh home"
      sx={{
        position: "absolute",
        top: { xs: 20, md: 30 },
        left: { xs: 22, md: 42 },
        zIndex: 2,
        display: "inline-flex",
        alignItems: "center",
        gap: 1.2,
        color: "#14213d",
        textDecoration: "none",
      }}
    >
      <Box
        aria-hidden="true"
        sx={{
          width: 32,
          height: 32,
          borderRadius: "10px",
          display: "grid",
          placeItems: "center",
          color: "white",
          bgcolor: accent,
          fontSize: 20,
          fontWeight: 900,
          transform: "rotate(-8deg)",
        }}
      >
        ↗
      </Box>
      <Typography sx={{ fontWeight: 800, fontSize: 20, letterSpacing: "-0.03em" }}>
        Tarkashh
      </Typography>
    </Box>

    <Box
      aria-hidden="true"
      sx={{
        position: "absolute",
        inset: 0,
        overflow: "hidden",
        pointerEvents: "none",
      }}
    >
      <Box
        sx={{
          position: "absolute",
          width: { xs: 220, md: 560 },
          height: { xs: 220, md: 560 },
          borderRadius: "50%",
          bgcolor: `${accent}12`,
          top: { xs: -105, md: -170 },
          right: { xs: -100, md: -120 },
        }}
      />
      <Box
        sx={{
          position: "absolute",
          width: 230,
          height: 230,
          borderRadius: "50%",
          border: `1px solid ${accent}24`,
          bottom: -115,
          right: "28%",
        }}
      />
    </Box>

    <Box
      sx={{
        position: "absolute",
        left: { md: "5.5vw", lg: "8vw" },
        top: "50%",
        transform: "translateY(-48%)",
        width: { md: "37%", lg: "39%" },
        display: { xs: "none", md: "block" },
        color: "#14213d",
      }}
    >
      <Typography
        sx={{
          color: accent,
          textTransform: "uppercase",
          letterSpacing: "0.16em",
          fontSize: 12,
          fontWeight: 800,
          mb: 1.5,
        }}
      >
        {portal}
      </Typography>
      <Typography
        component="p"
        sx={{
          maxWidth: 480,
          fontSize: { md: 36, lg: 48 },
          lineHeight: 1.08,
          letterSpacing: "-0.045em",
          fontWeight: 800,
        }}
      >
        {message}
      </Typography>

      <Box component="svg" viewBox="0 0 540 250" sx={{ width: "100%", mt: 3 }}>
        <defs>
          <linearGradient id={`auth-gradient-${portal.replace(/\s/g, "-")}`} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor={accent} stopOpacity="0.95" />
            <stop offset="1" stopColor="#22c55e" stopOpacity="0.85" />
          </linearGradient>
        </defs>
        <rect x="28" y="24" width="430" height="188" rx="28" fill="#fff" stroke="#dfe5f2" />
        <rect x="58" y="54" width="116" height="12" rx="6" fill="#dfe5f2" />
        <rect x="58" y="83" width="68" height="70" rx="15" fill={`${accent}18`} />
        <rect x="142" y="109" width="68" height="44" rx="15" fill={`${accent}26`} />
        <rect x="226" y="72" width="68" height="81" rx="15" fill={`${accent}38`} />
        <path d="M69 176 C132 154 164 183 225 141 S330 79 413 91" fill="none" stroke={`url(#auth-gradient-${portal.replace(/\s/g, "-")})`} strokeWidth="8" strokeLinecap="round" />
        <circle cx="413" cy="91" r="11" fill="#22c55e" />
        <path d="M397 78 L427 84 L418 110" fill="none" stroke="#22c55e" strokeWidth="7" strokeLinecap="round" strokeLinejoin="round" />
        <circle cx="456" cy="58" r="34" fill={accent} />
        <path d="M443 60 L453 70 L471 48" fill="none" stroke="#fff" strokeWidth="7" strokeLinecap="round" strokeLinejoin="round" />
      </Box>
    </Box>
  </>
);

export default AuthBackdrop;
