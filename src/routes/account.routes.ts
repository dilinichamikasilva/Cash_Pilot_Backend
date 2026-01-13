import {Router} from "express"
import { getAccountById } from "../controller/auth.controller"
import { authMiddleWare } from "../middleware/auth.middleware"
import { isOwner } from "../middleware/role.middleware"
import { inviteUserToBusiness } from "../controller/member.controller"

const router = Router()

router.get("/:id", authMiddleWare, getAccountById)
router.post("/add-member", authMiddleWare, isOwner, inviteUserToBusiness);

export default router