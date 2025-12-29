import express from "express";
import { upload } from "../config/cloudinary";
import { createTransaction } from "../controller/transaction.controller";
import { authMiddleWare } from "../middleware/auth.middleware";

const router = express.Router();


router.post("/add-expense", authMiddleWare, upload.single("billImage"), createTransaction);

export default router;