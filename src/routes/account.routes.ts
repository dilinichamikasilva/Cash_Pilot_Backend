import {Router} from "express"
import { getAccountById } from "../controller/auth.controller"
import { authMiddleWare } from "../middleware/auth.middleware"

const router = Router()

router.get("/:id", authMiddleWare, getAccountById)


export default router