import express from "express"
import cors from "cors"
import dotenv from "dotenv"
import connectDB from "./config/db";
import authRoutes from "./routes/auth.routes"
import budgetRoutes from "./routes/budget.routes"
import accounteRoutes from "./routes/account.routes"
import categoryRoutes from "./routes/category.routes"
import analyticsRoutes from "./routes/analytics.routes"
import { errorHandler } from "./middleware/errorHandler"
import transactionRoutes from "./routes/transaction.routes";

dotenv.config()

const SERVER_PORT = process.env.SERVER_PORT
const MONGO_URI = process.env.MONGO_URI as string

const app = express()

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));

const allowedOrigins = [process.env.CLIENT_URL, "http://localhost:5173"].filter(Boolean) as string[];

app.use(
  cors({
    origin: allowedOrigins,
    credentials: true,
  })
);

app.use("/api/v1/auth" , authRoutes)
app.use("/api/v1/account" , accounteRoutes)
app.use("/api/v1/budget" , budgetRoutes)
app.use("/api/v1/category", categoryRoutes);
app.use("/api/v1/transaction", transactionRoutes);
app.use("/api/v1/analytics", analyticsRoutes);

app.use(errorHandler)

export default app;

// connectDB(MONGO_URI).then(() => {
//   app.listen(SERVER_PORT, () => {
//     console.log(`Server is running on port ${SERVER_PORT}`);
//   });
// });

connectDB(MONGO_URI).then(() => {
  if (process.env.NODE_ENV !== 'production') {
    app.listen(SERVER_PORT, () => {
      console.log(`Server is running locally on port ${SERVER_PORT}`);
    });
  }
});