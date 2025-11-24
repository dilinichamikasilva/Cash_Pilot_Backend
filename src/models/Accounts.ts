// accounts collection

import mongoose , {Document , Schema} from "mongoose";

export enum AccountType{
    PERSONAL = "PERSONAL",
    BUSINESS = "BUSINESS"
}

export interface IAccount extends Document{
    _id: mongoose.Types.ObjectId
    name : string
    accountType : AccountType
    currency : string
    currentBalance : number
    openingBalance : number
    createdAt: Date
    updatedAt: Date
}

const accountSchema = new Schema<IAccount>(
    {
        name: {type:String, required:true},
        accountType: { type: String, enum: Object.values(AccountType), required: true },
        currency: {type : String , required:true},
        currentBalance : {type: Number , default:0},
        openingBalance: {type: Number , default:0}
    },
    {timestamps: true}
)

export const Account = mongoose.model<IAccount>("Account", accountSchema)