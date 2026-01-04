
import { Request, Response } from "express";
import { Transaction } from "../models/Transaction";
import mongoose from "mongoose";
import { MonthlyAllocation } from "../models/MonthlyAllocations";

export const getAnalyticsSummary = async (req: Request, res: Response) => {
  try {
    const { months, accountId } = req.query;
    const accountObjId = new mongoose.Types.ObjectId(accountId as string);
    const monthsRequested = parseInt(months as string) || 6;

    const startDate = new Date();
    startDate.setMonth(startDate.getMonth() - monthsRequested);
    startDate.setHours(0, 0, 0, 0);

    
    const transactions = await Transaction.find({
      accountId: accountObjId,
      date: { $gte: startDate }
    }).lean();

    
    const allocations = await MonthlyAllocation.find({
      accountId: accountObjId,
      $or: [
        { year: { $gt: startDate.getFullYear() } },
        { year: startDate.getFullYear(), month: { $gte: startDate.getMonth() + 1 } }
      ]
    }).lean();

    const trends = [];
    const current = new Date(startDate);
    const endDate = new Date();

    
    while (current <= endDate) {
      const month = current.getMonth();
      const year = current.getFullYear();
      
      const label = current.toLocaleDateString('en-GB', { month: 'short', year: '2-digit' });

      
      const monthlyExpenses = transactions
        .filter(t => {
          const d = new Date(t.date);
          return t.type.toLowerCase() === "expense" && 
                 d.getMonth() === month && 
                 d.getFullYear() === year;
        })
        .reduce((sum, t) => sum + t.amount, 0);

      // Find income allocation for this month
      const income = allocations.find(a => a.month === (month + 1) && a.year === year)?.totalAllocated || 0;

      trends.push({
        label,
        income,
        expenses: monthlyExpenses,
        net: income - monthlyExpenses
      });

      current.setMonth(current.getMonth() + 1);
    }

    // 4. Category Breakdown (Aggregated)
    const categoryData = await Transaction.aggregate([
      { $match: { accountId: accountObjId, date: { $gte: startDate } } },
      { $addFields: { lowerType: { $toLower: "$type" } } },
      { $match: { lowerType: "expense" } },
      { $lookup: { from: "categories", localField: "categoryId", foreignField: "_id", as: "cat" } },
      { $unwind: "$cat" },
      { $group: { _id: "$cat.name", value: { $sum: "$amount" } } },
      { $project: { name: "$_id", value: 1, _id: 0 } },
      { $sort: { value: -1 } }
    ]);

    res.status(200).json({
      trends,
      categories: categoryData,
      totalPeriodSpend: trends.reduce((acc, curr) => acc + curr.expenses, 0),
      topExpenseCategory: categoryData[0]?.name || "None",
      
      savingsRate: trends.length > 0 && trends[trends.length-1].income > 0 
        ? Math.round((trends[trends.length-1].net / trends[trends.length-1].income) * 100) 
        : 0
    });

  } catch (error) {
    console.error("Monthly Analytics Error:", error);
    res.status(500).json({ message: "Server Error" });
  }
};