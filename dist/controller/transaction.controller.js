"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteTransaction = exports.getTransactionsByCategory = exports.createTransaction = void 0;
const Transaction_1 = require("../models/Transaction");
const AllocationCategory_1 = require("../models/AllocationCategory");
const createTransaction = async (req, res) => {
    try {
        const { allocationCategoryId, amount, description, paymentMethod, date } = req.body;
        const userId = req.user.userId;
        const accountId = req.user.accountId;
        const billImage = req.file ? req.file.path : undefined;
        const allocCat = await AllocationCategory_1.AllocationCategory.findById(allocationCategoryId);
        if (!allocCat)
            return res.status(404).json({ message: "Budget allocation not found" });
        const newTransaction = await Transaction_1.Transaction.create({
            userId,
            accountId,
            allocationCategoryId: allocCat._id,
            categoryId: allocCat.categoryId,
            type: "EXPENSE",
            amount: Number(amount),
            description,
            paymentMethod,
            billImage,
            date: date || new Date(),
        });
        allocCat.spent += Number(amount);
        await allocCat.save();
        res.status(201).json({ success: true, transaction: newTransaction });
    }
    catch (err) {
        console.error("Create error:", err);
        res.status(500).json({ message: "Upload failed" });
    }
};
exports.createTransaction = createTransaction;
const getTransactionsByCategory = async (req, res) => {
    try {
        const { allocationCategoryId } = req.params;
        const allocCat = await AllocationCategory_1.AllocationCategory.findById(allocationCategoryId);
        if (!allocCat)
            return res.status(404).json({ message: "Category not found" });
        const transactions = await Transaction_1.Transaction.find({
            userId: req.user.userId,
            categoryId: allocCat.categoryId
        }).sort({ date: -1 });
        res.status(200).json({ success: true, transactions });
    }
    catch (err) {
        res.status(500).json({ message: "Failed to fetch transactions" });
    }
};
exports.getTransactionsByCategory = getTransactionsByCategory;
const deleteTransaction = async (req, res) => {
    try {
        const { id } = req.params;
        const tx = await Transaction_1.Transaction.findById(id);
        if (!tx)
            return res.status(404).json({ message: "Transaction not found" });
        const updatedAlloc = await AllocationCategory_1.AllocationCategory.findByIdAndUpdate(tx.allocationCategoryId, { $inc: { spent: -tx.amount } }, { new: true });
        if (updatedAlloc && updatedAlloc.spent < 0) {
            updatedAlloc.spent = 0;
            await updatedAlloc.save();
        }
        await Transaction_1.Transaction.findByIdAndDelete(id);
        return res.status(200).json({
            success: true,
            message: "Transaction deleted and budget refunded",
            newSpent: updatedAlloc ? updatedAlloc.spent : 0
        });
    }
    catch (err) {
        console.error("Delete error:", err);
        return res.status(500).json({ message: "Server error during deletion" });
    }
};
exports.deleteTransaction = deleteTransaction;
