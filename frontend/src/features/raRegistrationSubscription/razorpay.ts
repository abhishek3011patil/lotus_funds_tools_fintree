import type {
  RazorpaySuccessResponse,
  RegistrationPaymentOrderResponse,
} from "./types";

const RAZORPAY_CHECKOUT_URL =
  "https://checkout.razorpay.com/v1/checkout.js";
const RAZORPAY_SCRIPT_ATTRIBUTE =
  "data-ra-registration-checkout";

type RazorpayCheckoutErrorCode =
  | "SCRIPT_LOAD_FAILED"
  | "PAYMENT_FAILED"
  | "MODAL_DISMISSED"
  | "CHECKOUT_IN_PROGRESS"
  | "CHECKOUT_OPEN_FAILED";

interface RazorpayFailureResponse {
  error?: {
    code?: string;
    description?: string;
    reason?: string;
  };
}

interface RazorpayOptions {
  key: string;
  order_id: string;
  amount: number;
  currency: string;
  name: string;
  description: string;
  prefill: {
    email: string;
    contact: string;
  };
  handler: (response: RazorpaySuccessResponse) => void;
  modal: {
    ondismiss: () => void;
  };
}

interface RazorpayInstance {
  on(
    event: "payment.failed",
    callback: (response: RazorpayFailureResponse) => void
  ): void;
  open(): void;
  close?(): void;
}

interface RazorpayConstructor {
  new (options: RazorpayOptions): RazorpayInstance;
}

interface RazorpayWindow extends Window {
  Razorpay?: RazorpayConstructor;
}

export class RazorpayCheckoutError extends Error {
  readonly code: RazorpayCheckoutErrorCode;
  readonly providerCode?: string;

  constructor(
    message: string,
    code: RazorpayCheckoutErrorCode,
    providerCode?: string
  ) {
    super(message);
    this.name = "RazorpayCheckoutError";
    this.code = code;
    this.providerCode = providerCode;
  }
}

let scriptLoadingPromise:
  | Promise<RazorpayConstructor>
  | null = null;
let checkoutInProgress = false;

const getRazorpayConstructor =
  (): RazorpayConstructor | undefined =>
    (window as RazorpayWindow).Razorpay;

export const loadRazorpayCheckout =
  (): Promise<RazorpayConstructor> => {
    if (
      typeof window === "undefined" ||
      typeof document === "undefined"
    ) {
      return Promise.reject(
        new RazorpayCheckoutError(
          "Razorpay Checkout is unavailable in this environment.",
          "SCRIPT_LOAD_FAILED"
        )
      );
    }

    const loadedConstructor = getRazorpayConstructor();
    if (loadedConstructor) {
      return Promise.resolve(loadedConstructor);
    }

    if (scriptLoadingPromise) {
      return scriptLoadingPromise;
    }

    scriptLoadingPromise =
      new Promise<RazorpayConstructor>(
        (resolve, reject) => {
          const selector = `script[src="${RAZORPAY_CHECKOUT_URL}"]`;
          let script =
            document.querySelector<HTMLScriptElement>(
              selector
            );

          if (
            script?.dataset.raRegistrationCheckout ===
            "failed"
          ) {
            script.remove();
            script = null;
          }

          const resolveLoadedScript = () => {
            const Razorpay = getRazorpayConstructor();

            if (!Razorpay) {
              scriptLoadingPromise = null;
              reject(
                new RazorpayCheckoutError(
                  "Razorpay Checkout loaded without exposing the checkout provider.",
                  "SCRIPT_LOAD_FAILED"
                )
              );
              return;
            }

            if (script) {
              script.dataset.raRegistrationCheckout =
                "loaded";
            }
            resolve(Razorpay);
          };

          const rejectFailedScript = () => {
            if (script) {
              script.dataset.raRegistrationCheckout =
                "failed";
            }
            scriptLoadingPromise = null;
            reject(
              new RazorpayCheckoutError(
                "Razorpay Checkout could not be loaded. Check your connection and try again.",
                "SCRIPT_LOAD_FAILED"
              )
            );
          };

          if (!script) {
            script = document.createElement("script");
            script.src = RAZORPAY_CHECKOUT_URL;
            script.async = true;
            script.setAttribute(
              RAZORPAY_SCRIPT_ATTRIBUTE,
              "true"
            );
            document.head.appendChild(script);
          }

          if (
            script.dataset.raRegistrationCheckout ===
            "loaded"
          ) {
            resolveLoadedScript();
            return;
          }

          script.addEventListener(
            "load",
            resolveLoadedScript,
            { once: true }
          );
          script.addEventListener(
            "error",
            rejectFailedScript,
            { once: true }
          );
        }
      );

    return scriptLoadingPromise;
  };

export const openRARegistrationCheckout = async (
  orderResponse: RegistrationPaymentOrderResponse
): Promise<RazorpaySuccessResponse> => {
  if (checkoutInProgress) {
    throw new RazorpayCheckoutError(
      "A payment checkout is already open.",
      "CHECKOUT_IN_PROGRESS"
    );
  }

  checkoutInProgress = true;

  let Razorpay: RazorpayConstructor;
  try {
    Razorpay = await loadRazorpayCheckout();
  } catch (error) {
    checkoutInProgress = false;

    if (error instanceof RazorpayCheckoutError) {
      throw error;
    }

    throw new RazorpayCheckoutError(
      "Razorpay Checkout could not be loaded.",
      "SCRIPT_LOAD_FAILED"
    );
  }

  return new Promise<RazorpaySuccessResponse>(
    (resolve, reject) => {
      let settled = false;
      let checkout: RazorpayInstance | null = null;

      const resolveOnce = (
        response: RazorpaySuccessResponse
      ) => {
        if (settled) {
          return;
        }

        settled = true;
        checkoutInProgress = false;
        resolve(response);
      };

      const rejectOnce = (
        error: RazorpayCheckoutError
      ) => {
        if (settled) {
          return;
        }

        settled = true;
        checkoutInProgress = false;
        reject(error);
      };

      const options: RazorpayOptions = {
        key: orderResponse.checkout.keyId,
        order_id:
          orderResponse.order.razorpayOrderId,
        amount: orderResponse.order.amountPaise,
        currency: orderResponse.order.currency,
        name: orderResponse.checkout.businessName,
        description:
          orderResponse.checkout.description,
        prefill: {
          email:
            orderResponse.checkout.prefill.email,
          contact:
            orderResponse.checkout.prefill.contact,
        },
        handler: resolveOnce,
        modal: {
          ondismiss: () => {
            rejectOnce(
              new RazorpayCheckoutError(
                "Payment was not completed. Your selected plan has been kept so you can try again.",
                "MODAL_DISMISSED"
              )
            );
          },
        },
      };

      try {
        checkout = new Razorpay(options);
        checkout.on(
          "payment.failed",
          (response) => {
            const message =
              response.error?.description?.trim() ||
              response.error?.reason?.trim() ||
              "Payment failed. Please try again.";

            rejectOnce(
              new RazorpayCheckoutError(
                message,
                "PAYMENT_FAILED",
                response.error?.code
              )
            );
            checkout?.close?.();
          }
        );
        checkout.open();
      } catch {
        checkout?.close?.();
        rejectOnce(
          new RazorpayCheckoutError(
            "Razorpay Checkout could not be opened. Please try again.",
            "CHECKOUT_OPEN_FAILED"
          )
        );
      }
    }
  );
};
