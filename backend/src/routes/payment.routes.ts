import { Router } from 'express';
import { createOrder, verifyPayment, activateFreePlan } from '../controllers/payment.controller';
import {
  createRegistrationOrder,
  getRegistrationPaymentStatus,
} from "../controllers/registrationPayment.controller";

import {
  reconcileFailedRegistrationPayment,
  verifyRegistrationPayment,
} from "../controllers/registrationPaymentVerification.controller";


const router = Router();

// Endpoint: POST /api/payments/create-order
router.post('/create-order', createOrder);

// Endpoint: POST /api/payments/verify
router.post('/verify', verifyPayment);

router.post('/activate-free-plan', activateFreePlan);


router.post(
  "/registration-order",
  createRegistrationOrder
);
router.get(
  "/registration-status/:applicationId",
  getRegistrationPaymentStatus
);
router.post(
  "/registration-verify",
  verifyRegistrationPayment
);
router.post(
  "/registration-failure",
  reconcileFailedRegistrationPayment
);

export default router;
