import { Response } from "express";
import { AuthRequest } from "../middleware/auth.middleware";
import { Transaction, PaymentMethod, TransactionType } from "../models/Transaction";
import { AllocationCategory } from "../models/AllocationCategory";
import { OverSpendingAlert } from "../models/OverSpendingAlerts";

export const createTransaction = async (req: AuthRequest | any , res: Response) => {
  try {
    const { allocationCategoryId, amount, description, paymentMethod, date } = req.body;
    const userId = req.user.userId;
    const accountId = req.user.accountId;

    // req.file.path now contains the secure https URL from Cloudinary
    const billImage = req.file ? req.file.path : undefined; 

    const allocCat = await AllocationCategory.findById(allocationCategoryId);
    if (!allocCat) return res.status(404).json({ message: "Category not found" });

    const newTransaction = await Transaction.create({
      userId,
      accountId,
      categoryId: allocCat.categoryId,
      type: "EXPENSE",
      amount: Number(amount),
      description,
      paymentMethod,
      billImage, 
      date: date || new Date(),
    });

 
    allocCat.spent += Number(amount);
    await allocCat.save();

    res.status(201).json({ success: true, transaction: newTransaction });
  } catch (err) {
    res.status(500).json({ message: "Upload failed" });
  }
};