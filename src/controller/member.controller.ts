import { Request, Response } from "express";
import { User, Role } from "../models/User";
import { Account, AccountType } from "../models/Accounts";
import { AuthRequest } from "../middleware/auth.middleware";
import { AccountUser, AccountRole } from "../models/AccountUser";

export const inviteUserToBusiness = async (req: AuthRequest, res: Response) => {
  try {
    const { email, roleToAssign } = req.body;
    const ownerAccountId = req.user.accountId; // Taken from JWT token

    // 1. Verify the account is a Business
    const account = await Account.findById(ownerAccountId);
    if (!account || account.accountType !== AccountType.BUSINESS) {
      return res.status(400).json({ message: "Users can only be added to BUSINESS accounts." });
    }

    // 2. Find the user being invited
    const invitedUser = await User.findOne({ email });
    if (!invitedUser) {
      return res.status(404).json({ message: "User not found. They must sign up for CashPilot first." });
    }

    // 3. Prevent duplicate entry
    const existingMember = await AccountUser.findOne({ 
      accountId: ownerAccountId, 
      userId: invitedUser._id 
    });
    
    if (existingMember) {
      return res.status(400).json({ message: "User is already a member of this account." });
    }

    // 4. Create the link in AccountUser collection
    await AccountUser.create({
      accountId: ownerAccountId,
      userId: invitedUser._id,
      accountRole: roleToAssign || AccountRole.USER,
    });

    // 5. Update the User's roles array to include their new access (optional but helpful)
    if (!invitedUser.roles.includes(roleToAssign)) {
        invitedUser.roles.push(roleToAssign);
        await invitedUser.save();
    }

    return res.status(200).json({ message: `Successfully added ${invitedUser.name} to business.` });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Failed to add member." });
  }
};