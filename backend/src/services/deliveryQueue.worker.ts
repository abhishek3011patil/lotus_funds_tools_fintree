import axios from "axios";
import { pool } from "../db";

const WHATSAPP_ACCESS_TOKEN =
  process.env.WHATSAPP_ACCESS_TOKEN?.trim();

const WHATSAPP_PHONE_NUMBER_ID =
  process.env.WHATSAPP_PHONE_NUMBER_ID?.trim();

const WORKER_INTERVAL_MS = 3000;
const MAX_ATTEMPTS = 3;

type WhatsAppSendResponse = {
  messaging_product?: string;
  contacts?: Array<{
    input?: string;
    wa_id?: string;
  }>;
  messages?: Array<{
    id: string;
    message_status?: string;
  }>;
};

type WhatsAppJob = {
  id: string;
  research_call_id: string;
  original_call_id: string | null;
  ra_user_id: string;
  participant_id: string;
  phone_number: string;
  event_type:
    | "RESEARCH_CALL_PUBLISHED"
    | "RESEARCH_CALL_ERRATA";
  status: string;
  attempts: number;
};

const valueOrNA = (value: unknown): string => {
  if (
    value === null ||
    value === undefined ||
    String(value).trim() === ""
  ) {
    return "N/A";
  }

  return String(value);
};

const normalizePhoneNumber = (phoneNumber: unknown): string => {
  return String(phoneNumber || "").replace(/\D/g, "");
};

const formatDateTime = (value: unknown): string => {
  if (!value) {
    return "N/A";
  }

  const date = new Date(String(value));

  if (Number.isNaN(date.getTime())) {
    return String(value);
  }

  return date.toLocaleString("en-IN", {
    timeZone: "Asia/Kolkata",
    day: "2-digit",
    month: "long",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });
};

const buildPublishedMessage = (call: any): string => {
  const entry =
    call.entry_price_low && call.entry_price_upper
      ? `${call.entry_price_low} - ${call.entry_price_upper}`
      : valueOrNA(call.entry_price);

  const lines = [
    "📢 *Research Call Published*",
    "",
    `*Published On:* ${formatDateTime(
      call.published_at || call.created_at
    )}`,
    "",
    `*Stock:* ${valueOrNA(
      call.display_name || call.symbol
    )}`,
    `*Action:* ${valueOrNA(call.action)}`,
    `*Exchange:* ${valueOrNA(call.exchange_type)}`,
    `*Market:* ${valueOrNA(call.market_type)}`,
    `*Call Type:* ${valueOrNA(call.call_type)}`,
    `*Trade Type:* ${valueOrNA(call.trade_type)}`,
    `*Expiry:* ${formatDateTime(call.expiry_date)}`,
    "",
    `*Entry:* ${entry}`,
    `*Target 1:* ${valueOrNA(call.target_price)}`,
    call.target_price_2
      ? `*Target 2:* ${call.target_price_2}`
      : "",
    call.target_price_3
      ? `*Target 3:* ${call.target_price_3}`
      : "",
    `*Stop Loss 1:* ${valueOrNA(call.stop_loss)}`,
    call.stop_loss_2
      ? `*Stop Loss 2:* ${call.stop_loss_2}`
      : "",
    call.stop_loss_3
      ? `*Stop Loss 3:* ${call.stop_loss_3}`
      : "",
    "",
    `*Holding Period:* ${valueOrNA(
      call.holding_period
    )}`,
    `*Rationale:* ${valueOrNA(call.rationale)}`,
    `*Underlying Study:* ${valueOrNA(
      call.underlying_study
    )}`,
    `*Remarks:* ${valueOrNA(
      call.research_remarks
    )}`,
    "",
    "*Disclaimer:*",
    valueOrNA(call.disclaimer_snapshot),
  ];

  return lines.filter((line) => line !== "").join("\n");
};

const buildErrataMessage = (
  correctedCall: any,
  originalCall: any
): string => {
  const correctionMessage =
    buildPublishedMessage(correctedCall);

  return [
    "⚠️ *ERRATA / CORRECTION*",
    "",
    `*Original Call:* ${valueOrNA(
      originalCall?.display_name ||
        originalCall?.symbol ||
        originalCall?.id
    )}`,
    `*Original Call ID:* ${valueOrNA(
      originalCall?.id
    )}`,
    "",
    correctionMessage.replace(
      "📢 *Research Call Published*",
      "✅ *Corrected Research Call*"
    ),
    "",
    "This correction supersedes the corrected values in the original call.",
  ].join("\n");
};

const getResearchCall = async (
  researchCallId: string
): Promise<any> => {
  const result = await pool.query(
    `
      SELECT *
      FROM research_calls
      WHERE id = $1
      LIMIT 1
    `,
    [researchCallId]
  );

  if ((result.rowCount ?? 0) === 0) {
    throw new Error(
      `Research call not found: ${researchCallId}`
    );
  }

  return result.rows[0];
};

const getNextPendingJob =
  async (): Promise<WhatsAppJob | null> => {
    const client = await pool.connect();

    try {
      await client.query("BEGIN");

      const result = await client.query<WhatsAppJob>(
        `
          SELECT *
          FROM whatsapp_message_jobs
          WHERE status = 'PENDING'
            AND attempts < $1
          ORDER BY created_at ASC
          FOR UPDATE SKIP LOCKED
          LIMIT 1
        `,
        [MAX_ATTEMPTS]
      );

      if ((result.rowCount ?? 0) === 0) {
        await client.query("COMMIT");
        return null;
      }

      const job = result.rows[0];

      await client.query(
        `
          UPDATE whatsapp_message_jobs
          SET
            status = 'PROCESSING',
            attempts = attempts + 1,
            error_message = NULL,
            updated_at = NOW()
          WHERE id = $1
        `,
        [job.id]
      );

      await client.query("COMMIT");

      return {
        ...job,
        attempts: Number(job.attempts) + 1,
      };
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
  };

const markJobSent = async (
  jobId: string
): Promise<void> => {
  await pool.query(
    `
      UPDATE whatsapp_message_jobs
      SET
        status = 'SENT',
        error_message = NULL,
        updated_at = NOW()
      WHERE id = $1
    `,
    [jobId]
  );
};

const markJobFailed = async (
  job: WhatsAppJob,
  errorMessage: string
): Promise<void> => {
  const nextStatus =
    job.attempts >= MAX_ATTEMPTS
      ? "FAILED"
      : "PENDING";

  await pool.query(
    `
      UPDATE whatsapp_message_jobs
      SET
        status = $1,
        error_message = $2,
        updated_at = NOW()
      WHERE id = $3
    `,
    [nextStatus, errorMessage, job.id]
  );
};

const extractErrorMessage = (error: any): string => {
  const metaError = error?.response?.data?.error;

  if (metaError) {
    const details =
      metaError.error_data?.details ||
      metaError.message ||
      "WhatsApp send failed";

    return `${metaError.code || "UNKNOWN"} - ${details}`;
  }

  if (error instanceof Error) {
    return error.message;
  }

  return "Unknown WhatsApp worker error";
};

const processWhatsAppJob = async (): Promise<void> => {
  let job: WhatsAppJob | null = null;

  try {
    if (
      !WHATSAPP_ACCESS_TOKEN ||
      !WHATSAPP_PHONE_NUMBER_ID
    ) {
      console.error(
        "WhatsApp credentials are missing in .env"
      );
      return;
    }

    job = await getNextPendingJob();

    if (!job) {
      return;
    }

    const destination = normalizePhoneNumber(
      job.phone_number
    );

    if (!destination) {
      throw new Error(
        "Participant phone number is empty or invalid"
      );
    }

    const call = await getResearchCall(
      job.research_call_id
    );

    let message: string;

    if (job.event_type === "RESEARCH_CALL_ERRATA") {
      if (!job.original_call_id) {
        throw new Error(
          "Original call ID is missing for Errata job"
        );
      }

      const originalCall = await getResearchCall(
        job.original_call_id
      );

      message = buildErrataMessage(
        call,
        originalCall
      );
    } else {
      message = buildPublishedMessage(call);
    }

    console.log("WHATSAPP SEND ATTEMPT:", {
      jobId: job.id,
      eventType: job.event_type,
      rawPhoneNumber: job.phone_number,
      destination,
      phoneNumberId: WHATSAPP_PHONE_NUMBER_ID,
      tokenAvailable: Boolean(
        WHATSAPP_ACCESS_TOKEN
      ),
      tokenLength:
        WHATSAPP_ACCESS_TOKEN.length,
    });

    const response =
      await axios.post<WhatsAppSendResponse>(
        `https://graph.facebook.com/v23.0/${WHATSAPP_PHONE_NUMBER_ID}/messages`,
        {
          messaging_product: "whatsapp",
          recipient_type: "individual",
          to: destination,
          type: "text",
          text: {
            preview_url: false,
            body: message,
          },
        },
        {
          headers: {
            Authorization: `Bearer ${WHATSAPP_ACCESS_TOKEN}`,
            "Content-Type": "application/json",
          },
          timeout: 20000,
        }
      );

    const providerMessageId =
      response.data.messages?.[0]?.id || null;

    await markJobSent(job.id);

    console.log("✅ WHATSAPP JOB SENT:", {
      jobId: job.id,
      destination,
      providerMessageId,
    });
  } catch (error: any) {
    const errorMessage =
      extractErrorMessage(error);

    console.error(
      "WHATSAPP WORKER ERROR:",
      error?.response?.data || errorMessage
    );

    if (job) {
      try {
        await markJobFailed(job, errorMessage);

        console.log(
          "WHATSAPP JOB UPDATED:",
          {
            jobId: job.id,
            attempts: job.attempts,
            nextStatus:
              job.attempts >= MAX_ATTEMPTS
                ? "FAILED"
                : "PENDING",
            errorMessage,
          }
        );
      } catch (updateError) {
        console.error(
          "FAILED TO UPDATE WHATSAPP JOB:",
          updateError
        );
      }
    }
  }
};

let workerTimer: NodeJS.Timeout | null = null;
let workerRunning = false;

export const startWhatsAppDeliveryWorker =
  (): void => {
    if (workerTimer) {
      console.log(
        "WhatsApp delivery worker already started"
      );
      return;
    }

    console.log(
      "WhatsApp delivery worker started"
    );

    workerTimer = setInterval(async () => {
      if (workerRunning) {
        return;
      }

      workerRunning = true;

      try {
        await processWhatsAppJob();
      } catch (error) {
        console.error(
          "WHATSAPP WORKER INTERVAL ERROR:",
          error
        );
      } finally {
        workerRunning = false;
      }
    }, WORKER_INTERVAL_MS);
  };

export const stopWhatsAppDeliveryWorker =
  (): void => {
    if (workerTimer) {
      clearInterval(workerTimer);
      workerTimer = null;
    }

    workerRunning = false;

    console.log(
      "WhatsApp delivery worker stopped"
    );
  };