import { Router } from "express";
import { getCategories, createMonthlyAllocation, getMonthlyAllocation } from "../controller/budget.controller";
import { authMiddleWare } from "../middleware/auth.middleware";

const router = Router();

router.post("/monthly-allocations", authMiddleWare, createMonthlyAllocation);
router.get("/monthly-allocations", authMiddleWare, getMonthlyAllocation); 

export default router;
