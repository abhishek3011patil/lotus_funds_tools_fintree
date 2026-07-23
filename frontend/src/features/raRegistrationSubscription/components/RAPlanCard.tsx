import {
  Box,
  Button,
  Card,
  CardActions,
  CardContent,
  Chip,
  CircularProgress,
  Divider,
  Stack,
  Typography,
} from "@mui/material";
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutline";
import type { RAPlan } from "../types";

export interface RAPlanCardProps {
  plan: RAPlan;
  selected: boolean;
  loading: boolean;
  disabled: boolean;
  onChoose: () => void;
}

const formatPlanPrice = (plan: RAPlan): string => {
  try {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: plan.currency,
      maximumFractionDigits:
        plan.pricePaise % 100 === 0 ? 0 : 2,
    }).format(plan.pricePaise / 100);
  } catch {
    return `${(plan.pricePaise / 100).toLocaleString(
      "en-IN"
    )} ${plan.currency}`;
  }
};

const formatFeatureValue = (
  value: RAPlan["features"][number]["value"]
): string | null => {
  if (
    value === null ||
    value === true ||
    value === false ||
    value === ""
  ) {
    return null;
  }

  return String(value);
};

const RAPlanCard = ({
  plan,
  selected,
  loading,
  disabled,
  onChoose,
}: RAPlanCardProps) => {
  const headingId = `ra-plan-${plan.id}-heading`;
  const price = formatPlanPrice(plan);
  const enabledFeatures = plan.features.filter(
    (feature) => feature.enabled
  );

  return (
    <Card
      component="article"
      aria-labelledby={headingId}
      variant="outlined"
      sx={{
        height: "100%",
        display: "flex",
        flexDirection: "column",
        borderRadius: 3,
        borderWidth: selected ? 2 : 1,
        borderColor: selected ? "#1976d2" : "#d9e2ec",
        boxShadow: selected
          ? "0 14px 34px rgba(25, 118, 210, 0.14)"
          : "0 8px 24px rgba(28, 53, 74, 0.07)",
        transition:
          "border-color 160ms ease, box-shadow 160ms ease, transform 160ms ease",
        "&:hover": {
          transform: disabled ? "none" : "translateY(-2px)",
          boxShadow:
            "0 14px 34px rgba(28, 53, 74, 0.12)",
        },
      }}
    >
      <CardContent
        sx={{
          p: { xs: 2.5, sm: 3 },
          flexGrow: 1,
        }}
      >
        <Stack
          direction="row"
          justifyContent="space-between"
          alignItems="flex-start"
          spacing={1}
        >
          <Typography
            id={headingId}
            component="h2"
            variant="h5"
            sx={{
              color: "#172b4d",
              fontWeight: 800,
              lineHeight: 1.25,
            }}
          >
            {plan.displayName}
          </Typography>
          {selected && (
            <Chip
              label="Selected"
              color="primary"
              size="small"
              aria-label={`${plan.displayName} is selected`}
            />
          )}
        </Stack>

        {plan.description && (
          <Typography
            variant="body2"
            sx={{
              mt: 1.25,
              color: "#5d6b7e",
              lineHeight: 1.65,
            }}
          >
            {plan.description}
          </Typography>
        )}

        <Box sx={{ mt: 2.5 }}>
          <Typography
            variant="caption"
            sx={{
              color: "#637083",
              fontWeight: 700,
              textTransform: "uppercase",
              letterSpacing: "0.06em",
            }}
          >
            Annual price
          </Typography>
          <Typography
            variant="h4"
            sx={{
              mt: 0.25,
              color: "#0d47a1",
              fontWeight: 800,
            }}
          >
            {price}
          </Typography>
          <Typography
            variant="body2"
            sx={{ mt: 0.5, color: "#637083" }}
          >
            {plan.currency} · {plan.durationDays} days
          </Typography>
        </Box>

        <Divider sx={{ my: 2.5 }} />

        <Typography
          component="h3"
          variant="subtitle2"
          sx={{ color: "#27364a", fontWeight: 800 }}
        >
          Included features
        </Typography>
        {enabledFeatures.length > 0 ? (
          <Stack
            component="ul"
            spacing={1.1}
            sx={{ p: 0, mt: 1.5, mb: 0, listStyle: "none" }}
          >
            {enabledFeatures.map((feature) => {
              const featureValue = formatFeatureValue(
                feature.value
              );

              return (
                <Stack
                  component="li"
                  key={feature.key}
                  direction="row"
                  spacing={1}
                  alignItems="flex-start"
                >
                  <CheckCircleOutlineIcon
                    aria-hidden="true"
                    sx={{
                      mt: "2px",
                      color: "#1976d2",
                      fontSize: 19,
                    }}
                  />
                  <Box>
                    <Typography
                      variant="body2"
                      sx={{ color: "#34445a" }}
                    >
                      {feature.displayName}
                      {featureValue
                        ? `: ${featureValue}`
                        : ""}
                    </Typography>
                    {feature.description && (
                      <Typography
                        variant="caption"
                        sx={{
                          display: "block",
                          mt: 0.25,
                          color: "#6b778c",
                        }}
                      >
                        {feature.description}
                      </Typography>
                    )}
                  </Box>
                </Stack>
              );
            })}
          </Stack>
        ) : (
          <Typography
            variant="body2"
            sx={{ mt: 1.25, color: "#6b778c" }}
          >
            No additional features are listed.
          </Typography>
        )}

        <Typography
          component="h3"
          variant="subtitle2"
          sx={{
            mt: 2.5,
            color: "#27364a",
            fontWeight: 800,
          }}
        >
          Plan limits
        </Typography>
        {plan.limits.length > 0 ? (
          <Stack
            component="dl"
            spacing={0.9}
            sx={{ mt: 1.25, mb: 0 }}
          >
            {plan.limits.map((limit) => (
              <Stack
                key={limit.key}
                direction="row"
                component="div"
                justifyContent="space-between"
                spacing={2}
              >
                <Typography
                  component="dt"
                  variant="body2"
                  sx={{ color: "#58677b" }}
                >
                  {limit.displayName}
                </Typography>
                <Typography
                  component="dd"
                  variant="body2"
                  sx={{
                    m: 0,
                    color: "#27364a",
                    fontWeight: 700,
                    textAlign: "right",
                  }}
                >
                  {limit.unlimited
                    ? "Unlimited"
                    : limit.value !== null
                      ? limit.value.toLocaleString("en-IN")
                      : "Not specified"}
                </Typography>
              </Stack>
            ))}
          </Stack>
        ) : (
          <Typography
            variant="body2"
            sx={{ mt: 1.25, color: "#6b778c" }}
          >
            No plan limits are listed.
          </Typography>
        )}
      </CardContent>

      <CardActions sx={{ p: { xs: 2.5, sm: 3 }, pt: 0 }}>
        <Button
          fullWidth
          size="large"
          variant={selected ? "contained" : "outlined"}
          disabled={disabled}
          onClick={onChoose}
          aria-describedby={headingId}
          startIcon={
            loading ? (
              <CircularProgress
                size={18}
                color="inherit"
                aria-hidden="true"
              />
            ) : undefined
          }
          sx={{
            minHeight: 48,
            borderRadius: 2,
            fontWeight: 800,
          }}
        >
          {loading
            ? "Opening secure checkout…"
            : `${selected ? "Retry payment" : "Choose plan"} — ${price}`}
        </Button>
      </CardActions>
    </Card>
  );
};

export default RAPlanCard;
