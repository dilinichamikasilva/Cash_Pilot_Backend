import express from "express";
import { getAnalyticsSummary } from "../controller/analytics.controller";

const router = express.Router();

router.get("/summary", getAnalyticsSummary);

export default router;