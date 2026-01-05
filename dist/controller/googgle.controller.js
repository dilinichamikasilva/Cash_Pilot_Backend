"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.googleLogin = void 0;
const google_auth_library_1 = require("google-auth-library");
const User_1 = require("../models/User");
const Accounts_1 = require("../models/Accounts");
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const client = new google_auth_library_1.OAuth2Client(process.env.GOOGLE_CLIENT_ID);
const JWT_SECRET = process.env.JWT_SECRET;
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET;
const googleLogin = async (req, res) => {
    try {
        const { id_token } = req.body;
        if (!id_token) {
            return res.status(400).json({ message: "Google token is required" });
        }
        // verify google token
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
        let user = await User_1.User.findOne({ email });
        // if email already registered but not a google user - block google login
        if (user && !user.isGoogleUser) {
            return res.status(400).json({
                message: "This email is registered using a password. Please login normally."
            });
        }
        // existing google user - login directly
        if (user && user.isGoogleUser) {
            const accessToken = jsonwebtoken_1.default.sign({
                userId: user._id,
                accountId: user.accountId,
                roles: user.roles
            }, JWT_SECRET, { expiresIn: "15m" });
            const refreshToken = jsonwebtoken_1.default.sign({ userId: user._id }, JWT_REFRESH_SECRET, { expiresIn: "7d" });
            return res.json({
                message: "Google login successful",
                isNewUser: false,
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
        }
        // new google user -> create account + create user
        if (!user) {
            const newAccount = await Accounts_1.Account.create({
                name: `${name}'s Account`,
                accountType: Accounts_1.AccountType.PERSONAL,
                currency: "LKR",
                openingBalance: 0,
                currentBalance: 0,
            });
            user = await User_1.User.create({
                accountId: newAccount._id,
                name,
                email,
                isGoogleUser: true,
                picture,
                password: "",
                country: "Sri Lanka",
                mobile: "",
                roles: [User_1.Role.USER],
            });
        }
        // tokens for new google user
        const accessToken = jsonwebtoken_1.default.sign({
            userId: user._id,
            accountId: user.accountId,
            roles: user.roles,
        }, JWT_SECRET, { expiresIn: "15m" });
        const refreshToken = jsonwebtoken_1.default.sign({ userId: user._id }, JWT_REFRESH_SECRET, {
            expiresIn: "7d",
        });
        return res.json({
            message: "Google login successful!",
            isNewUser: true,
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
    }
    catch (err) {
        console.error("Google Login Error:", err);
        return res.status(500).json({ message: "Server error" });
    }
};
exports.googleLogin = googleLogin;
