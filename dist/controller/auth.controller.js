"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.resetPassword = exports.forgotPassword = exports.updateSettings = exports.logoutUser = exports.getAccountById = exports.updateProfilePicture = exports.completeRegistration = exports.checkEmail = exports.getMe = exports.refreshToken = exports.loginUser = exports.registerUser = void 0;
const bcrypt_1 = __importDefault(require("bcrypt"));
const User_1 = require("../models/User");
const Accounts_1 = require("../models/Accounts");
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const resend_1 = require("resend");
const crypto_1 = __importDefault(require("crypto"));
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const JWT_SECRET = process.env.JWT_SECRET;
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET;
const resend = new resend_1.Resend(process.env.RESEND_API_KEY);
//user registration
const registerUser = async (req, res) => {
    try {
        const { name, email, password, confirmPassword, country, mobile, accountName, accountType, currency, openingBalance, } = req.body;
        if (!name ||
            !email ||
            !password ||
            !confirmPassword ||
            !country ||
            !mobile ||
            !accountName ||
            !accountType ||
            !currency) {
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
        const existingUser = await User_1.User.findOne({ email });
        if (existingUser) {
            return res.status(409).json({ message: "This email is already registered!" });
        }
        // Hash password
        const hashedPassword = await bcrypt_1.default.hash(password, 10);
        // Create account
        const newAccount = await Accounts_1.Account.create({
            name: accountName,
            accountType,
            currency,
            openingBalance: balance,
            currentBalance: balance,
        });
        //Set roles
        let roles = [User_1.Role.USER];
        if (accountType === Accounts_1.AccountType.BUSINESS) {
            roles = [User_1.Role.OWNER];
        }
        // Create user
        const newUser = await User_1.User.create({
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
    }
    catch (err) {
        console.error("Registration error:", err);
        return res.status(500).json({ message: "Internal server error" });
    }
};
exports.registerUser = registerUser;
// user login
const loginUser = async (req, res) => {
    try {
        const { email, password } = req.body;
        if (!email || !password) {
            return res.status(400).json({ message: "Email and password are required!" });
        }
        const user = await User_1.User.findOne({ email });
        if (!user) {
            return res.status(404).json({
                message: "Account not found. Please create an account first!"
            });
        }
        const isMatch = await bcrypt_1.default.compare(password, user.password);
        if (!isMatch) {
            return res.status(401).json({ message: "Invalid password! Please try again." });
        }
        const account = await Accounts_1.Account.findById(user.accountId);
        if (!account) {
            return res.status(404).json({ message: "Associated financial account not found" });
        }
        const accessToken = jsonwebtoken_1.default.sign({
            userId: user._id,
            accountId: user.accountId,
            roles: user.roles,
        }, JWT_SECRET, { expiresIn: "15m" });
        const refreshToken = jsonwebtoken_1.default.sign({ userId: user._id }, JWT_REFRESH_SECRET, { expiresIn: "7d" });
        return res.status(200).json({
            message: "Login successfully",
            accessToken,
            refreshToken,
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                roles: user.roles,
                accountId: user.accountId,
            },
            account: {
                id: account._id,
                name: account.name,
                accountType: account.accountType,
                currency: account.currency,
                currentBalance: account.currentBalance,
            },
        });
    }
    catch (err) {
        console.error("Login error : ", err);
        return res.status(500).json({ message: "Internal server error!" });
    }
};
exports.loginUser = loginUser;
// refresh token
const refreshToken = (req, res) => {
    const { token } = req.body;
    if (!token) {
        return res.status(401).json({ message: "Refresh token required!" });
    }
    try {
        const payload = jsonwebtoken_1.default.verify(token, JWT_REFRESH_SECRET);
        const accessToken = jsonwebtoken_1.default.sign({ userId: payload.userId }, JWT_SECRET, { expiresIn: "15m" });
        return res.status(200).json({ accessToken });
    }
    catch (err) {
        return res.status(403).json({ message: "Invalid refresh token" });
    }
};
exports.refreshToken = refreshToken;
// get me
const getMe = async (req, res) => {
    try {
        if (!req.user || !req.user.userId) {
            return res.status(401).json({ message: "Unauthorized" });
        }
        const user = await User_1.User.findById(req.user.userId);
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }
        const account = await Accounts_1.Account.findById(user.accountId);
        if (!account) {
            return res.status(404).json({ message: "Account not found" });
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
        });
    }
    catch (err) {
        console.error("GetMe error : ", err);
        res.status(500).json({ message: "Internal server error" });
    }
};
exports.getMe = getMe;
//check email
const checkEmail = async (req, res) => {
    try {
        const { email } = req.body;
        if (!email) {
            return res.status(400).json({
                available: false,
                message: "Email is required!"
            });
        }
        const existingUser = await User_1.User.findOne({ email });
        if (existingUser) {
            return res.json({ available: false });
        }
        return res.json({ available: true });
    }
    catch (err) {
        console.error("CheckEmail error:", err);
        return res.status(500).json({ available: false, message: "Server error" });
    }
};
exports.checkEmail = checkEmail;
// complete registration
const completeRegistration = async (req, res) => {
    try {
        const userId = req.user.userId;
        if (!userId) {
            return res.status(401).json({ message: "Unauthorized" });
        }
        const { mobile, country, picture, currency, openingBalance, accountType, role, } = req.body;
        if (!mobile || mobile.trim().length < 9) {
            return res.status(400).json({ message: "Enter a valid mobile number" });
        }
        const user = await User_1.User.findById(userId);
        if (!user)
            return res.status(404).json({ message: "User not found" });
        const account = await Accounts_1.Account.findById(user.accountId);
        if (!account)
            return res.status(404).json({ message: "Account not found" });
        user.mobile = mobile;
        user.country = country;
        if (picture)
            user.picture = picture;
        if (accountType === "BUSINESS") {
            user.roles = [User_1.Role.OWNER];
        }
        // update account fields
        account.accountType = accountType === "BUSINESS" ? Accounts_1.AccountType.BUSINESS : Accounts_1.AccountType.PERSONAL;
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
    }
    catch (err) {
        console.error("Complete Registration Error:", err);
        return res.status(500).json({ message: "Server error" });
    }
};
exports.completeRegistration = completeRegistration;
const updateProfilePicture = async (req, res) => {
    const { picture } = req.body;
    if (!picture) {
        return res.status(400).json({ message: "No picture provided" });
    }
    const updated = await User_1.User.findByIdAndUpdate(req.user.userId, { picture }, { new: true });
    return res.json({ user: updated });
};
exports.updateProfilePicture = updateProfilePicture;
// GET account by ID
const getAccountById = async (req, res) => {
    try {
        const account = await Accounts_1.Account.findById(req.params.id);
        if (!account) {
            return res.status(404).json({ message: "Account not found" });
        }
        return res.json({ account });
    }
    catch (err) {
        console.error("GetAccount error:", err);
        return res.status(500).json({ message: "Server error" });
    }
};
exports.getAccountById = getAccountById;
// Logout user
const logoutUser = async (req, res) => {
    try {
        const { refreshToken } = req.body;
        if (!refreshToken) {
            return res.status(400).json({ message: "Refresh token is required!" });
        }
        return res.status(200).json({
            message: "Logged out successfully from server."
        });
    }
    catch (err) {
        console.error("Logout error:", err);
        return res.status(500).json({ message: "Internal server error" });
    }
};
exports.logoutUser = logoutUser;
// Update User Settings
const updateSettings = async (req, res) => {
    try {
        const userId = req.user?.userId;
        if (!userId) {
            return res.status(401).json({ message: "Unauthorized" });
        }
        const { name, country, mobile, picture, accountName } = req.body;
        const user = await User_1.User.findById(userId);
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }
        if (name !== undefined)
            user.name = name;
        if (country !== undefined)
            user.country = country;
        if (mobile !== undefined)
            user.mobile = mobile;
        if (picture !== undefined)
            user.picture = picture;
        await user.save();
        let account = await Accounts_1.Account.findById(user.accountId);
        if (account && accountName) {
            account.name = accountName;
            await account.save();
        }
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
    }
    catch (err) {
        console.error("Update Settings Error:", err);
        if (err.code === 10334 || err.message.includes("too large")) {
            return res.status(413).json({ message: "Image data is too large for the database." });
        }
        return res.status(500).json({ message: "Failed to update settings" });
    }
};
exports.updateSettings = updateSettings;
//  FORGOT PASSWORD - Generate token and send email
const forgotPassword = async (req, res) => {
    try {
        const { email } = req.body;
        const user = await User_1.User.findOne({ email });
        if (!user) {
            return res.status(404).json({ message: "User with this email does not exist." });
        }
        const resetToken = crypto_1.default.randomBytes(32).toString("hex");
        user.resetPasswordToken = crypto_1.default.createHash("sha256").update(resetToken).digest("hex");
        user.resetPasswordExpires = new Date(Date.now() + 3600000);
        await user.save();
        const resetUrl = `${process.env.CLIENT_URL}/reset-password?token=${resetToken}`;
        // Send the email
        await resend.emails.send({
            from: 'CashPilot <onboarding@resend.dev>',
            to: email,
            subject: 'Reset Your CashPilot Password',
            html: `
        <h1>Password Reset Request</h1>
        <p>You requested a password reset. Please click the link below to set a new password:</p>
        <a href="${resetUrl}" style="background: #4f46e5; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Reset Password</a>
        <p>This link will expire in 1 hour.</p>
      `
        });
        res.status(200).json({ message: "Reset link sent to your email!" });
    }
    catch (err) {
        res.status(500).json({ message: "Error sending email." });
    }
};
exports.forgotPassword = forgotPassword;
// RESET PASSWORD - Update the password in DB
const resetPassword = async (req, res) => {
    try {
        const { token, password } = req.body;
        const hashedToken = crypto_1.default.createHash("sha256").update(token).digest("hex");
        const user = await User_1.User.findOne({
            resetPasswordToken: hashedToken,
            resetPasswordExpires: { $gt: Date.now() }
        });
        if (!user) {
            return res.status(400).json({ message: "Invalid or expired token." });
        }
        // Hash new password and clear reset fields
        user.password = await bcrypt_1.default.hash(password, 10);
        user.resetPasswordToken = undefined;
        user.resetPasswordExpires = undefined;
        await user.save();
        res.status(200).json({ message: "Password updated successfully!" });
    }
    catch (err) {
        res.status(500).json({ message: "Failed to reset password." });
    }
};
exports.resetPassword = resetPassword;
