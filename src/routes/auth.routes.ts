import {Router} from "express"
import {registerUser , loginUser , refreshToken , getMe} from "../controller/auth.controller"
import { authMiddleWare } from "../middleware/auth.middleware"

const router = Router()

router.post("/register" , registerUser)
router.post("/login" , loginUser)
router.post("/refresh-token" , refreshToken)
router.post("/me" , authMiddleWare ,  getMe)

export default router