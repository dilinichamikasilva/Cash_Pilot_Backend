// AllocationCategory collection
import mongoose, { Document, Schema } from "mongoose";

export interface IAllocationCategory extends Document {
  _id: mongoose.Types.ObjectId;
  monthlyAllocationId: mongoose.Types.ObjectId;
  categoryId: mongoose.Types.ObjectId;
  budget: number;
  spent: number;
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
