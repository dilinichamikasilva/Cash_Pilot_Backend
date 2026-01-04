//user collection
import mongoose, {Document , Schema} from "mongoose"

export enum Role{
    ADMIN = "ADMIN",
    OWNER = "OWNER",
    USER = "USER",
    VIEWER = "VIEWER"
}

export interface IUser extends Document{
    _id: mongoose.Types.ObjectId
    accountId:mongoose.Types.ObjectId
    name: string
    email: string
    password: string
    country:string
    mobile: string
    roles: Role[]
    picture?: string        
    isGoogleUser: boolean
    resetPasswordToken?: string;
    resetPasswordExpires?: Date;
    createdAt: Date
    updatedAt: Date
}

const userSchema = new Schema<IUser>(
    {
        accountId: { type: Schema.Types.ObjectId, ref: "Account", required: true },
        name: {type:String, required:true},
        email: {type:String, unique: true, lowercase: true, required:true},
        password: { type: String, required: false , default: "" },
        country: {type: String , required:false , default:"Sri Lanka"},
        mobile: {type:String , required: false , default: ""},
        roles: {type: [String], enum: Object.values(Role), default: [Role.USER]},
        picture: { type: String, default: "" },         
        isGoogleUser: { type: Boolean, default: false },
        resetPasswordToken: { type: String, default: null },
        resetPasswordExpires: { type: Date, default: null },
    },
    { timestamps: true }

)

export const User = mongoose.model<IUser>("User", userSchema)