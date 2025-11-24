import { Request , Response , NextFunction} from "express";
import jwt from "jsonwebtoken"
import dotenv from "dotenv"

dotenv.config()

const JWT_SECRET = process.env.JWT_SECRET as string

export interface AuthRequest extends Request{
    user?: any
}

export const authMiddleWare = (req: AuthRequest , res:Response , next:NextFunction) => {
    const authHeader = req.headers.authorization

    if(!authHeader || !authHeader.startsWith("Bearer ")) {
        return res.status(401).json({message : "Unauthorized : No token provided"})
    }

    const token = authHeader.split(" ")[1]

    try{
        const decode = jwt.verify(token, JWT_SECRET) as any
        req.user = decode
        next()
    }catch(err){
        return res.status(401).json({message : "Unauthorized : Invalid token"})
    }
}