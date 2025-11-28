import { Request , Response} from "express"
import { MonthlyAllocation } from "../models/MonthlyAllocations"
import { error } from "console"
import { Category } from "../models/Category"

export const createOrUpdateMonthlyAllocation = async (req : Request , res : Response) => {
    try{
        const { userId , accountId , month , year , income } = req.body

        let allocation = await  MonthlyAllocation.findOne({userId , accountId , month , year})
        if(!allocation){
            allocation = new MonthlyAllocation({
                userId,
                accountId,
                month,
                year,
                totalAllocated:0,
                remainingBalance:income,
                carryForwardSavings:0,
            })
            await allocation.save()
        }

        return res.json(allocation)

    }catch(err){
        console.error(err)
        res.status(500).json({error:"Server error"})
    }
}

// add category / expenses

export const addCategory = async (req:Request , res:Response)   => {
    try{
        const { monthlyAllocationId , name , budget} = req.body

        let category = await Category.findOne({
            monthlyAllocationId,
            name
        })

        if(!category){
            category = new Category({
                monthlyAllocationId , 
                name ,
                budget,
                spent:0
            })
            await category?.save()
        }

        //update monthly allocation totals

        const allocation = await MonthlyAllocation.findById(monthlyAllocationId)
        if(allocation){
            allocation.totalAllocated += budget
            allocation.remainingBalance -= budget
            await allocation.save()
        }

        res.json(category)
        

    }catch(err) {
        console.error(err);
        res.status(500).json({ error: "Server error" });
    }
}

//get monthly allocation

export const getMonthlyAllocation = async (req:Request , res: Response) => {
    try{
        const { userId , accountId , month , year } = req.params

        const allocation = await MonthlyAllocation.findOne({
            userId , 
            accountId ,
            month: Number(month),
            year: Number(year),
        })

        if(!allocation){
            return res.status(404).json({message : "No allocation found!"})
        }

        const categories = await Category.find({
            monthlyAllocationId:allocation._id
        })
        res.json({allocation , categories})
    }catch(err){
        console.error(error);
        res.status(500).json({ error: "Server error" });
    }
}