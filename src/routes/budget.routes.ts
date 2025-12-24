import { Router } from "express";
import { getCategories, createMonthlyAllocation, getMonthlyAllocation , updateCategorySpending } from "../controller/budget.controller";
import { authMiddleWare } from "../middleware/auth.middleware";

const router = Router();

router.post("/monthly-allocations", authMiddleWare, createMonthlyAllocation);
router.get("/view-monthly-allocations", authMiddleWare, getMonthlyAllocation); 
router.post("/update-spending", authMiddleWare, updateCategorySpending);

export default router;
