import { Router } from "express";
import { createCategory } from "../controller/category.controller";
import { getCategories } from "../controller/budget.controller"
import { authMiddleWare } from "../middleware/auth.middleware";

const router = Router();

router.post("/saveCategory", authMiddleWare, createCategory);
router.get("/getCategories", authMiddleWare, getCategories);            


export default router;
