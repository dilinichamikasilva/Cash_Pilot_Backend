// over spending alerts collection

import mongoose , {Document , Schema} from "mongoose"

export interface IOverSpendingAlert extends Document{
    _id: mongoose.Types.ObjectId
    userId: mongoose.Types.ObjectId
    accountId: mongoose.Types.ObjectId
    monthlyAllocationId:mongoose.Types.ObjectId
    categoryId: mongoose.Types.ObjectId
    allocatedAmount: number
    spentAmount:number
    overamount: number
    msg : string
    alertDate : Date
    createdAt: Date
    updatedAt: Date
}

const overSpendingAlertSchema = new Schema<IOverSpendingAlert>(
    {
        userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
        accountId: { type: Schema.Types.ObjectId, ref: "Account", required: true },
        categoryId: { type: Schema.Types.ObjectId, ref: "Category", required: true },
        monthlyAllocationId: { type: Schema.Types.ObjectId, ref: "MonthlyAllocation", required: true },
        allocatedAmount: {type : Number , default:0},
        spentAmount: {type : Number , default:0},
        overamount: {type : Number , default:0},
        msg: {type : String},
        alertDate: {type: Date, default: Date.now}
    
    },
    {timestamps: true}
)

export const OverSpendingAlert = mongoose.model<IOverSpendingAlert>("OverSpendingAlert", overSpendingAlertSchema)