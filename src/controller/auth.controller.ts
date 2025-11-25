import {Request , Response} from "express"
import { AuthRequest } from "../middleware/auth.middleware"
import bcrypt from "bcrypt"
import {User , Role} from "../models/User"
import { Account , AccountType} from "../models/Accounts"
import jwt from "jsonwebtoken"
import dotenv from "dotenv"
dotenv.config()

const JWT_SECRET =  process.env.JWT_SECRET as string
const JWT_REFRESH_SECRET =  process.env.JWT_REFRESH_SECRET as string


//user registration
export const registerUser = async (req: Request, res: Response) => {
  try {
    const {
      name,
      email,
      password,
      confirmPassword,
      country,
      mobile,
      accountName,
      accountType,
      currency,
      openingBalance,
    } = req.body;

    
    if (
      !name ||
      !email ||
      !password ||
      !confirmPassword ||
      !country ||
      !mobile ||
      !accountName ||
      !accountType ||
      !currency
    ) {
      return res.status(400).json({ message: "All fields are required!" });
    }

    //Password match
    if (password !== confirmPassword) {
      return res
        .status(400)
        .json({ message: "Passwords do not match! Please try again." });
    }

    // Validate name (letters and spaces only)
    if (!/^[A-Za-z\s]+$/.test(name)) {
      return res
        .status(400)
        .json({ message: "Name can only contain letters and spaces." });
    }

    //Validate email 
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(400).json({ message: "Invalid email format." });
    }

    //Validate mobile number (+ and digits only, length 5-15)
    if (!/^\+?\d{5,15}$/.test(mobile)) {
      return res
        .status(400)
        .json({ message: "Mobile number must contain only digits and +." });
    }

    //Validate country (letters and spaces only)
    if (!/^[A-Za-z\s]+$/.test(country)) {
      return res
        .status(400)
        .json({ message: "Country can only contain letters and spaces." });
    }

    //Validate opening balance is a number
    const balance = openingBalance ? Number(openingBalance) : 0;
    if (isNaN(balance)) {
      return res.status(400).json({ message: "Opening balance must be a number." });
    }

    //Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(409).json({ message: "This email is already registered!" });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create account
    const newAccount = await Account.create({
      name: accountName,
      accountType,
      currency,
      openingBalance: balance,
      currentBalance: balance,
    });

    //Set roles
    let roles = [Role.USER];
    if (accountType === AccountType.BUSINESS) {
      roles = [Role.OWNER];
    }

    // Create user
    const newUser = await User.create({
      accountId: newAccount._id,
      name,
      email,
      password: hashedPassword,
      country,
      mobile,
      roles: roles,
    });

    
    return res.status(201).json({
      message: "Registration successful!",
      user: {
        id: newUser._id,
        name: newUser.name,
        email: newUser.email,
        mobile: newUser.mobile,
        roles: newUser.roles,
      },
      account: {
        id: newAccount._id,
        name: newAccount.name,
        accountType: newAccount.accountType,
        currency: newAccount.currency,
        openingBalance: newAccount.openingBalance,
      },
    });
  } catch (err) {
    console.error("Registration error:", err);
    return res.status(500).json({ message: "Internal server error" });
  }
};

//user login
export const loginUser = async (req: Request , res:Response) => {
    
    try{
        const {email , password} = req.body

        if(!email || !password){
            return res.status(400).json({message : "Email and password are required!"})
        }

        const user = await User.findOne({email})

        if(!user){
            return res.status(401).json({message: "Invalid email or password!"})
        }

        const isMatch = await bcrypt.compare(password , user.password)
        if(!isMatch){
            return res.status(401).json({message : "Invalid email or password!"})
        }

        //create access token
        const accessToken = jwt.sign(
            {
                userId: user._id,
                accountId:user.accountId,
                roles:user.roles
            },
            JWT_SECRET,
            {
                expiresIn : "15m"
            }
        )

        //create refresh Token 
        const refreshToken = jwt.sign(
            {userId : user._id},
            JWT_REFRESH_SECRET,
            {expiresIn : "7d"}

        )

        return res.status(200).json(
            {
                message : "Login successfully",
                accessToken,
                refreshToken,
                user: {
                    id:user._id,
                    name:user.name,
                    email:user.email,
                    roles:user.roles,
                    accountId:user.accountId
                }
            }
        )

    }catch(err){
        console.error("Login error : " , err)
        return res.status(500).json({message : "Internal server error!"})
    }
}


// refresh token
export const refreshToken = (req:Request , res:Response) => {
    const {token} = req.body

    if(!token){
        return res.status(401).json({message : "Refresh token required!"})
    }

    try{
        const payload = jwt.verify(
            token,
            JWT_REFRESH_SECRET
        ) as any

        const accessToken = jwt.sign(
            {userId: payload.userId},
            JWT_SECRET,
            {expiresIn : "15m"}
        )

        return res.status(200).json({accessToken})


    }catch(err){
        return res.status(403).json({message : "Invalid refresh token"})
    }
}


// get me
export const getMe = async (req: AuthRequest , res:Response) => {
    try{
        if(!req.user || !req.user.userId){
            return res.status(401).json({message : "Unauthorized"})
        }

        const user = await User.findById(req.user.userId)

        if(!user){
            return res.status(404).json({message : "User not found"})
        }

        res.json({
            id:user._id,
            name:user.name,
            email:user.email,
            mobile:user.mobile,
            roles:user.roles,
            accountId:user.accountId

        })
    }catch(err){
        console.error("GetMe error : " , err)
        res.status(500).json({message : "Internal server error"})

    }
}

//check email
export const checkEmail = async (req:Request , res:Response) => {
    try{
        const {email} = req.body
        if(!email){
            return res.status(400).json({
                available : false,
                message : "Email is required!"
            })

        }

        const existingUser = await User.findOne({email})

        if(existingUser){
            return res.json({available : false})
        }
        return res.json({available : true})

    }catch(err){
        console.error("CheckEmail error:", err);
        return res.status(500).json({ available: false, message: "Server error" });
    }
}
