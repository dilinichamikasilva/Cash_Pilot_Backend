// category collection

import mongoose , {Document , Schema} from "mongoose";

export interface ICategory extends Document{
    _id: mongoose.Types.ObjectId
    monthlyAllocationId: mongoose.Types.ObjectId
    name : string
    budget: number
    spent : number
    createdAt: Date
    updatedAt: Date
}

const categorySchema = new Schema<ICategory>(
    {
        monthlyAllocationId: { type: Schema.Types.ObjectId, ref: "MonthlyAllocation", required: true },
        name: {type : String , required:true},
        budget: {type : Number , default:0},
        spent: {type : Number , default:0},
    
    },
    {timestamps: true}
)

export const Category = mongoose.model<ICategory>("Category", categorySchema)