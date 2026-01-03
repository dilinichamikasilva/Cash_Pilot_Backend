import { Router } from "express";
import { getCategories, createMonthlyAllocation, getMonthlyAllocation , updateCategorySpending, checkFirstMonth } from "../controller/budget.controller";
import { authMiddleWare } from "../middleware/auth.middleware";
import { getAISuggestions } from "../controller/ai.controller";

const router = Router();

router.post("/monthly-allocations", authMiddleWare, createMonthlyAllocation);
router.get("/view-monthly-allocations", authMiddleWare, getMonthlyAllocation); 
router.post("/update-spending", authMiddleWare, updateCategorySpending);
router.get("/ai-suggestions", authMiddleWare, getAISuggestions);
router.get("/is-first-month", authMiddleWare, checkFirstMonth);

export default router;
