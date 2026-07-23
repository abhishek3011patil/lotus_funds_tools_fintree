import "./config/env";
import app from "./app";
import { startWhatsAppDeliveryWorker } from "./services/deliveryQueue.worker";
import {
  startSubscriptionExpiryWorker,
} from "./services/subscriptionExpiry.worker";

const PORT = process.env.PORT || 3000;
console.log("🔥 SERVER START FILE RUNNING");

const server = app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
     startWhatsAppDeliveryWorker();
     startSubscriptionExpiryWorker();
});

// 🔥 THIS PREVENTS CLEAN EXIT
setInterval(() => {
  // keep event loop alive
}, 1000);