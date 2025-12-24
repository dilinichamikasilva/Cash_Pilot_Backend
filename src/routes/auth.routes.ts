import {Router} from "express"
import {registerUser , loginUser , refreshToken , getMe , checkEmail , completeRegistration ,updateProfilePicture , logoutUser } from "../controller/auth.controller"
import { authMiddleWare } from "../middleware/auth.middleware"
import {googleLogin} from "../controller/googgle.controller"


const router = Router()

router.post("/register" , registerUser)
router.post("/login" , loginUser)
router.post("/refresh-token" , refreshToken)
router.get("/me" , authMiddleWare ,  getMe)
router.post("/check-email" , checkEmail)
router.post("/google" , googleLogin)
router.put("/complete-registration" , authMiddleWare ,  completeRegistration )
router.put("/profile-picture", authMiddleWare, updateProfilePicture);
router.post("/logout", logoutUser);




export default router