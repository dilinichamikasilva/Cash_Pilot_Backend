// category collection

import mongoose , {Document , Schema} from "mongoose";

export interface ICategory extends Document{
    _id: mongoose.Types.ObjectId
    accountId: mongoose.Types.ObjectId;
    name : string
    createdAt: Date
    updatedAt: Date
}

const categorySchema = new Schema<ICategory>(
    {
    accountId: {
      type: Schema.Types.ObjectId,
      ref: "Account",
      required: true,
    },
    name: { type: String, required: true },
   
  },
    {timestamps: true}
)

export const Category = mongoose.model<ICategory>("Category", categorySchema)