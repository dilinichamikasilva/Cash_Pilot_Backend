import express from "express";
import { getAnalyticsSummary } from "../controller/analytics.controller";
// import { protect } from "../middleware/auth.middleware"; // If you have auth

const router = express.Router();

// This matches /api/v1/analytics/summary
router.get("/summary", getAnalyticsSummary);

export default router;