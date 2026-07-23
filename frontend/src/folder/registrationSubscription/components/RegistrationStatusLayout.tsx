import type { ReactNode } from "react";
import {
  Box,
  Button,
  Paper,
  Stack,
  Typography,
} from "@mui/material";
import type { SvgIconComponent } from "@mui/icons-material";

type Props = {
  icon: SvgIconComponent;
  title: string;
  description: string;
  details?: ReactNode;
  actionLabel?: string;
  onAction?: () => void;
};

const RegistrationStatusLayout = ({
  icon: Icon,
  title,
  description,
  details,
  actionLabel,
  onAction,
}: Props) => (
  <Box
    sx={{
      minHeight: "100vh",
      bgcolor: "#f8f9fa",
      px: 2,
      py: 6,
      display: "grid",
      placeItems: "center",
    }}
  >
    <Paper
      variant="outlined"
      sx={{
        width: "100%",
        maxWidth: 560,
        p: { xs: 3, sm: 5 },
        borderRadius: 3,
        textAlign: "center",
      }}
    >
      <Stack spacing={2.5} alignItems="center">
        <Icon
          color="primary"
          sx={{ fontSize: 62 }}
        />

        <Typography
          variant="h4"
          sx={{ fontWeight: 800 }}
        >
          {title}
        </Typography>

        <Typography color="text.secondary">
          {description}
        </Typography>

        {details}

        {actionLabel && onAction && (
          <Button
            variant="contained"
            size="large"
            onClick={onAction}
            sx={{ textTransform: "none", px: 4 }}
          >
            {actionLabel}
          </Button>
        )}
      </Stack>
    </Paper>
  </Box>
);

export default RegistrationStatusLayout;
