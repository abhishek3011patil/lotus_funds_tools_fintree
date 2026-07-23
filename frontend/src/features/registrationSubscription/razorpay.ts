type RazorpayOrderResponse = {
  order: {
    razorpayOrderId: string;
    amountPaise: number;
    currency: string;
  };

  checkout: {
    keyId: string;
    businessName: string;
    description: string;

    prefill: {
      email: string;
      contact: string;
    };
  };
};

type RazorpayPaymentResponse = {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
};

export const openRazorpayCheckout = (
  orderResponse: RazorpayOrderResponse,
  applicationId: string,
  registrationToken: string
) => {
  if (!window.Razorpay) {
    alert(
      "Razorpay Checkout has not loaded. Please refresh the page."
    );
    return;
  }

  const options = {
    key: orderResponse.checkout.keyId,

    order_id:
      orderResponse.order.razorpayOrderId,

    amount:
      orderResponse.order.amountPaise,

    currency:
      orderResponse.order.currency,

    name:
      orderResponse.checkout.businessName,

    description:
      orderResponse.checkout.description,

    prefill: {
      email:
        orderResponse.checkout.prefill.email,

      contact:
        orderResponse.checkout.prefill.contact,
    },

    handler: async (
      paymentResponse: RazorpayPaymentResponse
    ) => {
      try {
        const verifyResponse = await fetch(
          `${import.meta.env.VITE_API_URL}/api/payments/registration-verify`,
          {
            method: "POST",

            headers: {
              "Content-Type":
                "application/json",

              "x-registration-token":
                registrationToken,
            },

            body: JSON.stringify({
              applicationId,

              razorpayOrderId:
                paymentResponse.razorpay_order_id,

              razorpayPaymentId:
                paymentResponse.razorpay_payment_id,

              razorpaySignature:
                paymentResponse.razorpay_signature,
            }),
          }
        );

        const result =
          await verifyResponse.json();

        if (!verifyResponse.ok) {
          throw new Error(
            result.message ||
              "Payment verification failed."
          );
        }

        sessionStorage.setItem(
          "registration_payment_status",
          "PAID_PENDING_APPROVAL"
        );

        window.location.href =
          "/registration/under-review";
      } catch (error) {
        console.error(
          "Payment verification error:",
          error
        );

        alert(
          error instanceof Error
            ? error.message
            : "Payment verification failed."
        );
      }
    },

    modal: {
      ondismiss: () => {
        console.log(
          "Razorpay Checkout closed."
        );
      },
    },
  };

  const razorpay =
    new window.Razorpay(options);

  razorpay.on(
    "payment.failed",
    (response: any) => {
      console.error(
        "Razorpay payment failed:",
        response.error
      );

      alert(
        response.error?.description ||
          "Payment failed."
      );
    }
  );

  razorpay.open();
};