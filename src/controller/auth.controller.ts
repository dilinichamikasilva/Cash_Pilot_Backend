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

        const account = await Account.findById(user.accountId)
          if (!account) {
            return res.status(404).json({ message: "Account not found" });
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
                },
                account: {
                  id: account._id,
                  name: account.name,          
                  accountType: account.accountType,
                  currency: account.currency,
                  currentBalance: account.currentBalance
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

        const account = await Account.findById(user.accountId)
          if (!account) {
              return res.status(404).json({ message: "Account not found" })
          }

        return res.json({
          user: {
            id: user._id,
            name: user.name,
            email: user.email,
            roles: user.roles,
            accountId: user.accountId,
            mobile: user.mobile,
            country: user.country,
            picture: user.picture
          },
          account: {
              id: account._id,
              name: account.name,        
              accountType: account.accountType,
              currency: account.currency,
              currentBalance: account.currentBalance,
              openingBalance: account.openingBalance
          }
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


// complete registration
export const completeRegistration = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user.userId; // from auth middleware

    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const {
      mobile,
      country,
      picture,
      currency,
      openingBalance,
      accountType,
      role, 
    } = req.body;

    if (!mobile || mobile.trim().length < 9) {
      return res.status(400).json({ message: "Enter a valid mobile number" });
    }

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: "User not found" });

    const account = await Account.findById(user.accountId);
    if (!account)
      return res.status(404).json({ message: "Account not found" });


    user.mobile = mobile;
    user.country = country;
    if (picture) user.picture = picture;

  
    if (accountType === "BUSINESS") {
      user.roles = [Role.OWNER];
    }

    // update account fields
    account.accountType = accountType === "BUSINESS" ? AccountType.BUSINESS : AccountType.PERSONAL;
    account.currency = currency || account.currency;
    account.openingBalance = openingBalance ?? account.openingBalance;
    account.currentBalance = openingBalance ?? account.currentBalance;

    await user.save();
    await account.save();

    return res.json({
      message: "Registration completed successfully",
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        roles: user.roles,
        accountId: user.accountId,
        mobile: user.mobile,
        country: user.country,
        picture: user.picture,
      },
    });

  } catch (err) {
    console.error("Complete Registration Error:", err);
    return res.status(500).json({ message: "Server error" });
  }
};

export const updateProfilePicture = async (req: AuthRequest, res: Response) => {
  const { picture } = req.body;

  if (!picture) {
    return res.status(400).json({ message: "No picture provided" });
  }

  const updated = await User.findByIdAndUpdate(
    req.user.userId,
    { picture },
    { new: true }
  );

  return res.json({ user: updated });
};


// GET account by ID
export const getAccountById = async (req: Request, res: Response) => {
  try {
    const account = await Account.findById(req.params.id);

    if (!account) {
      return res.status(404).json({ message: "Account not found" });
    }

    return res.json({ account });
  } catch (err) {
    console.error("GetAccount error:", err);
    return res.status(500).json({ message: "Server error" });
  }
};

// Logout user
export const logoutUser = async (req: Request, res: Response) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(400).json({ message: "Refresh token is required!" });
    }

    /**
     * Logic:
     * If you store refresh tokens in your Database (recommended), 
     * you should delete/nullify it here.
     * * Example:
     * await User.updateOne({ _id: req.user.userId }, { $unset: { refreshToken: "" } });
     */

    return res.status(200).json({ 
      message: "Logged out successfully from server." 
    });
  } catch (err) {
    console.error("Logout error:", err);
    return res.status(500).json({ message: "Internal server error" });
  }
};

// Update User Settings
export const updateSettings = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const { name, country, mobile, picture, accountName } = req.body;

    // 1. Update the User document
    // We use findById then save() to ensure any pre-save hooks or 
    // validation logic is triggered.
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Only update if the field was provided in the request
    if (name !== undefined) user.name = name;
    if (country !== undefined) user.country = country;
    if (mobile !== undefined) user.mobile = mobile;
    if (picture !== undefined) user.picture = picture; // Base64 string saved here

    await user.save();

    // 2. Update the Account name if provided
    let account = await Account.findById(user.accountId);
    if (account && accountName) {
      account.name = accountName;
      await account.save();
    }

    // 3. Return the response in a format the frontend expects
    return res.status(200).json({
      message: "Settings updated successfully",
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        roles: user.roles,
        accountId: user.accountId,
        mobile: user.mobile,
        country: user.country,
        picture: user.picture
      },
      account: account ? {
        id: account._id,
        name: account.name,
        accountType: account.accountType,
        currency: account.currency,
        currentBalance: account.currentBalance
      } : null
    });

  } catch (err: any) {
    console.error("Update Settings Error:", err);
    
    // If MongoDB throws a size limit error (Document exceeds 16MB)
    if (err.code === 10334 || err.message.includes("too large")) {
      return res.status(413).json({ message: "Image data is too large for the database." });
    }

    return res.status(500).json({ message: "Failed to update settings" });
  }
};


