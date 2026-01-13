import { Response, NextFunction } from "express";
import { AuthRequest } from "./auth.middleware"; 
import { Role } from "../models/User";

export const isOwner = (req: AuthRequest, res: Response, next: NextFunction) => {
    const user = req.user;

    if (!user || !user.roles.includes(Role.OWNER)) {
        return res.status(403).json({ 
            message: "Forbidden: Only an account OWNER can perform this action." 
        });
    }

    next();
};