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

export const getTransactionsByCategory = async (req: AuthRequest | any, res: Response) => {
  try {
    const { allocationCategoryId } = req.params;

    
    const allocCat = await AllocationCategory.findById(allocationCategoryId);
    if (!allocCat) return res.status(404).json({ message: "Category not found" });

  
    const transactions = await Transaction.find({
      userId: req.user.userId,
      categoryId: allocCat.categoryId
    }).sort({ date: -1 }); 

    res.status(200).json({ success: true, transactions });
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch transactions" });
  }
};