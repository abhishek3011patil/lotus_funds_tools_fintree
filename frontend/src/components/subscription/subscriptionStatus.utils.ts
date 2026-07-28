import type { ChipProps } from "@mui/material/Chip";

const statusPresentation: Record<
  string,
  { label: string; color: ChipProps["color"] }
> = {
  ACTIVE: { label: "Active", color: "success" },
  PAID_PENDING_APPROVAL: {
    label: "Paid – pending approval",
    color: "warning",
  },
  EXPIRING_SOON: {
    label: "Expiring soon",
    color: "warning",
  },
  EXPIRED: { label: "Expired", color: "error" },
  CANCELLED: { label: "Cancelled", color: "error" },
  SUSPENDED: { label: "Suspended", color: "warning" },
  ON_HOLD: { label: "On hold", color: "warning" },
};

export const getSubscriptionStatusPresentation = (status: string) =>
  statusPresentation[status.toUpperCase()] ?? {
    label: status
      .toLowerCase()
      .replaceAll("_", " ")
      .replace(/^\w/, (character) => character.toUpperCase()),
    color: "default" as const,
  };

export const formatSubscriptionDate = (
  value: string | null
): string => {
  if (!value) return "Not available";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Not available";

  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);
};

export const formatSubscriptionAmount = (
  amount: number | null,
  currency?: string | null
): string => {
  if (amount === null || !Number.isFinite(amount)) {
    return "Not available";
  }

  try {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: currency || "INR",
      maximumFractionDigits: 2,
    }).format(amount);
  } catch {
    return `${amount.toLocaleString("en-IN")} ${currency || ""}`.trim();
  }
};

export const normalizeDaysRemaining = (
  daysRemaining: number | null
): string =>
  daysRemaining === null || !Number.isFinite(daysRemaining)
    ? "Not available"
    : String(Math.max(0, Math.floor(daysRemaining)));
