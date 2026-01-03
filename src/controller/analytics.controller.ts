// import { Request, Response } from "express";
// import { Transaction, TransactionType } from "../models/Transaction";

// export const getAnalyticsSummary = async (req: Request, res: Response) => {
//   try {
//     const monthsRequested = parseInt(req.query.months as string) || 6;
//     const groupBy = (req.query.groupBy as string) || "month"; // options: day, week, month
    
//     const startDate = new Date();
//     startDate.setMonth(startDate.getMonth() - monthsRequested);

//     // 1. Dynamic Grouping Configuration
//     const getGroupConfig = () => {
//       switch (groupBy) {
//         case "day":
//           return { year: { $year: "$date" }, month: { $month: "$date" }, day: { $dayOfMonth: "$date" } };
//         case "week":
//           return { year: { $year: "$date" }, week: { $week: "$date" } };
//         default:
//           return { year: { $year: "$date" }, month: { $month: "$date" } };
//       }
//     };

//     // 2. Trends Aggregation (Income vs Expenses)
//     const trends = await Transaction.aggregate([
//       { $match: { date: { $gte: startDate } } },
//       {
//         $group: {
//           _id: getGroupConfig(),
//           income: { $sum: { $cond: [{ $eq: ["$type", TransactionType.INCOME] }, "$amount", 0] } },
//           expenses: { $sum: { $cond: [{ $eq: ["$type", TransactionType.EXPENSE] }, "$amount", 0] } }
//         }
//       },
//       { $sort: { "_id.year": 1, "_id.month": 1, "_id.week": 1, "_id.day": 1 } },
//       {
//         $project: {
//           label: {
//             $switch: {
//               branches: [
//                 { 
//                   case: { $eq: [groupBy, "day"] }, 
//                   then: { $dateToString: { format: "%d %b", date: { $dateFromParts: { year: "$_id.year", month: "$_id.month", day: "$_id.day" } } } } 
//                 },
//                 { 
//                   case: { $eq: [groupBy, "week"] }, 
//                   then: { $concat: ["Wk ", { $substr: ["$_id.week", 0, -1] }, " ", { $substr: ["$_id.year", 0, -1] }] } 
//                 }
//               ],
//               default: {
//                 $concat: [
//                   { $arrayElemAt: [["", "Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"], "$_id.month"] },
//                   " ", { $substr: ["$_id.year", 2, 2] }
//                 ]
//               }
//             }
//           },
//           income: 1,
//           expenses: 1,
//           _id: 0
//         }
//       }
//     ]);

//     // 3. Category Aggregation
//     const categoryData = await Transaction.aggregate([
//       { $match: { date: { $gte: startDate }, type: TransactionType.EXPENSE } },
//       {
//         $lookup: {
//           from: "categories",
//           localField: "categoryId",
//           foreignField: "_id",
//           as: "cat"
//         }
//       },
//       { $unwind: "$cat" },
//       { $group: { _id: "$cat.name", value: { $sum: "$amount" } } },
//       { $project: { name: "$_id", value: 1, _id: 0 } },
//       { $sort: { value: -1 } }
//     ]);

//     // 4. Global Metrics
//     const totalIncome = trends.reduce((acc, curr) => acc + curr.income, 0);
//     const totalExpenses = trends.reduce((acc, curr) => acc + curr.expenses, 0);

//     res.status(200).json({
//       trends,
//       categories: categoryData,
//       savingsRate: totalIncome > 0 ? Math.round(((totalIncome - totalExpenses) / totalIncome) * 100) : 0,
//       topExpenseCategory: categoryData[0]?.name || "None",
//       totalMonthlySpend: trends[trends.length - 1]?.expenses || 0
//     });
//   } catch (error) {
//     console.error(error);
//     res.status(500).json({ message: "Server Error" });
//   }
// };

import { Request, Response } from "express";
import { Transaction, TransactionType } from "../models/Transaction";
import mongoose from "mongoose";

export const getAnalyticsSummary = async (req: Request, res: Response) => {
  try {
    const { months, groupBy, date, view, accountId } = req.query;

    if (!accountId) {
      return res.status(400).json({ message: "AccountId is required" });
    }

    // 1. Determine Date Range
    let startDate: Date;
    let endDate: Date = new Date();

    if (view === "single" && date) {
      startDate = new Date(date as string);
      startDate.setHours(0, 0, 0, 0);
      endDate = new Date(date as string);
      endDate.setHours(23, 59, 59, 999);
    } else {
      const monthsRequested = parseInt(months as string) || 6;
      startDate = new Date();
      startDate.setMonth(startDate.getMonth() - monthsRequested);
      startDate.setHours(0, 0, 0, 0); // Start from beginning of the day months ago
    }

    const accountObjId = new mongoose.Types.ObjectId(accountId as string);

    // 2. Trend Aggregation (Income vs Expenses)
    const groupInterval = (groupBy as string) || "month";

    const trends = await Transaction.aggregate([
      { 
        $match: { 
          accountId: accountObjId,
          date: { $gte: startDate, $lte: endDate }
        } 
      },
      {
        $group: {
          _id: view === "single" 
            ? { day: { $dayOfMonth: "$date" }, month: { $month: "$date" }, year: { $year: "$date" } }
            : groupInterval === "day" 
              ? { year: { $year: "$date" }, month: { $month: "$date" }, day: { $dayOfMonth: "$date" } }
              : groupInterval === "week"
                ? { year: { $year: "$date" }, week: { $week: "$date" } }
                : { year: { $year: "$date" }, month: { $month: "$date" } },
          income: { $sum: { $cond: [{ $eq: ["$type", TransactionType.INCOME] }, "$amount", 0] } },
          expenses: { $sum: { $cond: [{ $eq: ["$type", TransactionType.EXPENSE] }, "$amount", 0] } }
        }
      },
      { $sort: { "_id.year": 1, "_id.month": 1, "_id.week": 1, "_id.day": 1 } },
      {
        $project: {
          label: {
            $switch: {
              branches: [
                { 
                  case: { $eq: [view, "single"] }, 
                  then: { $dateToString: { format: "%d %b", date: startDate } }
                },
                { 
                  case: { $eq: [groupInterval, "day"] }, 
                  then: { $dateToString: { format: "%d %b", date: { $dateFromParts: { year: "$_id.year", month: "$_id.month", day: "$_id.day" } } } } 
                }
              ],
              default: {
                $concat: [
                  { $arrayElemAt: [["", "Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"], "$_id.month"] },
                  " ", { $substr: ["$_id.year", 2, 2] }
                ]
              }
            }
          },
          income: 1,
          expenses: 1,
          _id: 0
        }
      }
    ]);

    // 3. Category Distribution
    const categoryData = await Transaction.aggregate([
      { 
        $match: { 
          accountId: accountObjId,
          date: { $gte: startDate, $lte: endDate }, 
          type: TransactionType.EXPENSE 
        } 
      },
      {
        $lookup: {
          from: "categories",
          localField: "categoryId",
          foreignField: "_id",
          as: "cat"
        }
      },
      { $unwind: "$cat" },
      { $group: { _id: "$cat.name", value: { $sum: "$amount" } } },
      { $project: { name: "$_id", value: 1, _id: 0 } },
      { $sort: { value: -1 } }
    ]);

    // 4. Calculate Metrics
    const totalIncome = trends.reduce((acc, curr) => acc + curr.income, 0);
    const totalExpenses = trends.reduce((acc, curr) => acc + curr.expenses, 0);

    res.status(200).json({
      trends,
      categories: categoryData,
      savingsRate: totalIncome > 0 ? Math.round(((totalIncome - totalExpenses) / totalIncome) * 100) : 0,
      topExpenseCategory: categoryData[0]?.name || "None",
      totalMonthlySpend: view === "single" ? totalExpenses : (trends[trends.length - 1]?.expenses || 0)
    });

  } catch (error) {
    console.error("Backend Analytics Error:", error);
    res.status(500).json({ message: "Server Error" });
  }
};