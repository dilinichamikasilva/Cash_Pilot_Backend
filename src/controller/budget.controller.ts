import { Request, Response } from "express";
import { AuthRequest } from "../middleware/auth.middleware";
import { Category } from "../models/Category";
import { MonthlyAllocation } from "../models/MonthlyAllocations";
import { AllocationCategory } from "../models/AllocationCategory"
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

    const categories = await AllocationCategory.find({
      monthlyAllocationId: allocation._id,
    }).populate("categoryId");

    return res.json({ allocation, categories });
    
  } catch (err) {
    console.error("getMonthlyAllocation error:", err);
    return res.status(500).json({ message: "Server error" });
  }
};
