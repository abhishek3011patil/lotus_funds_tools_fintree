import type {
  RazorpaySuccessResponse,
  RegistrationPaymentOrderResponse,
} from "./types";

const RAZORPAY_SCRIPT =
  "https://checkout.razorpay.com/v1/checkout.js";

interface RazorpayFailureResponse {
  error?: {
    code?: string;
    description?: string;
    source?: string;
    step?: string;
    reason?: string;
    metadata?: Record<string, unknown>;
  };
}

interface RazorpayInstance {
  open: () => void;
  on: (
    eventName: "payment.failed",
    callback: (response: RazorpayFailureResponse) => void
  ) => void;
}

interface RazorpayOptions {
  key: string;
  order_id: string;
  amount: number;
  currency: string;
  name: string;
  description: string;
  prefill?: {
    email?: string;
    contact?: string;
  };
  handler: (response: RazorpaySuccessResponse) => void;
  modal?: {
    ondismiss?: () => void;
    escape?: boolean;
    confirm_close?: boolean;
  };
  theme?: {
    color?: string;
  };
}

declare global {
  interface Window {
    Razorpay?: new (
      options: RazorpayOptions
    ) => RazorpayInstance;
  }
}

export class RazorpayCheckoutError extends Error {
  kind: "DISMISSED" | "PAYMENT_FAILED" | "LOAD_FAILED";

  constructor(
    message: string,
    kind:
      | "DISMISSED"
      | "PAYMENT_FAILED"
      | "LOAD_FAILED"
  ) {
    super(message);
    this.name = "RazorpayCheckoutError";
    this.kind = kind;
  }
}

export const loadRazorpayCheckout =
  async (): Promise<void> => {
    if (window.Razorpay) {
      return;
    }

    const existingScript =
      document.querySelector<HTMLScriptElement>(
        `script[src="${RAZORPAY_SCRIPT}"]`
      );

    if (existingScript) {
      await new Promise<void>((resolve, reject) => {
        existingScript.addEventListener(
          "load",
          () => resolve(),
          { once: true }
        );
        existingScript.addEventListener(
          "error",
          () =>
            reject(
              new RazorpayCheckoutError(
                "Unable to load Razorpay Checkout.",
                "LOAD_FAILED"
              )
            ),
          { once: true }
        );
      });
      return;
    }

    await new Promise<void>((resolve, reject) => {
      const script = document.createElement("script");
      script.src = RAZORPAY_SCRIPT;
      script.async = true;

      script.onload = () => resolve();
      script.onerror = () =>
        reject(
          new RazorpayCheckoutError(
            "Unable to load Razorpay Checkout.",
            "LOAD_FAILED"
          )
        );

      document.body.appendChild(script);
    });
  };

export const openRazorpayCheckout = async (
  paymentOrder: RegistrationPaymentOrderResponse
): Promise<RazorpaySuccessResponse> => {
  await loadRazorpayCheckout();

  if (!window.Razorpay) {
    throw new RazorpayCheckoutError(
      "Razorpay Checkout is unavailable.",
      "LOAD_FAILED"
    );
  }

  return new Promise<RazorpaySuccessResponse>(
    (resolve, reject) => {
      let settled = false;

      const settleOnce = (
        callback: () => void
      ): void => {
        if (settled) {
          return;
        }

        settled = true;
        callback();
      };

      const instance = new window.Razorpay!({
        key: paymentOrder.checkout.keyId,
        order_id:
          paymentOrder.order.razorpayOrderId,
        amount: paymentOrder.order.amountPaise,
        currency: paymentOrder.order.currency,
        name: paymentOrder.checkout.businessName,
        description:
          paymentOrder.checkout.description,
        prefill: paymentOrder.checkout.prefill,
        handler: (response) =>
          settleOnce(() => resolve(response)),
        modal: {
          escape: true,
          confirm_close: true,
          ondismiss: () =>
            settleOnce(() =>
              reject(
                new RazorpayCheckoutError(
                  "Payment window was closed.",
                  "DISMISSED"
                )
              )
            ),
        },
        theme: {
          color: "#1a73e8",
        },
      });

      instance.on("payment.failed", (response) => {
        const description =
          response.error?.description ||
          "Payment failed. Please try again.";

        settleOnce(() =>
          reject(
            new RazorpayCheckoutError(
              description,
              "PAYMENT_FAILED"
            )
          )
        );
      });

      instance.open();
    }
  );
};
