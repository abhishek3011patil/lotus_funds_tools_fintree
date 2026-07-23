import {
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Divider,
  Stack,
  Typography,
} from "@mui/material";
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutline";
import type { SubscriptionPlan } from "../types";

type Props = {
  plan: SubscriptionPlan;
  processing: boolean;
  onSelect: (plan: SubscriptionPlan) => void;
};

const formatPrice = (
  amountRupees: number,
  currency: string
): string =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(amountRupees);

const billingLabel: Record<
  SubscriptionPlan["billingPeriod"],
  string
> = {
  MONTHLY: "month",
  QUARTERLY: "quarter",
  HALF_YEARLY: "6 months",
  YEARLY: "year",
  CUSTOM: "billing period",
};

const SubscriptionPlanCard = ({
  plan,
  processing,
  onSelect,
}: Props) => {
  const payable = plan.price.amountPaise > 0;

  return (
    <Card
      variant="outlined"
      sx={{
        height: "100%",
        display: "flex",
        flexDirection: "column",
        borderRadius: 3,
        borderWidth: plan.isPopular ? 2 : 1,
        borderColor: plan.isPopular
          ? "primary.main"
          : "divider",
        position: "relative",
      }}
    >
      {plan.isPopular && (
        <Chip
          label="Most popular"
          color="primary"
          size="small"
          sx={{
            position: "absolute",
            top: 14,
            right: 14,
            fontWeight: 700,
          }}
        />
      )}

      <CardContent
        sx={{
          p: 3,
          display: "flex",
          flexDirection: "column",
          flexGrow: 1,
        }}
      >
        <Typography
          variant="overline"
          color="text.secondary"
          sx={{ fontWeight: 700 }}
        >
          {plan.tierCode.replace("_", " ")}
        </Typography>

        <Typography
          variant="h5"
          sx={{ fontWeight: 800, pr: 9 }}
        >
          {plan.displayName}
        </Typography>

        <Typography
          variant="body2"
          color="text.secondary"
          sx={{ mt: 1, minHeight: 44 }}
        >
          {plan.shortDescription ||
            plan.fullDescription ||
            "Subscription plan"}
        </Typography>

        <Box sx={{ mt: 3 }}>
          {payable ? (
            <>
              <Typography
                component="span"
                variant="h4"
                sx={{ fontWeight: 800 }}
              >
                {formatPrice(
                  plan.price.amountRupees,
                  plan.price.currency
                )}
              </Typography>
              <Typography
                component="span"
                variant="body2"
                color="text.secondary"
              >
                {" "}
                / {billingLabel[plan.billingPeriod]}
              </Typography>
            </>
          ) : (
            <Typography
              variant="h6"
              color="text.secondary"
              sx={{ fontWeight: 700 }}
            >
              Price not configured
            </Typography>
          )}
        </Box>

        {plan.trialDays > 0 && (
          <Typography
            variant="caption"
            color="success.main"
            sx={{ mt: 0.5, fontWeight: 700 }}
          >
            {plan.trialDays}-day trial
          </Typography>
        )}

        <Divider sx={{ my: 2.5 }} />

        <Stack spacing={1.25} sx={{ flexGrow: 1 }}>
          {plan.features.length > 0 ? (
            plan.features.map((feature) => (
              <Stack
                key={feature.key}
                direction="row"
                spacing={1}
                alignItems="flex-start"
              >
                <CheckCircleOutlineIcon
                  color="success"
                  sx={{ fontSize: 19, mt: "2px" }}
                />
                <Box>
                  <Typography
                    variant="body2"
                    sx={{ fontWeight: 600 }}
                  >
                    {feature.name}
                  </Typography>
                  {feature.description && (
                    <Typography
                      variant="caption"
                      color="text.secondary"
                    >
                      {feature.description}
                    </Typography>
                  )}
                </Box>
              </Stack>
            ))
          ) : (
            <Typography
              variant="body2"
              color="text.secondary"
            >
              Features will appear here after they are
              configured by the administrator.
            </Typography>
          )}
        </Stack>

        {plan.limits.length > 0 && (
          <Box
            sx={{
              mt: 2.5,
              p: 1.5,
              bgcolor: "action.hover",
              borderRadius: 2,
            }}
          >
            {plan.limits.map((limit) => (
              <Typography
                key={limit.key}
                variant="caption"
                display="block"
              >
                <strong>{limit.name}:</strong>{" "}
                {limit.isUnlimited
                  ? "Unlimited"
                  : String(limit.value ?? "-")}
              </Typography>
            ))}
          </Box>
        )}

        <Button
          fullWidth
          variant={plan.isPopular ? "contained" : "outlined"}
          size="large"
          disabled={!payable || processing}
          onClick={() => onSelect(plan)}
          sx={{ mt: 3, textTransform: "none" }}
        >
          {processing
            ? "Selecting..."
            : payable
              ? "Select plan"
              : "Currently unavailable"}
        </Button>
      </CardContent>
    </Card>
  );
};

export default SubscriptionPlanCard;
