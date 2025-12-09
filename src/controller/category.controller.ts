import { Request, Response } from "express";
import { Category } from "../models/Category";
import mongoose from "mongoose";


export const createCategory = async (req: Request, res: Response) => {
  try {
    const { accountId, name } = req.body;

    if (!accountId || !name)
        return res.status(400).json({ message: "accountId and name required" });

    const existing = await Category.findOne({ 
        accountId: new mongoose.Types.ObjectId(accountId),
        name: { $regex: new RegExp(`^${name}$`, "i") }, 

    });

    if (existing) 
        return res.status(200).json({ category: existing });

    const newCategory = await Category.create({
      accountId,
      name,
    });

    return res.status(201).json({ category: newCategory });

  } catch (err) {
    console.error("createCategory error:", err);
    return res.status(500).json({ message: "Server error" });
  }
};
