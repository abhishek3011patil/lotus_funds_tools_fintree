import { Router } from 'express';
import { createOrder, verifyPayment, activateFreePlan } from '../controllers/payment.controller';
import {
  createRegistrationOrder,
} from "../controllers/registrationPayment.controller";

import {
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
router.post(
  "/registration-verify",
  verifyRegistrationPayment
);

export default router;