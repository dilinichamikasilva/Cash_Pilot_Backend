import { Request, Response } from "express";
import { AuthRequest } from "../middleware/auth.middleware"
import { Category } from "../models/Category"
import { MonthlyAllocation } from "../models/MonthlyAllocations"
import { AllocationCategory } from "../models/AllocationCategory"
import { OverSpendingAlert } from "../models/OverSpendingAlerts"
import mongoose from "mongoose";

export const getCategories = async (req: Request, res: Response) => {
  try {
    const accountId = req.query.accountId as string;
    if (!accountId)
      return res.status(400).json({ message: "accountId required" });

    
    const distinctNames = await Category.distinct("name", {
      accountId: new mongoose.Types.ObjectId(accountId),
    });

    return res.json({ categories: distinctNames });

  } catch (err) {
    console.error("getCategories error:", err);
    return res.status(500).json({ message: "Server error" });
  }
};



export const createMonthlyAllocation = async (req: AuthRequest, res: Response) => {
  try {
    const { month, year, totalAllocated, categories } = req.body;
    const userId = req.user.userId;
    const accountId = req.user.accountId || req.body.accountId;

    if (!month || !year)
      return res.status(400).json({ message: "month and year required" });

    if (!Array.isArray(categories)) 
      return res.status(400).json({ message: "categories must be an array" });

    const sum = categories.reduce((s: number, c: any) => s + Number(c.budget || 0), 0);
    if (sum > totalAllocated) {
      return res.status(400).json({ message: "Allocated sum exceeds income" });
    }

    // --- STEP 1: FIND OR CREATE THE MONTHLY ALLOCATION ---
    // Using findOneAndUpdate with upsert: true handles the "Add or Update" logic
    const allocation = await MonthlyAllocation.findOneAndUpdate(
      { accountId, month: Number(month), year: Number(year) },
      { 
        userId, 
        totalAllocated, 
        remainingBalance: totalAllocated - sum 
      },
      { new: true, upsert: true }
    );

    // --- STEP 2: MANAGE CATEGORIES ---
    const currentAllocationEntries = [];

    for (const c of categories) {
      // Find or create the base Category (e.g., "Food")
      let cat = await Category.findOne({ accountId, name: c.name });
      if (!cat) {
        cat = await Category.create({ accountId, name: c.name });
      }

      // --- STEP 3: UPDATE INDIVIDUAL ALLOCATION CATEGORIES ---
      // We use findOneAndUpdate here so we don't reset 'spent' to 0 
      // if the category already existed.
      await AllocationCategory.findOneAndUpdate(
        { monthlyAllocationId: allocation._id, categoryId: cat._id },
        { 
          $set: { budget: Number(c.budget) },
          // If it's a new category, set spent to 0. If it exists, leave spent as is.
          $setOnInsert: { spent: 0 } 
        },
        { upsert: true }
      );

      currentAllocationEntries.push(cat._id);
    }

    // --- STEP 4: CLEANUP (Optional) ---
    // If a user REMOVES a category in the frontend, delete it from the DB
    await AllocationCategory.deleteMany({
      monthlyAllocationId: allocation._id,
      categoryId: { $nin: currentAllocationEntries }
    });

    // Fetch the final list to return to frontend
    const updatedCategories = await AllocationCategory.find({ 
      monthlyAllocationId: allocation._id 
    }).populate("categoryId");

    return res.status(200).json({
      message: "Monthly allocation synced successfully",
      allocation,
      categories: updatedCategories,
    });

  } catch (err) {
    console.error("createMonthlyAllocation error:", err);
    return res.status(500).json({ message: "Server error" });
  }
};


export const getMonthlyAllocation = async (req: Request, res: Response) => {
  try {
    const { accountId, month, year } = req.query;
    
    if (!accountId || !month || !year)
      return res.status(400).json({ message: "accountId, month and year required" });

    const allocation = await MonthlyAllocation.findOne({
      accountId,
      month: Number(month),
      year: Number(year),
    }).lean();

    if (!allocation)
      return res.status(404).json({ message: "Not found" });

    const allocationCategories = await AllocationCategory.find({
      monthlyAllocationId: allocation._id,
    })
    .populate("categoryId")
    .lean() as any[];

    const categories = allocationCategories.map((item) => ({
      id: item._id,
      name: item.categoryId.name,
      budget: item.budget,
      spent: item.spent,
    }));

    // --- THE FIX IS HERE ---
    // 1. Sum of what you PLANNED to spend
    const allocatedSum = categories.reduce((sum, c) => sum + c.budget, 0); 
    // 2. Sum of what you ACTUALLY spent
    const totalSpentSoFar = categories.reduce((sum, c) => sum + c.spent, 0); 
    // 3. Remaining is Income minus Actual Spending (This updates when you delete transactions!)
    const remaining = allocation.totalAllocated - totalSpentSoFar; 

    return res.json({
      allocation,
      categories,
      totals: { 
        allocatedSum, 
        actualSpent: totalSpentSoFar, 
        remaining 
      },
    });

  } catch (err) {
    console.error("getMonthlyAllocation error:", err);
    return res.status(500).json({ message: "Server error" });
  }
};

export const updateCategorySpending = async (req: AuthRequest, res: Response) => {
  try {
    const { allocationCategoryId, actualAmount } = req.body;
    const userId = req.user.userId;
    const accountId = req.user.accountId;

    if (!allocationCategoryId || actualAmount === undefined) {
      return res.status(400).json({ message: "Allocation Category ID and Actual Amount are required" });
    }

   
    const allocCat = await AllocationCategory.findById(allocationCategoryId).populate({
        path: 'monthlyAllocationId',
        select: 'userId accountId totalAllocated'
    });

    if (!allocCat) {
      return res.status(404).json({ message: "Budget category allocation not found" });
    }

    
    allocCat.spent = Number(actualAmount);
    await allocCat.save();

    
    const isOverspent = allocCat.spent > allocCat.budget;
    const difference = allocCat.budget - allocCat.spent; 

    let alertGenerated = false;
    if (isOverspent) {
      
      await OverSpendingAlert.create({
        userId,
        accountId,
        monthlyAllocationId: allocCat.monthlyAllocationId,
        categoryId: allocCat.categoryId,
        allocatedAmount: allocCat.budget,
        spentAmount: allocCat.spent,
        overamount: allocCat.spent - allocCat.budget,
        msg: `Warning: You have exceeded your budget for this category by Rs. ${allocCat.spent - allocCat.budget}`,
        alertDate: new Date()
      });
      alertGenerated = true;
    }

    return res.status(200).json({
      message: "Actual expense updated successfully",
      data: {
        categoryName: (allocCat as any).categoryId?.name, 
        budget: allocCat.budget,
        actualSpent: allocCat.spent,
        difference: difference,
        status: isOverspent ? "OVERSPENT" : "WITHIN_BUDGET",
        alertGenerated
      }
    });

  } catch (err) {
    console.error("updateCategorySpending error:", err);
    return res.status(500).json({ message: "Server error while updating spending" });
  }
};

