import { Request, Response } from "express";
import { Transaction, TransactionType } from "../models/Transaction";
import mongoose from "mongoose";

export const getAnalyticsSummary = async (req: Request, res: Response) => {
  try {
    const monthsRequested = parseInt(req.query.months as string) || 6;
    const startDate = new Date();
    startDate.setMonth(startDate.getMonth() - monthsRequested);

    // 1. Aggregate Spending by Category (with Name Lookup)
    const categoryData = await Transaction.aggregate([
      { 
        $match: { 
          date: { $gte: startDate }, 
          type: TransactionType.EXPENSE // Matches "EXPENSE"
        } 
      },
      {
        $lookup: {
          from: "categories", // Ensure this matches your MongoDB collection name for Categories
          localField: "categoryId",
          foreignField: "_id",
          as: "categoryDetails"
        }
      },
      { $unwind: "$categoryDetails" },
      { 
        $group: { 
          _id: "$categoryDetails.name", 
          value: { $sum: "$amount" } 
        } 
      },
      { $project: { name: "$_id", value: 1, _id: 0 } },
      { $sort: { value: -1 } }
    ]);

    // 2. Aggregate Trends (Income vs Expenses)
    const trends = await Transaction.aggregate([
      { $match: { date: { $gte: startDate } } },
      {
        $group: {
          _id: { 
            month: { $month: "$date" }, 
            year: { $year: "$date" } 
          },
          income: { 
            $sum: { $cond: [{ $eq: ["$type", TransactionType.INCOME] }, "$amount", 0] } 
          },
          expenses: { 
            $sum: { $cond: [{ $eq: ["$type", TransactionType.EXPENSE] }, "$amount", 0] } 
          }
        }
      },
      { $sort: { "_id.year": 1, "_id.month": 1 } },
      {
        $project: {
          month: { 
            $concat: [
              { $arrayElemAt: [["", "Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"], "$_id.month"] },
              " ",
              { $substr: ["$_id.year", 2, 2] }
            ]
          },
          income: 1,
          expenses: 1,
          _id: 0
        }
      }
    ]);

    // 3. Metrics Calculation
    const totalIncome = trends.reduce((acc, curr) => acc + curr.income, 0);
    const totalExpenses = trends.reduce((acc, curr) => acc + curr.expenses, 0);
    const savingsRate = totalIncome > 0 ? Math.round(((totalIncome - totalExpenses) / totalIncome) * 100) : 0;

    res.status(200).json({
      trends,
      categories: categoryData,
      savingsRate,
      topExpenseCategory: categoryData[0]?.name || "None",
      totalMonthlySpend: trends[trends.length - 1]?.expenses || 0
    });

  } catch (error) {
    console.error("Analytics Error:", error);
    res.status(500).json({ message: "Error generating analytics" });
  }
};