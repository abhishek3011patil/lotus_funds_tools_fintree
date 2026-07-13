type WhatsAppMessageResponse = {
  messaging_product?: string;
  contacts?: Array<{
    input: string;
    wa_id: string;
  }>;
  messages?: Array<{
    id: string;
    message_status?: string;
  }>;
  error?: {
    message: string;
    type?: string;
    code?: number;
    error_subcode?: number;
    fbtrace_id?: string;
  };
};

const getWhatsAppConfig = () => {
  const accessToken = process.env.WHATSAPP_ACCESS_TOKEN;
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;
  const apiVersion = process.env.WHATSAPP_API_VERSION || "v23.0";

  if (!accessToken) {
    throw new Error("WHATSAPP_ACCESS_TOKEN is missing");
  }

  if (!phoneNumberId) {
    throw new Error("WHATSAPP_PHONE_NUMBER_ID is missing");
  }

  return {
    accessToken,
    phoneNumberId,
    apiVersion,
  };
};

const normalizePhone = (phone: string) => {
  const digits = phone.replace(/\D/g, "");

  if (digits.length === 10) {
    return `91${digits}`;
  }

  return digits;
};

export const sendWhatsAppTextMessage = async (
  recipientPhone: string,
  message: string
): Promise<WhatsAppMessageResponse> => {
  const { accessToken, phoneNumberId, apiVersion } =
    getWhatsAppConfig();

  const normalizedPhone = normalizePhone(recipientPhone);

  if (!normalizedPhone) {
    throw new Error("A valid recipient phone number is required");
  }

  if (!message?.trim()) {
    throw new Error("Message is required");
  }

  const response = await fetch(
    `https://graph.facebook.com/${apiVersion}/${phoneNumberId}/messages`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        messaging_product: "whatsapp",
        recipient_type: "individual",
        to: normalizedPhone,
        type: "text",
        text: {
          preview_url: false,
          body: message.trim(),
        },
      }),
    }
  );

  const data = (await response.json()) as WhatsAppMessageResponse;

  if (!response.ok) {
    console.error("WhatsApp API error:", data.error);

    throw new Error(
      data.error?.message ||
        `WhatsApp request failed with status ${response.status}`
    );
  }

  return data;
};