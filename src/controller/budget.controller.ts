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

    //create monthly allocations
    const allocation = await MonthlyAllocation.create({
      userId,
      accountId,
      month,
      year,
      carryForwardSavings: 0,
      totalAllocated,
      remainingBalance: totalAllocated - sum,
    });

    const allocationEntries = [];

    for (const c of categories) {
      
      let cat = await Category.findOne({ accountId, name: c.name });

      if (!cat) {
        cat = await Category.create({
          accountId,
          name: c.name,
        });
      }

      allocationEntries.push({
        monthlyAllocationId: allocation._id,
        categoryId: cat._id,
        budget: Number(c.budget),
        spent: 0,
      });
    }

    const createdAllocationCategories = await AllocationCategory.insertMany(allocationEntries);

    return res.status(201).json({
      message: "Monthly allocation created",
      allocation,
      categories: createdAllocationCategories,
    });

  } catch (err) {
    console.error("createMonthlyAllocation error:", err);
    return res.status(500).json({ message: "Server error" });
  }
};

// export const getMonthlyAllocation = async (req: Request, res: Response) => {
//   try {
//     const { accountId, month, year } = req.query;
    
//     if (!accountId || !month || !year)
//       return res.status(400).json({ message: "accountId, month and year required" });

//     const allocation = await MonthlyAllocation.findOne({
//       accountId,
//       month: Number(month),
//       year: Number(year),
//     }).lean();

//     if (!allocation)
//       return res.status(404).json({ message: "Not found" });

//     const allocationCategories = await AllocationCategory.find({
//       monthlyAllocationId: allocation._id,
//     })
//     .populate("categoryId")
//     .lean() as any[];  // ← IMPORTANT FIX

//     const categories = allocationCategories.map((item) => ({
//       id: item._id,
//       name: item.categoryId.name, // ← no error now
//       budget: item.budget,
//       spent: item.spent,
//     }));

//     const allocatedSum = categories.reduce((sum, c) => sum + c.budget, 0);
//     const remaining = allocation.totalAllocated - allocatedSum;

//     return res.json({
//       allocation,
//       categories,
//       totals: { allocatedSum, remaining },
//     });

//   } catch (err) {
//     console.error("getMonthlyAllocation error:", err);
//     return res.status(500).json({ message: "Server error" });
//   }
// };

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

