import express from "express";
import { upload } from "../config/cloudinary";
import { createTransaction, getTransactionsByCategory , deleteTransaction } from "../controller/transaction.controller";
import { authMiddleWare } from "../middleware/auth.middleware";

const router = express.Router();


router.post("/add-expense", authMiddleWare, upload.single("billImage"), createTransaction);
router.get("/history/:allocationCategoryId", authMiddleWare, getTransactionsByCategory);
router.delete("/delete/:id", authMiddleWare, deleteTransaction);

export default router;