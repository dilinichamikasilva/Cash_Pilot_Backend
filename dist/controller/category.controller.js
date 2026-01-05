"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createCategory = void 0;
const Category_1 = require("../models/Category");
const mongoose_1 = __importDefault(require("mongoose"));
const createCategory = async (req, res) => {
    try {
        const { accountId, name } = req.body;
        if (!accountId || !name)
            return res.status(400).json({ message: "accountId and name required" });
        const existing = await Category_1.Category.findOne({
            accountId: new mongoose_1.default.Types.ObjectId(accountId),
            name: { $regex: new RegExp(`^${name}$`, "i") },
        });
        if (existing)
            return res.status(200).json({ category: existing });
        const newCategory = await Category_1.Category.create({
            accountId,
            name,
        });
        return res.status(201).json({ category: newCategory });
    }
    catch (err) {
        console.error("createCategory error:", err);
        return res.status(500).json({ message: "Server error" });
    }
};
exports.createCategory = createCategory;
