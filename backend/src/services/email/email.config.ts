export interface EmailConfig {
  enabled: boolean;
  provider: "smtp" | "gmail";
  host: string;
  port: number;
  secure: boolean;
  user: string;
  password: string;
  fromName: string;
  fromAddress: string;
}

const parseBoolean = (
  value: string | undefined,
  fallback: boolean
): boolean => {
  if (value === undefined) {
    return fallback;
  }

  return value.trim().toLowerCase() === "true";
};

const stripMatchingQuotes = (value: string): string => {
  const trimmed = value.trim();
  const first = trimmed[0];
  const last = trimmed[trimmed.length - 1];

  if (
    trimmed.length >= 2 &&
    (first === "'" || first === '"') &&
    first === last
  ) {
    return trimmed.slice(1, -1);
  }

  return trimmed;
};

const normalizePassword = (
  value: string | undefined,
  provider: "smtp" | "gmail",
  host: string
): string => {
  const withoutQuotes = stripMatchingQuotes(value || "")
    .replace(/[\r\n]/g, "")
    .trim();

  return provider === "gmail" ||
    host.toLowerCase().includes("gmail")
    ? withoutQuotes.replace(/\s/g, "")
    : withoutQuotes;
};

export const getEmailConfig = (
  environment: NodeJS.ProcessEnv = process.env
): EmailConfig => {
  const provider =
    environment.EMAIL_PROVIDER?.trim().toLowerCase() ===
    "gmail"
      ? "gmail"
      : "smtp";
  const host = environment.EMAIL_HOST?.trim() || "";
  const parsedPort = Number(environment.EMAIL_PORT);
  const port = Number.isInteger(parsedPort)
    ? parsedPort
    : 587;
  const user = environment.EMAIL_USER?.trim() || "";

  return {
    enabled: parseBoolean(
      environment.EMAIL_ENABLED,
      false
    ),
    provider,
    host,
    port,
    secure: parseBoolean(
      environment.EMAIL_SECURE,
      port === 465
    ),
    user,
    password: normalizePassword(
      environment.EMAIL_PASSWORD ||
        environment.EMAIL_PASS,
      provider,
      host
    ),
    fromName:
      environment.EMAIL_FROM_NAME?.trim() ||
      "Lotus Funds",
    fromAddress:
      environment.EMAIL_FROM_ADDRESS?.trim() || user,
  };
};

export const getMissingEmailConfig = (
  config: EmailConfig
): string[] => {
  const missing: string[] = [];

  if (config.provider === "smtp" && !config.host) {
    missing.push("EMAIL_HOST");
  }
  if (!config.user) {
    missing.push("EMAIL_USER");
  }
  if (!config.password) {
    missing.push("EMAIL_PASSWORD");
  }
  if (!config.fromAddress) {
    missing.push("EMAIL_FROM_ADDRESS");
  }

  return missing;
};
