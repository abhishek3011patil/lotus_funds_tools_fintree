import { Router } from 'express';
import { createOrder, verifyPayment, activateFreePlan } from '../controllers/payment.controller';

const router = Router();

// Endpoint: POST /api/payments/create-order
router.post('/create-order', createOrder);

// Endpoint: POST /api/payments/verify
router.post('/verify', verifyPayment);

router.post('/activate-free-plan', activateFreePlan);

export default router;