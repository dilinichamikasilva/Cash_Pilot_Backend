import { Request, Response } from "express";
import { Transaction } from "../models/Transaction";
import mongoose from "mongoose";
import { MonthlyAllocation } from "../models/MonthlyAllocations";

export const getAnalyticsSummary = async (req: Request, res: Response) => {
  try {
    const { months, groupBy, accountId } = req.query;
    const accountObjId = new mongoose.Types.ObjectId(accountId as string);
    const interval = (groupBy as string) || "month";
    const monthsRequested = parseInt(months as string) || 6;

    const startDate = new Date();
    startDate.setMonth(startDate.getMonth() - monthsRequested);
    startDate.setHours(0, 0, 0, 0);
    const endDate = new Date();

    // 1. Fetch Expenses and force 'type' check
    const transactions = await Transaction.find({
      accountId: accountObjId,
      date: { $gte: startDate, $lte: endDate }
    }).lean();

    // 2. Fetch Income Allocations
    const allocations = await MonthlyAllocation.find({
      accountId: accountObjId,
      $or: [
        { year: { $gt: startDate.getFullYear() } },
        { year: startDate.getFullYear(), month: { $gte: startDate.getMonth() + 1 } }
      ]
    }).lean();

    const trends = [];
    let current = new Date(startDate);

    while (current <= endDate) {
      const d = new Date(current);
      let label = "";
      let periodExpenses = 0;

      // Grouping Logic
      if (interval === "day") {
        label = d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' });
        periodExpenses = transactions
          .filter(t => t.type.toLowerCase() === "expense" && 
                  new Date(t.date).toDateString() === d.toDateString())
          .reduce((sum, t) => sum + t.amount, 0);
        current.setDate(current.getDate() + 1);
      } 
      else if (interval === "week") {
        const weekNum = Math.ceil(d.getDate() / 7);
        label = `W${weekNum} ${d.toLocaleDateString('en-GB', { month: 'short' })}`;
        
        // Match transactions in the same 7-day window
        const weekEnd = new Date(d);
        weekEnd.setDate(d.getDate() + 7);
        
        periodExpenses = transactions
          .filter(t => {
            const tDate = new Date(t.date);
            return t.type.toLowerCase() === "expense" && tDate >= d && tDate < weekEnd;
          })
          .reduce((sum, t) => sum + t.amount, 0);
        current.setDate(current.getDate() + 7);
      } 
      else {
        label = d.toLocaleDateString('en-GB', { month: 'short' });
        periodExpenses = transactions
          .filter(t => {
            const tDate = new Date(t.date);
            return t.type.toLowerCase() === "expense" && 
                   tDate.getMonth() === d.getMonth() && 
                   tDate.getFullYear() === d.getFullYear();
          })
          .reduce((sum, t) => sum + t.amount, 0);
        current.setMonth(current.getMonth() + 1);
      }

      // Income Distribution
      const mAllocation = allocations.find(a => 
        a.month === (d.getMonth() + 1) && a.year === d.getFullYear()
      )?.totalAllocated || 0;

      let adjustedIncome = mAllocation;
      if (interval === "day") adjustedIncome = mAllocation / 30;
      if (interval === "week") adjustedIncome = mAllocation / 4;

      trends.push({
        label,
        income: Math.round(adjustedIncome),
        expenses: periodExpenses,
        net: Math.round(adjustedIncome) - periodExpenses
      });
    }

    // 3. Category Distribution
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
      savingsRate: trends.length > 0 && trends[trends.length-1].income > 0 
        ? Math.round((trends[trends.length-1].net / trends[trends.length-1].income) * 100) 
        : 0,
      topExpenseCategory: categoryData[0]?.name || "None",
      totalPeriodSpend: transactions.filter(t => t.type.toLowerCase() === "expense").reduce((acc, curr) => acc + curr.amount, 0)
    });

  } catch (error) {
    console.error("Analytics Error:", error);
    res.status(500).json({ message: "Server Error" });
  }
};