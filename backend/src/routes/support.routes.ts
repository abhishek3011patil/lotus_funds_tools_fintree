
import { Router } from "express";

import {
  createSupportRequest,
  getMySupportRequests,
} from "../controllers/support.controller";

import { authenticate } from "../middlewares/auth.middleware";
import { upload } from "../middlewares/upload";

const router = Router();

// All support routes require authentication
router.use(authenticate);

// RA, Broker and Client - Submit a support request with optional attachment
router.post("/", upload.single("attachment"), createSupportRequest);

// RA, Broker and Client - View only their own support requests
router.get("/my-requests", getMySupportRequests);

export default router;
