const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const isValidEmail = (value: unknown): boolean =>
  typeof value === "string" && EMAIL_PATTERN.test(value.trim());
