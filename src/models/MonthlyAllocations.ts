// monthly allocations collection

import mongoose , {Document , Schema} from "mongoose";

export interface IMonthlyAllocation extends Document{
    _id: mongoose.Types.ObjectId
    userId: mongoose.Types.ObjectId
    accountId: mongoose.Types.ObjectId
    month : number
    year: number
    carryForwardSavings : number
    totalAllocated : number
    remainingBalance : number
    // userEnteredIncome: number
    createdAt: Date
    updatedAt: Date
}

const monthlyAllocationSchema = new Schema<IMonthlyAllocation>(
    {
        userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
        accountId: { type: Schema.Types.ObjectId, ref: "Account", required: true },
        month: {type : Number , required:true},
        year: {type : Number , required:true},
        // userEnteredIncome: { type: Number, default: 0, required: true },
        carryForwardSavings: {type : Number , default:0},
        totalAllocated: {type : Number , default:0},
        remainingBalance: {type : Number , default:0}
    
    },
    {timestamps: true}
)

export const MonthlyAllocation = mongoose.model<IMonthlyAllocation>("MonthlyAllocation", monthlyAllocationSchema)