// transaction collection

import mongoose , {Document , Schema} from "mongoose"

export enum TransactionType{
    INCOME = "INCOME",
    EXPENSE = "EXPENSE"
}

export enum PaymentMethod{
    CASH = "CASH",
    DEBIT_CARD = "DEBIT_CARD",
    CREDIT_CARD = "CREDIT_CARD"

}


export interface ITransaction extends Document{
    _id: mongoose.Types.ObjectId
    userId: mongoose.Types.ObjectId
    accountId: mongoose.Types.ObjectId
    categoryId: mongoose.Types.ObjectId
    type : TransactionType
    amount: number
    description?: string
    billImage?: string
    paymentMethod : PaymentMethod
    date : Date
    createdAt: Date
    updatedAt: Date
}

const transactionSchema = new Schema<ITransaction>(
    {
        userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
        accountId: { type: Schema.Types.ObjectId, ref: "Account", required: true },
        categoryId: { type: Schema.Types.ObjectId, ref: "Category", required: true },
        type: { type: String, enum: Object.values(TransactionType)},
        amount: {type : Number , required:true},
        description: {type : String },
        billImage: {type : String },
        paymentMethod: { type: String, enum: Object.values(PaymentMethod)},
        date: {type: Date, default: Date.now}
    
    },
    {timestamps: true}
)

export const Transaction = mongoose.model<ITransaction>("Transaction", transactionSchema)