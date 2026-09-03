export type PasswordLinkMode = "setup" | "reset" | null;

type PasswordLinkUser = {
  role?: unknown;
  status?: unknown;
  is_active?: unknown;
  password_hash?: unknown;
  legacy_approved_ra?: unknown;
};

export const getPasswordLinkMode = (
  user: PasswordLinkUser
): PasswordLinkMode => {
  const supportedRole =
    user.role === "RESEARCH_ANALYST" || user.role === "CLIENT";

  if (!supportedRole) return null;

  const isInactive = user.status === "inactive" && user.is_active === false;
  const isActive = user.status === "active" && user.is_active === true;

  if (isInactive && !user.password_hash) return "setup";
  if (isActive && Boolean(user.password_hash)) return "reset";

  // Accounts created by the legacy approval flow have a temporary password
  // but remain inactive until they complete the reset-link flow.
  if (
    user.role === "RESEARCH_ANALYST" &&
    isInactive &&
    Boolean(user.password_hash) &&
    user.legacy_approved_ra === true
  ) {
    return "reset";
  }

  return null;
};
