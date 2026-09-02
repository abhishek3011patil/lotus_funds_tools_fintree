const ADMIN_ROLES = new Set(["ADMIN", "SUPERADMIN", "SUPER_ADMIN", "EMPLOYEE"]);

export const LOGIN_ROUTES = [
  "/login",
  "/login-admin",
  "/broker/login",
  "/client/login",
] as const;

export const getLoginRoute = (
  role?: string | null,
  allowedRoles?: string[],
): string => {
  if (role === "CLIENT") return "/client/login";
  if (role === "BROKER") return "/broker/login";
  if (role && ADMIN_ROLES.has(role)) return "/login-admin";
  if (role === "RESEARCH_ANALYST") return "/login";

  if (allowedRoles?.includes("CLIENT")) return "/client/login";
  if (allowedRoles?.length === 1 && allowedRoles[0] === "BROKER") {
    return "/broker/login";
  }
  if (allowedRoles?.length && allowedRoles.every((item) => ADMIN_ROLES.has(item))) {
    return "/login-admin";
  }

  return "/login";
};

export const isLoginRoute = (pathname: string): boolean =>
  LOGIN_ROUTES.some((route) => pathname === route);

export const consumePostLoginPath = (
  fallback: string,
  allowedPrefixes: string[]
): string => {
  const savedPath = sessionStorage.getItem("postLoginPath");
  sessionStorage.removeItem("postLoginPath");
  if (
    savedPath &&
    savedPath.startsWith("/") &&
    !savedPath.startsWith("//") &&
    allowedPrefixes.some((prefix) => savedPath === prefix || savedPath.startsWith(`${prefix}/`))
  ) {
    return savedPath;
  }
  return fallback;
};

export const consumeAuthMessage = (): string => {
  const message = sessionStorage.getItem("authMessage") || "";
  sessionStorage.removeItem("authMessage");
  return message;
};
