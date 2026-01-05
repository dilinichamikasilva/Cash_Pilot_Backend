"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cloudinary_1 = require("../config/cloudinary");
const transaction_controller_1 = require("../controller/transaction.controller");
const auth_middleware_1 = require("../middleware/auth.middleware");
const router = express_1.default.Router();
router.post("/add-expense", auth_middleware_1.authMiddleWare, cloudinary_1.upload.single("billImage"), transaction_controller_1.createTransaction);
router.get("/history/:allocationCategoryId", auth_middleware_1.authMiddleWare, transaction_controller_1.getTransactionsByCategory);
router.delete("/delete/:id", auth_middleware_1.authMiddleWare, transaction_controller_1.deleteTransaction);
exports.default = router;
