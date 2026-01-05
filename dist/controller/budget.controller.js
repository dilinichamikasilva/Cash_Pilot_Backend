"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateCategorySpending = exports.getMonthlyAllocation = exports.checkFirstMonth = exports.createMonthlyAllocation = exports.getCategories = void 0;
const Category_1 = require("../models/Category");
const MonthlyAllocations_1 = require("../models/MonthlyAllocations");
const AllocationCategory_1 = require("../models/AllocationCategory");
const OverSpendingAlerts_1 = require("../models/OverSpendingAlerts");
const mongoose_1 = __importDefault(require("mongoose"));
const getCategories = async (req, res) => {
    try {
        const accountId = req.query.accountId;
        if (!accountId)
            return res.status(400).json({ message: "accountId required" });
        const distinctNames = await Category_1.Category.distinct("name", {
            accountId: new mongoose_1.default.Types.ObjectId(accountId),
        });
        return res.json({ categories: distinctNames });
    }
    catch (err) {
        console.error("getCategories error:", err);
        return res.status(500).json({ message: "Server error" });
    }
};
exports.getCategories = getCategories;
const createMonthlyAllocation = async (req, res) => {
    try {
        const { month, year, categories } = req.body;
        const userEnteredIncome = Number(req.body.income || 0);
        const { userId, accountId } = req.user;
        const existingAllocation = await MonthlyAllocations_1.MonthlyAllocation.findOne({
            accountId,
            month: Number(month),
            year: Number(year)
        });
        let carryForward = 0;
        if (!existingAllocation) {
            const prevDate = new Date(year, month - 2);
            const prevM = prevDate.getMonth() + 1;
            const prevY = prevDate.getFullYear();
            const previousAllocation = await MonthlyAllocations_1.MonthlyAllocation.findOne({ accountId, month: prevM, year: prevY });
            if (previousAllocation) {
                const prevCats = await AllocationCategory_1.AllocationCategory.find({ monthlyAllocationId: previousAllocation._id });
                const totalSpentPrev = prevCats.reduce((sum, c) => sum + (c.spent || 0), 0);
                carryForward = previousAllocation.totalAllocated - totalSpentPrev;
            }
            else {
                const account = await mongoose_1.default.model("Account").findById(accountId);
                carryForward = account?.openingBalance || 0;
            }
        }
        const allocation = await MonthlyAllocations_1.MonthlyAllocation.findOneAndUpdate({ accountId, month: Number(month), year: Number(year) }, {
            $set: { userId },
            $inc: { totalAllocated: userEnteredIncome },
            $setOnInsert: { carryForwardSavings: carryForward }
        }, { new: true, upsert: true });
        const categoryOps = await Promise.all(categories.map(async (c) => {
            let cat = await Category_1.Category.findOne({ accountId, name: c.name });
            if (!cat)
                cat = await Category_1.Category.create({ accountId, name: c.name });
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
        if (bulkOps.length > 0)
            await AllocationCategory_1.AllocationCategory.bulkWrite(bulkOps);
        //  CLEANUP & FINAL RESPONSE
        const activeIds = categoryOps.map(op => op.categoryId);
        await AllocationCategory_1.AllocationCategory.deleteMany({ monthlyAllocationId: allocation._id, categoryId: { $nin: activeIds } });
        return res.status(200).json({ message: "Budget Sync Complete", allocation });
    }
    catch (err) {
        console.error(err);
        return res.status(500).json({ message: "Server Error" });
    }
};
exports.createMonthlyAllocation = createMonthlyAllocation;
const checkFirstMonth = async (req, res) => {
    try {
        const { accountId, month, year } = req.query;
        // Find the earliest budget record for this account
        const earliestBudget = await MonthlyAllocations_1.MonthlyAllocation.findOne({ accountId })
            .sort({ year: 1, month: 1 })
            .lean();
        // If no budgets exist yet, the current one being planned is effectively the first
        if (!earliestBudget) {
            return res.json({ isFirstMonth: true });
        }
        // Check if the requested month/year matches the earliest record
        const isFirst = earliestBudget.month === Number(month) && earliestBudget.year === Number(year);
        return res.json({ isFirstMonth: isFirst });
    }
    catch (err) {
        return res.status(500).json({ message: "Server error" });
    }
};
exports.checkFirstMonth = checkFirstMonth;
const getMonthlyAllocation = async (req, res) => {
    try {
        const { accountId, month, year } = req.query;
        if (!accountId || !month || !year)
            return res.status(400).json({ message: "accountId, month and year required" });
        const allocation = await MonthlyAllocations_1.MonthlyAllocation.findOne({
            accountId,
            month: Number(month),
            year: Number(year),
        }).lean();
        if (!allocation)
            return res.status(404).json({ message: "Not found" });
        const allocationCategories = await AllocationCategory_1.AllocationCategory.find({
            monthlyAllocationId: allocation._id,
        })
            .populate("categoryId")
            .lean();
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
    }
    catch (err) {
        console.error("getMonthlyAllocation error:", err);
        return res.status(500).json({ message: "Server error" });
    }
};
exports.getMonthlyAllocation = getMonthlyAllocation;
const updateCategorySpending = async (req, res) => {
    try {
        const { allocationCategoryId, actualAmount } = req.body;
        const userId = req.user.userId;
        const accountId = req.user.accountId;
        if (!allocationCategoryId || actualAmount === undefined) {
            return res.status(400).json({ message: "Allocation Category ID and Actual Amount are required" });
        }
        const allocCat = await AllocationCategory_1.AllocationCategory.findById(allocationCategoryId).populate({
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
            await OverSpendingAlerts_1.OverSpendingAlert.create({
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
                categoryName: allocCat.categoryId?.name,
                budget: allocCat.budget,
                actualSpent: allocCat.spent,
                difference: difference,
                status: isOverspent ? "OVERSPENT" : "WITHIN_BUDGET",
                alertGenerated
            }
        });
    }
    catch (err) {
        console.error("updateCategorySpending error:", err);
        return res.status(500).json({ message: "Server error while updating spending" });
    }
};
exports.updateCategorySpending = updateCategorySpending;
