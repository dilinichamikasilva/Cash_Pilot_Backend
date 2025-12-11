// AllocationCategory collection
import mongoose, { Document, Schema } from "mongoose";

export interface IAllocationCategory extends Document {
  _id: mongoose.Types.ObjectId;
  monthlyAllocationId: mongoose.Types.ObjectId;
  categoryId: mongoose.Types.ObjectId;
  budget: number;
  spent: number;
}

export interface IAllocationCategoryPopulated extends Omit<IAllocationCategory , "categoryId"> {
  categoryId: {
    _id: mongoose.Types.ObjectId;
    name: string;
    accountId: mongoose.Types.ObjectId;
  };
}

const allocationCategorySchema = new Schema<IAllocationCategory>(
  {
    monthlyAllocationId: {
      type: Schema.Types.ObjectId,
      ref: "MonthlyAllocation",
      required: true,
    },
    categoryId: {
      type: Schema.Types.ObjectId,
      ref: "Category",
      required: true,
    },
    budget: { type: Number, default: 0 },
    spent: { type: Number, default: 0 },
  },
  { timestamps: true }
);

export const AllocationCategory = mongoose.model<IAllocationCategory>(
  "AllocationCategory",
  allocationCategorySchema
);
