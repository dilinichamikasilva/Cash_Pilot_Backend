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
    const { month, year, categories } = req.body;
    const userEnteredIncome = Number(req.body.income || 0);
    const { userId, accountId } = req.user;

    
    let carryForward = 0;
    const prevDate = new Date(year, month - 2); 
    const prevM = prevDate.getMonth() + 1;
    const prevY = prevDate.getFullYear();

    const previousAllocation = await MonthlyAllocation.findOne({ accountId, month: prevM, year: prevY });

    if (previousAllocation) {
      
      const prevCats = await AllocationCategory.find({ monthlyAllocationId: previousAllocation._id });
      const totalSpentPrev = prevCats.reduce((sum, c) => sum + (c.spent || 0), 0);
      
     
      carryForward = previousAllocation.totalAllocated - totalSpentPrev;
    } else {
      
      const account = await mongoose.model("Account").findById(accountId);
      carryForward = account?.openingBalance || 0;
    }

    
    const totalPool = carryForward + userEnteredIncome;

   
    const allocation = await MonthlyAllocation.findOneAndUpdate(
      { accountId, month: Number(month), year: Number(year) },
      { 
        userId, 
        totalAllocated: totalPool, 
        carryForwardSavings: carryForward,
       
      },
      { new: true, upsert: true }
    );

   
    const categoryOps = await Promise.all(categories.map(async (c: any) => {
      let cat = await Category.findOne({ accountId, name: c.name });
      if (!cat) cat = await Category.create({ accountId, name: c.name });
      return { categoryId: cat._id, budget: Number(c.budget) };
    }));

    const bulkOps = categoryOps.map(op => ({
      updateOne: {
        filter: { monthlyAllocationId: allocation._id, categoryId: op.categoryId },
        update: { 
          $set: { budget: op.budget },
          $setOnInsert: { spent: 0 } 
        },
        upsert: true
      }
    }));

    if (bulkOps.length > 0) await AllocationCategory.bulkWrite(bulkOps);

    //  CLEANUP & FINAL RESPONSE
    const activeIds = categoryOps.map(op => op.categoryId);
    await AllocationCategory.deleteMany({ monthlyAllocationId: allocation._id, categoryId: { $nin: activeIds } });

    return res.status(200).json({ message: "Budget Sync Complete", allocation });

  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Server Error" });
  }
};


export const checkFirstMonth = async (req: Request, res: Response) => {
  try {
    const { accountId, month, year } = req.query;

    // Find the earliest budget record for this account
    const earliestBudget = await MonthlyAllocation.findOne({ accountId })
      .sort({ year: 1, month: 1 })
      .lean();

    // If no budgets exist yet, the current one being planned is effectively the first
    if (!earliestBudget) {
      return res.json({ isFirstMonth: true });
    }

    // Check if the requested month/year matches the earliest record
    const isFirst = earliestBudget.month === Number(month) && earliestBudget.year === Number(year);

    return res.json({ isFirstMonth: isFirst });
  } catch (err) {
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

    
    const allocatedSum = categories.reduce((sum, c) => sum + c.budget, 0); 
    const totalSpentSoFar = categories.reduce((sum, c) => sum + c.spent, 0); 
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