export type AppRole =
  | "RESEARCH_ANALYST"
  | "BROKER"
  | "CLIENT"
  | "ADMIN"
  | "SUPERADMIN"
  | "EMPLOYEE";

const ROLE_ALIASES: Record<string, AppRole> = {
  RA: "RESEARCH_ANALYST",
  RESEARCH_ANALYST: "RESEARCH_ANALYST",
  BROKER: "BROKER",
  CLIENT: "CLIENT",
  ADMIN: "ADMIN",
  SUPERADMIN: "SUPERADMIN",
  SUPER_ADMIN: "SUPERADMIN",
  EMPLOYEE: "EMPLOYEE",
};

export const normalizeRole = (role: unknown): AppRole | null => {
  if (typeof role !== "string") return null;
  return ROLE_ALIASES[role.trim().toUpperCase()] ?? null;
};

export const getDefaultRouteForRole = (role: unknown): string => {
  switch (normalizeRole(role)) {
    case "RESEARCH_ANALYST":
      return "/recommendations";
    case "BROKER":
      return "/broker/dashboard";
    case "CLIENT":
      return "/client/dashboard";
    case "ADMIN":
      return "/admin/dashboard";
    case "SUPERADMIN":
      return "/super-admin/dashboard";
    case "EMPLOYEE":
      return "/automation";
    default:
      return "/login";
  }
};
