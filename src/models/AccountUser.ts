// account user collection

import mongoose , {Document , Schema} from "mongoose";

export enum AccountRole{
    OWNER = "OWNER",
    USER = "USER",
    VIEWER = "VIEWER"
}

export interface IAccountUser extends Document{
    _id: mongoose.Types.ObjectId
    accountId : mongoose.Types.ObjectId
    userId : mongoose.Types.ObjectId
    accountRole : AccountRole
    joinedAt:Date
    createdAt: Date
    updatedAt: Date
}

const accountUserSchema = new Schema<IAccountUser>(
    {
        accountId: { type: Schema.Types.ObjectId, ref: "Account", required: true },
        userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
        accountRole: { type: String, enum: Object.values(AccountRole), required: true },
        joinedAt: { type: Date, default: Date.now }
    },
    {timestamps: true}
)

export const AccountUser = mongoose.model<IAccountUser>("AccountUser", accountUserSchema)