import {
  expireDueSubscriptions,
} from "./subscriptionAccess.service";

let timer:
  | NodeJS.Timeout
  | undefined;

const getIntervalMilliseconds =
  (): number => {
    const minutes = Number(
      process.env
        .SUBSCRIPTION_EXPIRY_INTERVAL_MINUTES ||
        15
    );

    if (
      !Number.isFinite(minutes) ||
      minutes < 1
    ) {
      return 15 * 60 * 1000;
    }

    return Math.min(
      Math.floor(minutes),
      1440
    ) * 60 * 1000;
  };

const runExpiryPass =
  async (): Promise<void> => {
    try {
      let expired = 0;

      do {
        expired =
          await expireDueSubscriptions({
            batchSize: 500,
          });

        if (expired > 0) {
          console.log(
            `Expired ${expired} subscription(s).`
          );
        }
      } while (expired === 500);
    } catch (error) {
      console.error(
        "SUBSCRIPTION EXPIRY WORKER ERROR:",
        error
      );
    }
  };

export const startSubscriptionExpiryWorker =
  (): void => {
    if (timer) {
      return;
    }

    if (
      process.env
        .ENABLE_SUBSCRIPTION_EXPIRY_WORKER !==
      "true"
    ) {
      console.log(
        "Subscription expiry worker disabled."
      );
      return;
    }

    void runExpiryPass();

    timer = setInterval(
      () => {
        void runExpiryPass();
      },
      getIntervalMilliseconds()
    );

    timer.unref?.();

    console.log(
      "Subscription expiry worker started."
    );
  };

export const stopSubscriptionExpiryWorker =
  (): void => {
    if (!timer) {
      return;
    }

    clearInterval(timer);
    timer = undefined;
  };
