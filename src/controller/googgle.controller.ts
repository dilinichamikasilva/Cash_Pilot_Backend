import { Request, Response } from "express";
import { OAuth2Client } from "google-auth-library";
import { User , Role } from "../models/User";
import { Account, AccountType } from "../models/Accounts";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";

dotenv.config();

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);
const JWT_SECRET = process.env.JWT_SECRET as string;
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET as string;

export const googleLogin = async (req: Request, res: Response) => {
  try {
    const { id_token } = req.body;

    if (!id_token) {
      return res.status(400).json({ message: "Google token is required" });
    }

    
    const ticket = await client.verifyIdToken({
      idToken: id_token,
      audience: process.env.GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();
    if (!payload) {
      return res.status(400).json({ message: "Invalid Google token" });
    }

    const { email, name, picture } = payload;

    if (!email) {
      return res.status(400).json({ message: "Google email not found" });
    }

    
    let user = await User.findOne({ email });

    
    if (!user) {
      const newAccount = await Account.create({
        name: `${name}'s Account`,
        accountType: AccountType.PERSONAL,
        currency: "USD",
        openingBalance: 0,
        currentBalance: 0,
      });

      user = await User.create({
        accountId: newAccount._id,
        name,
        email,
        isGoogleUser: true,
        picture,
        password: "", 
        country: "Unknown",
        mobile: "",
        roles: [Role.USER],
       
      });
    }

  
    const accessToken = jwt.sign(
      {
        userId: user._id,
        accountId: user.accountId,
        roles: user.roles,
      },
      JWT_SECRET,
      { expiresIn: "15m" }
    );

    const refreshToken = jwt.sign({ userId: user._id }, JWT_REFRESH_SECRET, {
      expiresIn: "7d",
    });

    
    return res.json({
      message: "Logged in with Google",
      accessToken,
      refreshToken,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        roles: user.roles,
        accountId: user.accountId,
        picture: user.picture,
      },
    });
  } catch (err) {
    console.error("Google Login Error:", err);
    return res.status(500).json({ message: "Server error" });
  }
};
