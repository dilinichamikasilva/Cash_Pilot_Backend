"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const dotenv_1 = __importDefault(require("dotenv"));
const db_1 = __importDefault(require("./config/db"));
const auth_routes_1 = __importDefault(require("./routes/auth.routes"));
const budget_routes_1 = __importDefault(require("./routes/budget.routes"));
const account_routes_1 = __importDefault(require("./routes/account.routes"));
const category_routes_1 = __importDefault(require("./routes/category.routes"));
const analytics_routes_1 = __importDefault(require("./routes/analytics.routes"));
const errorHandler_1 = require("./middleware/errorHandler");
const transaction_routes_1 = __importDefault(require("./routes/transaction.routes"));
dotenv_1.default.config();
const SERVER_PORT = process.env.SERVER_PORT;
const MONGO_URI = process.env.MONGO_URI;
const app = (0, express_1.default)();
app.use(express_1.default.json({ limit: '10mb' }));
app.use(express_1.default.urlencoded({ limit: '10mb', extended: true }));
app.use((0, cors_1.default)({
    origin: ["https://cash-pilot-frontend-qdgt.vercel.app",
        "https://cash-pilot-frontend-qdgt.vercel.app/", "http://localhost:5173"],
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: true
}));
app.use("/api/v1/auth", auth_routes_1.default);
app.use("/api/v1/account", account_routes_1.default);
app.use("/api/v1/budget", budget_routes_1.default);
app.use("/api/v1/category", category_routes_1.default);
app.use("/api/v1/transaction", transaction_routes_1.default);
app.use("/api/v1/analytics", analytics_routes_1.default);
app.use(errorHandler_1.errorHandler);
(0, db_1.default)(MONGO_URI).then(() => {
    app.listen(SERVER_PORT, () => {
        console.log(`Server is running on port ${SERVER_PORT}`);
    });
});
