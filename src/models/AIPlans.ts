// AI plans collection

import mongoose , {Document , Schema} from "mongoose"

export interface IAIPlans extends Document{
    _id: mongoose.Types.ObjectId
    userId: mongoose.Types.ObjectId
    accountId: mongoose.Types.ObjectId
    monthlyAllocationId:mongoose.Types.ObjectId
    aiType:string       //budget plan , chat response
    prompt:string
    createdAt: Date
    updatedAt: Date
}

const aiPlansSchema = new Schema<IAIPlans>(
    {
        userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
        accountId: { type: Schema.Types.ObjectId, ref: "Account", required: true },
        monthlyAllocationId: { type: Schema.Types.ObjectId, ref: "MonthlyAllocation", required: true },
        aiType:{type : String , required:true},
        prompt:{type : String , required:true}    
    },
    {timestamps: true}
)

export const aiPlans = mongoose.model<IAIPlans>("aiPlans", aiPlansSchema)