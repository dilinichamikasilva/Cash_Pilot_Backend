import express from "express"
import cors from "cors"
import dotenv from "dotenv"
import connectDB from "./config/db";
import authRoutes from "./routes/auth.routes"
import budgetRoutes from "./routes/budget.routes"
import { errorHandler } from "./middleware/errorHandler"

dotenv.config()

const SERVER_PORT = process.env.SERVER_PORT
const MONGO_URI = process.env.MONGO_URI as string

const app = express()


app.use(express.json())
app.use(
    cors({
        origin: ["http://localhost:5173"],
        methods: ["GET", "POST", "PUT", "DELETE"]
    })
)

app.use("/api/v1/auth" , authRoutes)
app.use("api/v1/budget" , budgetRoutes)

app.use(errorHandler)

connectDB(MONGO_URI).then(() => {
  app.listen(SERVER_PORT, () => {
    console.log(`Server is running on port ${SERVER_PORT}`);
  });
});