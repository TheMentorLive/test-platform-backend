import { getTestHistory, getPaymentHistory, latestTestScore } from "../controllers/userstats.controller.js";
import { Router } from "express";
import { authenticateUser } from "../middleware/auth.middleware.js";


const router = Router();

router.get("/payment-history", authenticateUser, getPaymentHistory);
router.get("/test-history", authenticateUser, getTestHistory);
router.get("/latest-test", authenticateUser, latestTestScore);

export default router;