import  express  from "express";
import { 
    createOrUpdateMonthlyAllocation , 
    addCategory , 
    getMonthlyAllocation
} from "../controller/budgetController"

const router = express.Router()

router.post("/monthly-allocation", createOrUpdateMonthlyAllocation)
router.post("/category", addCategory)
router.get("/:userId/:accountId/:month/:year", getMonthlyAllocation)

export default router