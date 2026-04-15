import { Box, CircularProgress, Typography } from "@mui/material";

type LoadingPageProps = {
  title?: string;
  subtitle?: string;
  size?: number;
};

export default function LoadingPage({
  title = "Loading",
  subtitle = "Please wait while we prepare your page.",
  size = 52,
}: LoadingPageProps) {
  return (
    <Box
      sx={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between", // pushes content apart
        alignItems: "center",
        bgcolor: "background.default",
        px: 2,
        py: 3,
      }}
    >
      {/* Empty spacer (top) */}
      <Box />

      {/* Center Spinner */}
      <Box
        sx={{
          flex: 1,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          width: "100%",
        }}
      >
        <CircularProgress
          size={size}
          thickness={4}
          color="primary"
        />
      </Box>

      {/* Bottom Text */}
      <Box
        sx={{
          textAlign: "center",
          mb: 2,
          px: 1,
        }}
      >
        <Typography
          variant="h6"
          color="text.primary"
          gutterBottom
          sx={{
            fontSize: {
              xs: "1rem",
              sm: "1.25rem",
            },
          }}
        >
          {title}
        </Typography>

        <Typography
          variant="body2"
          color="text.secondary"
          sx={{
            fontSize: {
              xs: "0.8rem",
              sm: "0.9rem",
            },
          }}
        >
          {subtitle}
        </Typography>
      </Box>
    </Box>
  );
}