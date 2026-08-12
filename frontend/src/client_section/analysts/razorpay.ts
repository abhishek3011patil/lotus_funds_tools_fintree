import type {
  AnalystOrderResponse,
  RazorpayPaymentResult,
} from "./types";

interface RazorpayFailure {
  error?: { description?: string };
}

interface RazorpayInstance {
  open: () => void;
  on: (
    event: "payment.failed",
    handler: (response: RazorpayFailure) => void
  ) => void;
}

type RazorpayConstructor = new (options: Record<string, unknown>) => RazorpayInstance;

const checkoutScriptUrl = "https://checkout.razorpay.com/v1/checkout.js";

const getRazorpay = () =>
  (window as unknown as { Razorpay?: RazorpayConstructor }).Razorpay;

const loadCheckout = async () => {
  const existing = getRazorpay();
  if (existing) return existing;

  await new Promise<void>((resolve, reject) => {
    const script = document.createElement("script");
    script.src = checkoutScriptUrl;
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("Unable to load Razorpay Checkout."));
    document.head.appendChild(script);
  });

  const loaded = getRazorpay();
  if (!loaded) throw new Error("Razorpay Checkout is unavailable.");
  return loaded;
};

export const openAnalystCheckout = async (
  orderResponse: AnalystOrderResponse
): Promise<RazorpayPaymentResult> => {
  const Razorpay = await loadCheckout();

  return new Promise((resolve, reject) => {
    let completed = false;
    const checkout = new Razorpay({
      key: orderResponse.checkout.keyId,
      order_id: orderResponse.order.razorpayOrderId,
      amount: orderResponse.order.amountPaise,
      currency: orderResponse.order.currency,
      name: orderResponse.checkout.businessName,
      description: orderResponse.checkout.description,
      prefill: orderResponse.checkout.prefill,
      theme: { color: "#5271FF" },
      handler: (payment: RazorpayPaymentResult) => {
        completed = true;
        resolve(payment);
      },
      modal: {
        ondismiss: () => {
          if (!completed) reject(new Error("Razorpay Checkout was closed."));
        },
      },
    });

    checkout.on("payment.failed", (response) => {
      completed = true;
      reject(
        new Error(response.error?.description || "Razorpay payment failed.")
      );
    });

    checkout.open();
  });
};
