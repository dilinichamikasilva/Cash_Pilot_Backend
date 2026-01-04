import { Request, Response } from "express";
import { Transaction, TransactionType } from "../models/Transaction";
import mongoose from "mongoose";
import { MonthlyAllocation } from "../models/MonthlyAllocations";



export const getAnalyticsSummary = async (req: Request, res: Response) => {
  try {
    const { months, groupBy, accountId } = req.query;
    const accountObjId = new mongoose.Types.ObjectId(accountId as string);
    
    // Define date range
    const monthsRequested = parseInt(months as string) || 6;
    const startDate = new Date();
    startDate.setMonth(startDate.getMonth() - monthsRequested);

    // 1. Get Expenses from Transactions
    const expenseTrends = await Transaction.aggregate([
      { 
        $match: { 
          accountId: accountObjId, 
          type: "expense", // Ensure this matches your transaction type string
          date: { $gte: startDate } 
        } 
      },
      {
        $group: {
          _id: { year: { $year: "$date" }, month: { $month: "$date" } },
          totalExpenses: { $sum: "$amount" }
        }
      }
    ]);

    // 2. Get Income from MonthlyAllocations
    const incomeTrends = await MonthlyAllocation.aggregate([
      { 
        $match: { 
          accountId: accountObjId, 
          year: { $gte: startDate.getFullYear() } 
        } 
      },
      {
        $group: {
          _id: { year: "$year", month: "$month" },
          totalIncome: { $sum: "$totalAllocated" }
        }
      }
    ]);

    // 3. Merge the data professionally
    // We create a map of all months in the range to avoid "Missing Data" gaps
    const finalTrends = [];
    for (let i = 0; i <= monthsRequested; i++) {
      const d = new Date();
      d.setMonth(d.getMonth() - i);
      const m = d.getMonth() + 1;
      const y = d.getFullYear();

      const exp = expenseTrends.find(e => e._id.month === m && e._id.year === y)?.totalExpenses || 0;
      const inc = incomeTrends.find(i => i._id.month === m && i._id.year === y)?.totalIncome || 0;

      finalTrends.push({
        label: d.toLocaleString('default', { month: 'short' }),
        income: inc,
        expenses: exp,
        net: inc - exp,
        monthIdx: m,
        year: y
      });
    }

    // Sort chronologically
    finalTrends.sort((a, b) => (a.year !== b.year ? a.year - b.year : a.monthIdx - b.monthIdx));

    // 4. Category Distribution (as before)
    const categoryData = await Transaction.aggregate([
        { $match: { accountId: accountObjId, type: "expense", date: { $gte: startDate } } },
        { $lookup: { from: "categories", localField: "categoryId", foreignField: "_id", as: "cat" } },
        { $unwind: "$cat" },
        { $group: { _id: "$cat.name", value: { $sum: "$amount" } } },
        { $project: { name: "$_id", value: 1, _id: 0 } },
        { $sort: { value: -1 } }
    ]);

    res.status(200).json({
      trends: finalTrends,
      categories: categoryData,
      savingsRate: finalTrends[finalTrends.length-1].income > 0 
        ? Math.round((finalTrends[finalTrends.length-1].net / finalTrends[finalTrends.length-1].income) * 100) 
        : 0,
      topExpenseCategory: categoryData[0]?.name || "None",
      totalMonthlySpend: finalTrends.reduce((acc, curr) => acc + curr.expenses, 0)
    });

  } catch (error) {
    res.status(500).json({ message: "Analytics merge error" });
  }
};