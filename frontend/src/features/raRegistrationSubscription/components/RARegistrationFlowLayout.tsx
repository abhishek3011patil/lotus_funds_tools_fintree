import type { ReactNode } from "react";
import { Box, Container, Paper, Typography } from "@mui/material";

export interface RARegistrationFlowLayoutProps {
  title?: string;
  subtitle?: string;
  stepText?: string;
  children: ReactNode;
  maxWidth?: "sm" | "md" | "lg" | "xl";
}

const RARegistrationFlowLayout = ({
  title,
  subtitle,
  stepText,
  children,
  maxWidth = "lg",
}: RARegistrationFlowLayoutProps) => (
  <Box
    component="main"
    sx={{
      minHeight: "100vh",
      bgcolor: "#f4f7fb",
      backgroundImage:
        "linear-gradient(180deg, #edf5ff 0px, #f4f7fb 320px)",
      py: { xs: 3, sm: 5, md: 7 },
      px: { xs: 1, sm: 2 },
    }}
  >
    <Container maxWidth={maxWidth}>
      <Paper
        elevation={0}
        sx={{
          border: "1px solid",
          borderColor: "#dbe5f2",
          borderRadius: { xs: 2.5, sm: 4 },
          overflow: "hidden",
          bgcolor: "rgba(255, 255, 255, 0.96)",
          boxShadow:
            "0 18px 50px rgba(32, 78, 121, 0.10)",
        }}
      >
        {(title || subtitle || stepText) && (
          <Box
            sx={{
              px: { xs: 2.5, sm: 4, md: 6 },
              pt: { xs: 3, sm: 4.5 },
              pb: { xs: 2.5, sm: 3.5 },
              borderBottom: "1px solid",
              borderColor: "#e4ebf3",
            }}
          >
            {stepText && (
              <Typography
                variant="overline"
                sx={{
                  display: "block",
                  mb: 0.75,
                  color: "#1769aa",
                  fontWeight: 800,
                  letterSpacing: "0.09em",
                }}
              >
                {stepText}
              </Typography>
            )}
            {title && (
              <Typography
                component="h1"
                variant="h4"
                sx={{
                  color: "#172b4d",
                  fontWeight: 800,
                  fontSize: {
                    xs: "1.65rem",
                    sm: "2.1rem",
                  },
                  lineHeight: 1.2,
                }}
              >
                {title}
              </Typography>
            )}
            {subtitle && (
              <Typography
                variant="body1"
                sx={{
                  mt: title ? 1.25 : 0,
                  maxWidth: 760,
                  color: "#52637a",
                  lineHeight: 1.7,
                }}
              >
                {subtitle}
              </Typography>
            )}
          </Box>
        )}

        <Box
          sx={{
            px: { xs: 2.5, sm: 4, md: 6 },
            py: { xs: 3, sm: 4.5 },
          }}
        >
          {children}
        </Box>
      </Paper>
    </Container>
  </Box>
);

export default RARegistrationFlowLayout;
