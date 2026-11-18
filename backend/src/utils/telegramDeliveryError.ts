/** Turn Telegram library failures into guidance suitable for an RA to read. */
export const telegramDeliveryError = (error: unknown): string => {
  const raw = typeof error === "string"
    ? error
    : error && typeof error === "object"
      ? String((error as { errorMessage?: unknown; message?: unknown }).errorMessage ||
        (error as { message?: unknown }).message || "")
      : "";
  const code = raw.toUpperCase();

  if (code.includes("CHAT_WRITE_FORBIDDEN") || code.includes("CHAT_SEND_FORBIDDEN")) {
    return "This Telegram account cannot post in that chat. Check its posting permissions or ask a chat admin to allow messages, then retry.";
  }
  if (code.includes("CHAT_ADMIN_REQUIRED") || code.includes("CHAT_GUEST_SEND_FORBIDDEN")) {
    return "This Telegram account needs permission from the chat admin before it can post there.";
  }
  if (code.includes("USER_IS_BLOCKED") || code.includes("USER_PRIVACY_RESTRICTED")) {
    return "Telegram is blocking messages to this recipient. Ask them to check their privacy or blocked-account settings.";
  }
  if (code.includes("COULD NOT FIND THE INPUT ENTITY") || code.includes("PEER_ID_INVALID") || code.includes("USER_ID_INVALID")) {
    return "The connected Telegram account cannot find this recipient. Open their chat in Telegram or update the saved recipient, then retry.";
  }
  if (code.includes("CHANNEL_PRIVATE") || code.includes("CHAT_FORBIDDEN") || code.includes("USER_BANNED_IN_CHANNEL")) {
    return "The connected Telegram account no longer has access to this chat. Check its membership or ask a chat admin for access.";
  }
  if (code.includes("USER_DEACTIVATED")) {
    return "This recipient's Telegram account is inactive. Update or remove the saved recipient.";
  }
  const floodWait = code.match(/FLOOD_WAIT_(\d+)/);
  if (floodWait) {
    return `Telegram is temporarily limiting messages. Try again in about ${floodWait[1]} seconds.`;
  }
  if (code.includes("MESSAGE_TOO_LONG")) {
    return "The message is too long for Telegram. Shorten it and try again.";
  }
  if (code.includes("FILE_TOO_LARGE") || code.includes("PHOTO_EXT_INVALID")) {
    return "Telegram rejected an attachment. Check its size and file type, then try again.";
  }
  if (/\bTIMEOUT\b|\bETIMEDOUT\b|\bECONNRESET\b|\bNETWORK\b/.test(code)) {
    return "Telegram could not be reached. Check the connection and try again.";
  }
  if (/^(TEXT SENT|MESSAGE SENT),?\s*/i.test(raw)) return raw;
  return "Telegram could not complete this action. Check the recipient or chat permissions and try again.";
};
