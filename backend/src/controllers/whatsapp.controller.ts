import { Request, Response } from "express";
import { sendWhatsAppTextMessage } from "../services/whatsapp.service";

export const testWhatsAppMessage = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { phones, message } = req.body;

    if (!Array.isArray(phones) || phones.length === 0) {
      res.status(400).json({
        success: false,
        message: "At least one phone number is required",
      });
      return;
    }

    if (!message?.trim()) {
      res.status(400).json({
        success: false,
        message: "Message is required",
      });
      return;
    }

    const results = [];

    for (const phone of phones) {
      try {
        const result = await sendWhatsAppTextMessage(phone, message);

        results.push({
          phone,
          success: true,
          messageId: result.messages?.[0]?.id,
        });
      } catch (err: any) {
        results.push({
          phone,
          success: false,
          error: err.message,
        });
      }
    }

    res.status(200).json({
      success: true,
      message: "WhatsApp messages processed",
      results,
    });

  } catch (error) {
    console.error("WhatsApp test error:", error);

    res.status(500).json({
      success: false,
      message:
        error instanceof Error
          ? error.message
          : "Failed to send WhatsApp messages",
    });
  }
};