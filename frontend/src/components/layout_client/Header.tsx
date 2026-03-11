import { AppBar, Toolbar, Typography, Box, IconButton } from "@mui/material";
import MenuIcon from "@mui/icons-material/Menu";
import { useEffect, useState } from "react";

interface HeaderProps {
  onMenuClick?: () => void;
}

const Header = ({ onMenuClick }: HeaderProps) => {
  const HEADER_HEIGHT = 64;
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const interval = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);

  const formattedDate = now.toLocaleDateString("en-US");
  const formattedTime = now.toLocaleTimeString("en-US");

  return (
    <AppBar
      position="fixed"
      elevation={0}
      sx={{
        backgroundColor: "#22c55e",
        height: HEADER_HEIGHT,
        minHeight: HEADER_HEIGHT,
        justifyContent: "center",
        width: { xs: "100%", sm: "calc(100% - 220px)" },
        ml: { xs: 0, sm: "220px" },
        zIndex: (theme) => theme.zIndex.drawer + 1,
      }}
    >
      <Toolbar
        sx={{
          height: HEADER_HEIGHT,
          minHeight: HEADER_HEIGHT,
          px: 2,
          py: 0,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          {/* Hamburger menu for mobile */}
          <IconButton
            color="inherit"
            onClick={onMenuClick}
            sx={{
              display: { xs: "flex", sm: "none" },
              p: 0.5,
            }}
          >
            <MenuIcon sx={{ fontSize: 24 }} />
          </IconButton>

          {/* Mobile page title */}
          <Typography
            sx={{
              fontWeight: 700,
              fontSize: 18,
              lineHeight: 1,
              display: { xs: "block", sm: "none" },
            }}
          >
            Recommendations
          </Typography>

          {/* Desktop page title */}
          <Typography
            sx={{
              fontWeight: 700,
              fontSize: 18,
              lineHeight: 1,
              display: { xs: "none", sm: "block" },
            }}
          >
            Recommendations
          </Typography>
        </Box>

        <Box sx={{ display: "flex", gap: 1.5, alignItems: "center" }}>
          <Typography
            sx={{
              fontWeight: 700,
              fontSize: 12,
              display: "block",
            }}
          >
            {formattedDate}
          </Typography>
          <Typography
            sx={{
              fontWeight: 700,
              fontSize: 12,
              display: "block",
            }}
          >
            {formattedTime}
          </Typography>
        </Box>
      </Toolbar>
    </AppBar>
  );
};

export default Header;

